import argparse
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import io
import base64
import os
import re
import easyocr
from flask import Flask, request, jsonify
from flask_cors import CORS

# Determine model directory relative to script or root
current_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(current_dir, "EasyOCR")
if not os.path.exists(model_dir):
    model_dir = os.path.join(current_dir, "..", "EasyOCR")

# Initialize EasyOCR Reader
reader = easyocr.Reader(["en"], model_storage_directory=model_dir)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

def extract_text_from_image(base64_image):
    try:
        # Strip data URL prefix if present
        if "," in base64_image:
            base64_clean = base64_image.split(",", 1)[1]
        elif base64_image.startswith("data:"):
            base64_clean = re.sub(r"^data:image\/[a-zA-Z]+;base64,", "", base64_image)
        else:
            base64_clean = base64_image

        # Fix padding if needed
        base64_clean = base64_clean.strip()
        missing_padding = len(base64_clean) % 4
        if missing_padding:
            base64_clean += "=" * (4 - missing_padding)

        # Convert the base64 image to bytes
        image_bytes = base64.b64decode(base64_clean)
        image_buffer = io.BytesIO(image_bytes)
        image = Image.open(image_buffer)

        # Preprocessing: convert to grayscale and enhance contrast
        image = image.convert("L")
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.8)

        # Convert PIL image to numpy array for EasyOCR
        open_cv_image = np.array(image)

        result = reader.readtext(open_cv_image, detail=0)
        if result:
            text = "".join(result).replace(" ", "").strip()
            # Remove any unwanted leading/trailing symbols that are not standard captcha chars
            text = re.sub(r"[^a-zA-Z0-9+=]", "", text)
            return text if text else "ABCDEF"
        else:
            return "ABCDEF"
    except Exception as e:
        return f"Error processing image: {str(e)}"

@app.route("/extract-text", methods=["POST", "OPTIONS"])
def extract_text():
    if request.method == "OPTIONS":
        return jsonify({"status": "preflight_ok"}), 200

    data = request.get_json(silent=True) or {}
    base64_image = data.get("image", "")

    if not base64_image:
        return jsonify({"error": "No base64 image string provided"}), 400

    extracted_text = extract_text_from_image(base64_image)
    return jsonify({"extracted_text": extracted_text, "status": "success"})

@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "IRCTC Captcha Solver",
        "ocr_engine": "EasyOCR"
    }), 200

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the OCR extraction server."
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host address to run the server on (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port to run the server on (default: 5000)",
    )
    args = parser.parse_args()

    # Run Flask server
    app.run(host=args.host, port=args.port)

