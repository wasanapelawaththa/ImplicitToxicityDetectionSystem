import os
import pandas as pd
from joblib import dump
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

LABELS = ["Non Toxic", "Offensive", "Hate", "Sexism", "Racism", "Sarcasm"]

def train_and_save(csv_path: str, model_out_path: str):
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["Text", "Label"])

    X = df["Text"].astype(str)
    y = df["Label"].astype(str)

    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=40000,
            min_df=2
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced"
        ))
    ])

    pipe.fit(X, y)

    os.makedirs(os.path.dirname(model_out_path), exist_ok=True)
    dump({"pipeline": pipe, "labels": LABELS}, model_out_path)
    return model_out_path

if __name__ == "__main__":
    # Adjust paths if you place final.csv elsewhere
    CSV_PATH = os.path.join(os.path.dirname(__file__), "final.csv")
    OUT_PATH = os.path.join(os.path.dirname(__file__), "models", "toxicity_pipeline.joblib")
    print("Training pipeline...")
    print("Saved to:", train_and_save(CSV_PATH, OUT_PATH))
