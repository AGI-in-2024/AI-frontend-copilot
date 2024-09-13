from flask import Flask, request, jsonify
from flask_cors import CORS

from backend.models.workflow import generate

app = Flask(__name__)
CORS(app)


@app.route('/generate', methods=['POST'])
def generate_ui():
    data = request.json
    app.logger.info(f"Received data: {data}")

    if not data or 'question' not in data:
        return jsonify({"error": "Invalid or missing question in request"}), 400

    question = data['question']

    try:
        app.logger.info(f"Question: {question}")

        result = generate(question)
        app.logger.info(f"Result: {result}")

        return jsonify({"result": result})
    except Exception as e:
        app.logger.error(f"Error in generate_ui: {str(e)}")
        app.logger.error(f"Error type: {type(e)}")
        app.logger.error(f"Error args: {e.args}")
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
