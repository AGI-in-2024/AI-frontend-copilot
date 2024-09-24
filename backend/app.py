import os
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS  # Import CORS
import traceback
from langchain_openai import ChatOpenAI   # Import GPT-4
from langchain_core.messages import HumanMessage, SystemMessage

from backend.models.workflow import generate
from backend.models.prompts import get_ui_improvement_prompt  # Import the new function

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
    max_tokens=4000,
    timeout=None,
    max_retries=2,
    api_key=os.environ.get('OPENAI_API_KEY')
)

@app.route('/generate', methods=['POST'])
async def generate_ui():
    app.logger.info("Received request to /generate")
    data = request.json
    app.logger.info(f"Received data: {data}")

    if not data or 'question' not in data:
        return _handle_invalid_request()

    question = data['question']

    try:
        result = await _process_question(question)
        response = _invoke_llm(str(result), question)  # Pass the code to _invoke_llm
        return jsonify({"result": response.content})
    except Exception as e:
        return _handle_exception(e)

def _handle_invalid_request():
    app.logger.error("Invalid or missing question in request")
    return jsonify({"error": "Invalid or missing question in request"}), 400

async def _process_question(question):
    app.logger.info(f"Processing question: {question}")
    result = await generate(question)
    app.logger.info(f"Generated result: {result[:100]}...")  # Log first 100 chars
    # return jsonify({"result": result})
    return result

def _invoke_llm(result, question):  # Change to synchronous function
    prompt = get_ui_improvement_prompt(result, question)
    return llm.invoke([
        SystemMessage(content="You are a senior React developer."),
        HumanMessage(content=prompt)
    ])

def _handle_exception(e):
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


@app.route('/update-preview', methods=['POST', 'OPTIONS'])
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
    response.headers.add("Access-Control-Allow-Origin", "http://83.229.82.52:3000")
    response.headers.add('Access-Control-Allow-Headers', "Content-Type")
    response.headers.add('Access-Control-Allow-Methods', "POST, OPTIONS")
    return response

def _corsify_actual_response(response, status_code=200):
    response.headers.add("Access-Control-Allow-Origin", "http://83.229.82.52:3000")
    return response, status_code

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
