from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
import json
import os

app = Flask(__name__, static_folder='../', static_url_path='')
CORS(app)

# Load trained model
model = tf.keras.models.load_model("defect_model_best.h5")
print("Model loaded successfully")

# Load class names
if os.path.exists('class_indices.json'):
    with open('class_indices.json', 'r') as f:
        class_indices = json.load(f)
    class_names = [name for name, idx in sorted(class_indices.items(), key=lambda x: x[1])]
else:
    class_names = ['Crazing', 'Inclusion', 'Patches', 'Pitted', 'Rolled', 'Scratches']

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files['image']
    image_bytes = image_file.read()
    
    nparr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return jsonify({"error": "Could not decode image"}), 400
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = img.astype(np.float32) / 255.0
    img = np.expand_dims(img, axis=0)

    predictions = model.predict(img, verbose=0)
    pred_array = predictions[0] if len(predictions.shape) > 1 else predictions
    
    class_index = int(np.argmax(pred_array))
    confidence = float(np.max(pred_array))
    
    all_probs = {class_names[i]: float(pred_array[i]) for i in range(len(class_names))}
    sorted_probs = dict(sorted(all_probs.items(), key=lambda x: x[1], reverse=True))

    return jsonify({
        "defect": class_names[class_index],
        "confidence": f"{confidence * 100:.2f}%",
        "all_predictions": sorted_probs
    })

@app.route('/')
def index():
    return send_from_directory('../', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.endswith('.js'):
        return send_from_directory('../', path, mimetype='application/javascript')
    elif path.endswith('.css'):
        return send_from_directory('../', path, mimetype='text/css')
    elif path.endswith('.html'):
        return send_from_directory('../', path, mimetype='text/html')
    return send_from_directory('../', path)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

