import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS  # Import CORS
import traceback
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

from backend.models.workflow import generate

app = Flask(__name__)
# Update CORS configuration to allow requests from the frontend development server
CORS(app)  # This allows all origins - only use for debugging!

llm = ChatAnthropic(
    model="claude-3-5-sonnet-20240620",
    temperature=0,
    max_tokens=8000,
    timeout=60,  # Increase this value
    max_retries=2,
    api_key=os.environ.get('ANTROPIC_API_KEY')
)

@app.route('/api/generate', methods=['POST'])
def generate_ui():
    app.logger.info(f"Received request from: {request.remote_addr}")
    app.logger.info(f"Request headers: {request.headers}")
    app.logger.info(f"Request data: {request.get_data()}")
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
        
        response = llm.invoke([
            SystemMessage(content="You senior react developer helps with react code"),
            HumanMessage(content=f"Keeps all nlmk components, improve this code visiability and style, it should full complited component. add style and other code if needed to improve this ui. returns only code and nothing else. no markdown, no text, no comments, no explanation, no nothing, just code. Here is the code, improve it: {result}"),
        ])
        
        return jsonify({"result": response.content})
    
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


@app.route('/api/update-preview', methods=['POST', 'OPTIONS'])
def update_preview():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "POST":
        code = request.json['code']
        file_path = os.path.join(os.getcwd(), 'vite-preview-mode', 'my-app', 'src', 'Home', 'GeneratedComponent.tsx')

        try:
            directory = os.path.dirname(file_path)
            if not os.path.exists(directory):
                os.makedirs(directory)
                app.logger.info(f"Created directory: {directory}")

            with open(file_path, 'w') as file:
                file.write(code)
            app.logger.info(f"Successfully wrote to file: {file_path}")
            return _corsify_actual_response(jsonify({"message": "Code updated successfully"}))
        except Exception as e:
            error_message = f"Error updating file: {str(e)}\n{traceback.format_exc()}"
            app.logger.error(error_message)
            return _corsify_actual_response(jsonify({"error": error_message}), 500)

def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add('Access-Control-Allow-Headers', "Content-Type")
    response.headers.add('Access-Control-Allow-Methods', "POST, OPTIONS")
    return response

def _corsify_actual_response(response, status_code=200):
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    return response, status_code

@app.route('/ping', methods=['GET'])
def ping():
    app.logger.info("Received ping request")
    return jsonify({"message": "pong"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
