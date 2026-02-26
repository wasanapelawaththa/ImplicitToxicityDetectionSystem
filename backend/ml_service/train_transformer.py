import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, accuracy_score
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
import torch

from preprocessing.normalize import normalize_si_text

APP_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(APP_DIR, "final.csv")

OUT_DIR = os.path.join(APP_DIR, "models", "transformer")
LABEL_MAP_PATH = os.path.join(OUT_DIR, "label_map.json")

# You can change this later if you find a better Sinhala-ready checkpoint
MODEL_NAME = "xlm-roberta-base"

class ToxicDataset(torch.utils.data.Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=192):
        self.enc = tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=max_len
        )
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.enc.items()}
        item["labels"] = torch.tensor(self.labels[idx])
        return item

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=1)
    return {
        "acc": accuracy_score(labels, preds),
        "f1_weighted": f1_score(labels, preds, average="weighted")
    }

def main():
    df = pd.read_csv(CSV_PATH).dropna(subset=["Text", "Label"])
    df["Text"] = df["Text"].astype(str).apply(normalize_si_text)
    df["Label"] = df["Label"].astype(str)

    labels = sorted(df["Label"].unique().tolist())
    label2id = {l: i for i, l in enumerate(labels)}
    id2label = {i: l for l, i in label2id.items()}

    y = df["Label"].map(label2id).to_numpy(dtype=int)
    X = df["Text"].astype(str).to_list()   # <-- IMPORTANT: make it a normal Python list

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(labels),
        id2label=id2label,
        label2id=label2id
    )

    train_ds = ToxicDataset(list(X_train), list(y_train), tokenizer)
    val_ds   = ToxicDataset(list(X_val), list(y_val), tokenizer)
    
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(LABEL_MAP_PATH, "w", encoding="utf-8") as f:
        json.dump({"labels": labels, "label2id": label2id, "id2label": id2label}, f, ensure_ascii=False, indent=2)

    args = TrainingArguments(
        output_dir=OUT_DIR,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=3,
        weight_decay=0.01,
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1_weighted",
        greater_is_better=True,
        fp16=torch.cuda.is_available()
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        compute_metrics=compute_metrics
    )

    trainer.train()

    trainer.save_model(OUT_DIR)
    tokenizer.save_pretrained(OUT_DIR)
    print("✅ Transformer saved to:", OUT_DIR)

if __name__ == "__main__":
    main()