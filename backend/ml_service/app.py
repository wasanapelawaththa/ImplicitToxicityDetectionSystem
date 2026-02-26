import os
from typing import Dict, Any
from fastapi import FastAPI
from pydantic import BaseModel

from joblib import load
from train_pipeline import train_and_save

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import numpy as np
import json

from preprocessing.normalize import normalize_si_text

APP_DIR = os.path.dirname(__file__)

# Baseline model
BASELINE_PATH = os.path.join(APP_DIR, "models", "toxicity_pipeline.joblib")

# Transformer model folder
TRANSFORMER_DIR = os.path.join(APP_DIR, "models", "transformer")
LABEL_MAP_PATH = os.path.join(TRANSFORMER_DIR, "label_map.json")

CSV_PATH = os.path.join(APP_DIR, "final.csv")

class PredictIn(BaseModel):
    text: str

app = FastAPI(title="HugHub Toxicity Service")

_bundle: Dict[str, Any] | None = None

def load_transformer():
    if not os.path.isdir(TRANSFORMER_DIR) or not os.path.exists(LABEL_MAP_PATH):
        return None

    with open(LABEL_MAP_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    tokenizer = AutoTokenizer.from_pretrained(TRANSFORMER_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(TRANSFORMER_DIR)
    model.eval()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    return {"type": "transformer", "tokenizer": tokenizer, "model": model, "device": device, "labels": meta["labels"]}

def load_baseline():
    if not os.path.exists(BASELINE_PATH):
        if not os.path.exists(CSV_PATH):
            raise RuntimeError(f"final.csv not found at {CSV_PATH}. Put it inside backend/ml_service/")
        train_and_save(CSV_PATH, BASELINE_PATH)
    return {"type": "baseline", "pipe": load(BASELINE_PATH)["pipeline"]}

def get_bundle():
    global _bundle
    if _bundle is not None:
        return _bundle

    # Prefer transformer
    tr = load_transformer()
    if tr is not None:
        _bundle = tr
        return _bundle

    # Otherwise baseline
    _bundle = load_baseline()
    return _bundle

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/predict")
def predict(payload: PredictIn):
    text = (payload.text or "").strip()
    if not text:
        return {"is_toxic": False, "label": "Non Toxic", "score": 0.0}

    bundle = get_bundle()
    norm = normalize_si_text(text)

    if bundle["type"] == "transformer":
        tok = bundle["tokenizer"]
        model = bundle["model"]
        device = bundle["device"]

        inputs = tok(norm, return_tensors="pt", truncation=True, padding=True, max_length=192)
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            logits = model(**inputs).logits
            probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]

        best_i = int(np.argmax(probs))
        label = bundle["labels"][best_i]
        score = float(probs[best_i])
        is_toxic = (label != "Non Toxic")
        return {"is_toxic": is_toxic, "label": label, "score": round(score, 4)}

    # baseline
    pipe = bundle["pipe"]
    proba = pipe.predict_proba([norm])[0]
    classes = pipe.classes_
    best_i = int(proba.argmax())
    label = str(classes[best_i])
    score = float(proba[best_i])
    is_toxic = (label != "Non Toxic")
    return {"is_toxic": is_toxic, "label": label, "score": round(score, 4)}