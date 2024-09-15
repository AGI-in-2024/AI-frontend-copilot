import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

from backend.models.workflow import generate

app = Flask(__name__)
CORS(app, resources={r"/generate": {"origins": "http://localhost:3000"}})  # Replace with your frontend URL

@app.route('/generate', methods=['POST'])
def generate_ui():
    app.logger.info("Received request to /generate")
    data = request.json
    app.logger.info(f"Received data: {data}")

    if not data or 'question' not in data:
        app.logger.error("Invalid or missing question in request")
        return jsonify({"error": "Invalid or missing question in request"}), 400

    question = data['question']

    try:
        app.logger.info(f"Processing question: {question}")
        result = generate(question)
        app.logger.info(f"Generated result: {result[:100]}...")  # Log first 100 chars
        return jsonify({"result": result})
    except Exception as e:  
        app.logger.error(f"Error in generate_ui: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


# Add this new route for debugging
@app.route('/debug', methods=['POST'])
def debug_request():
    data = request.json
    app.logger.info(f"Debug request received: {data}")
    return jsonify({
        "received_data": data,
        "content_type": request.content_type,
        "headers": dict(request.headers)
    })


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200


@app.route('/update-preview', methods=['POST'])
def update_preview():
    code = request.json['code']
    file_path = '../vite-preview-mode/my-app/src/Home/index.tsx'
    
    try:
        with open(file_path, 'w') as file:
            file.write(code)
        return jsonify({"message": "Code updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
