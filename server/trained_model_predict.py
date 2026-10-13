#!/usr/bin/env python3
"""Small JSON-line adapter for the user's scikit-learn pickle model."""
import json
import pickle
import sys


def main():
    request = json.load(sys.stdin)
    with open(request["modelPath"], "rb") as model_file:
        model = pickle.load(model_file)
    features = request["features"]
    prediction = model.predict([features])[0]
    result = {"prediction": int(prediction) if hasattr(prediction, "item") else prediction}
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba([features])[0]
        result["probabilities"] = [float(value) for value in probabilities]
        result["classes"] = [value.item() if hasattr(value, "item") else value for value in model.classes_]
    print(json.dumps(result, allow_nan=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        raise
