import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    accuracy_score,
    roc_curve,
    auc
)
from sklearn.preprocessing import label_binarize
import seaborn as sns

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

from preprocessing.normalize import normalize_si_text

APP_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(APP_DIR, "final.csv")

MODEL_DIR = os.path.join(APP_DIR, "models", "transformer")
LABEL_MAP_PATH = os.path.join(MODEL_DIR, "label_map.json")
OUT_DIR = MODEL_DIR  # save plots here


def main():
    # Load label map
    with open(LABEL_MAP_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    labels = meta["labels"]
    label2id = meta["label2id"]

    # Load model + tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Load data
    df = pd.read_csv(CSV_PATH).dropna(subset=["Text", "Label"])
    df["Text"] = df["Text"].astype(str).apply(normalize_si_text)
    df["y"] = df["Label"].astype(str).map(label2id)

    X = df["Text"].to_list()
    y = df["y"].to_numpy(dtype=int)

    # Recreate split
    _, X_val, _, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    # Predict
    y_pred = []
    y_scores = []
    batch_size = 8

    for i in range(0, len(X_val), batch_size):
        batch_texts = X_val[i: i + batch_size]
        enc = tokenizer(
            batch_texts,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=192
        )
        enc = {k: v.to(device) for k, v in enc.items()}

        with torch.no_grad():
            logits = model(**enc).logits
            probs = torch.softmax(logits, dim=-1).cpu().numpy()
            preds = np.argmax(probs, axis=1)

        y_pred.extend(preds)
        y_scores.extend(probs)

    y_pred = np.array(y_pred)
    y_scores = np.array(y_scores)

    # Accuracy
    acc = accuracy_score(y_val, y_pred)
    print("Validation Accuracy:", round(acc, 4))

    # Confusion matrix
    cm = confusion_matrix(y_val, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d",
                xticklabels=labels,
                yticklabels=labels)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix")
    plt.savefig(os.path.join(OUT_DIR, "confusion_matrix.png"))
    plt.close()

    # Classification report
    report = classification_report(y_val, y_pred, target_names=labels)
    print("\nClassification Report:\n", report)
    with open(os.path.join(OUT_DIR, "classification_report.txt"), "w", encoding="utf-8") as f:
        f.write(report)

    # -----------------------------
    # ROC Curve (Multi-class OVR)
    # -----------------------------
    y_val_bin = label_binarize(y_val, classes=list(range(len(labels))))

    plt.figure(figsize=(8, 6))

    for i in range(len(labels)):
        fpr, tpr, _ = roc_curve(y_val_bin[:, i], y_scores[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f"{labels[i]} (AUC={roc_auc:.3f})")

    plt.plot([0, 1], [0, 1], linestyle="--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve (One-vs-Rest)")
    plt.legend()
    plt.savefig(os.path.join(OUT_DIR, "roc_curve.png"))
    plt.close()

    print("ROC Curve saved.")


if __name__ == "__main__":
    main()