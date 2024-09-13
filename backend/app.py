from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import csv
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import CSVLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.schema import StrOutputParser, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableMap

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Initialize OpenAI components
openai_api_key = os.environ.get('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

llm = ChatOpenAI(temperature=0.0, api_key=openai_api_key, model="gpt-4o")
embeddings = OpenAIEmbeddings(api_key=openai_api_key)

# Define paths
COMPONENTS_DIR = "ds-2.0/src/components"  # Update this path to your local directory
OUTPUT_CSV = "combined_code.csv"
CHROMA_PERSIST_DIRECTORY = "chroma_db"

# Function to extract description and code from Stories.tsx
def extract_code_and_description(content):
    descriptions = []
    codes = []

    while 'description=' in content and 'code={' in content:
        # Extract description
        desc_start = content.find('description="') + len('description="')
        desc_end = content.find('"', desc_start)
        description = content[desc_start:desc_end]
        descriptions.append(description)

        # Extract code block with balanced braces
        code_start = content.find('code={') + len('code={')
        brace_count = 1
        code_end = code_start

        while brace_count > 0 and code_end < len(content):
            if content[code_end] == '{':
                brace_count += 1
            elif content[code_end] == '}':
                brace_count -= 1
            code_end += 1

        # Extract code content
        code_block = content[code_start:code_end - 1].strip()  # Exclude the final '}'
        codes.append(code_block)

        # Remove processed part from content
        content = content[code_end:]

    # Combine description and code, format description as comment
    result = []
    for desc, code in zip(descriptions, codes):
        result.append(f"// {desc}\n{code}")

    # Join all extracted parts with a double new line
    return "\n\n".join(result)

# Function to check if 'isStable' exists in Stories.tsx and gather formatted code
def get_stories_content(stories_path, component_name):
    if os.path.isfile(stories_path):
        with open(stories_path, "r") as stories_file:
            content = stories_file.read()
            if "isStable" in content:
                formatted_content = extract_code_and_description(content)
                if formatted_content:
                    relative_path = f"{component_name}_how_to_use"
                    return [f"{component_name} / {relative_path}", formatted_content]
    return []

# Function to fetch the full file content without splitting
def get_file_content(file_path, component_name, relative_path):
    with open(file_path, "r") as file:
        content = file.read()
        return [f"{component_name} / {relative_path}", content]

# Recursive function to fetch content from component files
def process_folder(folder_path, component_name):
    file_rows = []
    stories_path = os.path.join(folder_path, "_stories", "Stories.tsx")
    stories_content = get_stories_content(stories_path, component_name)
    
    if not stories_content:
        return []
    
    file_rows.append(stories_content)
    
    for file_name in ["types.ts", "enums.ts"]:
        file_path = os.path.join(folder_path, file_name)
        if os.path.isfile(file_path):
            relative_path = os.path.relpath(file_path, folder_path)
            file_rows.append(get_file_content(file_path, component_name, relative_path))
    
    for root, _, files in os.walk(folder_path):
        for file_name in files:
            if file_name.endswith(".d.ts"):
                file_path = os.path.join(root, file_name)
                relative_path = os.path.relpath(file_path, folder_path)
                file_rows.append(get_file_content(file_path, component_name, relative_path))
    
    return file_rows

# Main function to combine code for all components and store in Chroma
def combine_code_and_store_in_chroma():
    all_rows = []
    
    for folder_name in os.listdir(COMPONENTS_DIR):
        folder_path = os.path.join(COMPONENTS_DIR, folder_name)
        
        if os.path.isdir(folder_path):
            file_rows = process_folder(folder_path, folder_name)
            all_rows.extend(file_rows)
    
    with open(OUTPUT_CSV, "w", newline='', encoding='utf-8') as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["File", "Content"])
        writer.writerows(all_rows)
    
    loader = CSVLoader(file_path=OUTPUT_CSV)
    documents = loader.load()
    
    # Print document lengths (optional, for debugging)
    print([len(doc.page_content) for doc in documents])
    
    db = Chroma.from_documents(documents, embeddings, persist_directory=CHROMA_PERSIST_DIRECTORY)
    db.persist()
    
    print(f"Combined code for all components written to {OUTPUT_CSV} and stored in Chroma database.")

# Run the combine_code_and_store_in_chroma function when the app starts
combine_code_and_store_in_chroma()

# Load the Chroma database
db = Chroma(persist_directory=CHROMA_PERSIST_DIRECTORY, embedding_function=embeddings)
retriever = db.as_retriever()

# Define the prompt template
template = """
Generate typescript react code.u
Use only nlmk components described below in the following context
usage examples have how_to_use postfix in index
in every enums.ts file you have values of properties for each component:
{context}

Question: {question}

The final code should follow the following structure:
{code_sample}

now very important: you can make imports only from nlmk.
do not forget to import react
"""
prompt = ChatPromptTemplate.from_template(template)

# Define the format_docs function
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Update the chain definition
chain = (
    {
        "context": lambda x: format_docs(retriever.get_relevant_documents(x["question"])),
        "question": lambda x: x["question"],
        "code_sample": lambda x: x["code_sample"]
    }
    | prompt
    | llm
    | StrOutputParser()
)

@app.route('/generate', methods=['POST'])
def generate_ui():
    data = request.json
    app.logger.info(f"Received data: {data}")
    
    if not data or 'question' not in data:
        return jsonify({"error": "Invalid or missing question in request"}), 400
    
    question = data['question']
    code_sample = data.get('code_sample', '')
    
    try:
        app.logger.info(f"Question: {question}")
        app.logger.info(f"Code sample: {code_sample}")
        
        result = chain.invoke({"question": question, "code_sample": code_sample})
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
    app.run(host='0.0.0.0', port=5001, debug=True)
