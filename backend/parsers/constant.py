import csv
import os

from langchain_community.document_loaders import CSVLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Initialize OpenAI components
openai_api_key = os.environ.get('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

llm = ChatOpenAI(temperature=0.0, api_key=openai_api_key, model="gpt-4o-mini")
embeddings = OpenAIEmbeddings(api_key=openai_api_key)

COMPONENTS_DIR = "ds-2.0/src/components"  # Update this path to your local directory
OUTPUT_CSV = "./data/combined_code.csv"
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

    db = Chroma.from_documents(documents, embeddings, persist_directory=CHROMA_PERSIST_DIRECTORY)
    db.persist()

    print(f"Combined code for all components written to {OUTPUT_CSV} and stored in Chroma database.")