from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files['file']
    print("Filename:", file.filename)
    print("Content Type:", file.content_type)
    
    # For now just print file name
    print("Received file:", file.filename)
    
    return jsonify({"plant": "Tulsi 🌿"})

if __name__ == '__main__':
    app.run(debug=True)
