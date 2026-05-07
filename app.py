from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    print('Received:', file.filename)
    return jsonify({'plant': 'Tulsi', 'confidence': 'high'})

if __name__ == '__main__':
    app.run(debug=True)
