import csv
import json
import os
import re
import asyncio
import chardet
from langchain_community.document_loaders import CSVLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

# COMPONENTS_DIR = "..\\..\\ds-2.0\\src\\components"
# OUTPUT_JSON_PATH = "./data/RAW_COMPONENTS_.json"
# OUTPUT_CSV_PATH = "./data/RAW_COMPONENTS_.csv"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMPONENTS_DIR = os.path.join(BASE_DIR, "..\\..\\ds-2.0\\src\\components")
OUTPUT_JSON_PATH = os.path.join(BASE_DIR, "data", "RAW_COMPONENTS_.json")
OUTPUT_CSV_PATH = os.path.join(BASE_DIR, "data", "RAW_COMPONENTS_.csv")
FAISS_DB_PATH = os.path.join(BASE_DIR, "data", "faiss_extended")

# Функция для поиска реального пути файла по его импорту
async def resolve_import_path(import_path: str, current_file_path: str) -> str | None:
    possible_extensions = ['', 'scss', '.ts', '.tsx', '.d.ts']

    if import_path.startswith("@"):
        print(import_path)
        import_path = import_path.replace('@components', '..\\..\\ds-2.0\\src\\components')
        component = current_file_path.split("\\")[5] # Current Component name
        if not import_path.startswith("@") and component in import_path:
            if os.path.isdir(import_path):
                tsx_file_path = os.path.join(import_path, 'index.tsx')
                if os.path.isfile(tsx_file_path):
                    return os.path.normpath(tsx_file_path)
                ts_file_path = os.path.join(import_path, 'index.ts')
                if os.path.isfile(ts_file_path):
                    return os.path.normpath(ts_file_path)
            else:
                for ext in possible_extensions:
                    if os.path.isfile(import_path + ext):
                        return import_path + ext
    else:
        # Определяем базовый путь как директорию текущего файла
        print(f"\nimp_path = {import_path}, current_file_path = {current_file_path}")
        base_path = os.path.dirname(current_file_path)
        full_path = os.path.normpath(os.path.join(base_path, import_path))

        print(f"full_path = {full_path}, base_path = {base_path}")
        if os.path.isdir(full_path):
            tsx_file_path = os.path.join(full_path, 'index.tsx')
            if os.path.isfile(tsx_file_path):
                return os.path.normpath(tsx_file_path)
            ts_file_path = os.path.join(full_path, 'index.ts')
            if os.path.isfile(ts_file_path):
                return os.path.normpath(ts_file_path)
        else:
            for ext in possible_extensions:
                if os.path.isfile(full_path + ext):
                    print(f"Found file: {full_path + ext}")
                    return full_path + ext


# Главная рекурсивная функция поиска файлов
async def deep_search(file_path: str, result: set):
    if not os.path.isfile(file_path):
        return
    else:
        result.add(file_path)
        with open(file_path, 'r', encoding='utf-8') as file:
            file_content = file.read()

        pattern = r'import\s+(?:{[^}]+}|\w+)\s+from\s+[\'"]([^\'"]+)[\'"]'
        imports = re.findall(pattern, file_content)

        tasks = []
        for imp in imports:
            resolved_path = await resolve_import_path(imp.replace("/", "\\"), file_path)
            if resolved_path and resolved_path not in result:
                tasks.append(deep_search(resolved_path, result))

        await asyncio.gather(*tasks)


# Функция для сбора данных по компоненту
async def collect_component_data(folder_path: str) -> tuple | None:
    stories_path = os.path.join(folder_path, '_stories', 'Stories.tsx')
    if not os.path.isfile(stories_path):
        return None
    else:
        with open(stories_path, 'r', encoding='utf-8') as stories_file:
            stories_content = stories_file.read()

        pattern = r'<Header\s+.*?description=(?P<description>{.*?}|"[^"]*").*?isStable.*?>'
        match = re.search(pattern, stories_content, re.DOTALL)

        if not match:
            return None
        else:
            description = match['description']
            title = os.path.basename(folder_path)
            print(f"\n\nPROCESSING {title} COMPONENT")

            result_files = set()

            # Начинаем рекурсивный поиск с файла Stories.tsx
            await deep_search(stories_path, result_files)

            # Ищем index.tsx в корне компонента
            index_path = os.path.join(folder_path, 'index.tsx')
            if os.path.isfile(index_path):
                await deep_search(index_path, result_files)

            return (
                title, {
                    "description": description,
                    "files": {path: open(path, 'r', encoding='utf-8').read() for path in result_files}
                }
            )


def save_to_json(components_data: dict, output_path: str):
    descriptions = {component: details["description"] for component, details in components_data.items() if
                    "description" in details}

    data = {"descriptions": descriptions}
    with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)


def ensure_utf8(text):
    if isinstance(text, str):
        return text.encode('utf-8').decode('utf-8')
    return text


def format_component_path(filename):
    path_parts = filename.split(os.sep)
    if 'components' in path_parts:
        idx = path_parts.index('components')
        return " ".join(path_parts[idx:])
    return filename


def save_to_csv(components_data: dict, output_path: str):
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Document Purpose', 'Content']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()

        for title, component_data in components_data.items():
            for filename, content in component_data['files'].items():
                if filename.endswith('.tsx'):
                    doc_type = f"Codes for {format_component_path(filename)}"
                elif filename.endswith('.ts'):
                    doc_type = f"Types for {format_component_path(filename)}"
                elif filename.endswith('.scss'):
                    doc_type = f"Styles for {format_component_path(filename)}"
                else:
                    continue

                writer.writerow({
                    'Document Purpose': ensure_utf8(doc_type),
                    'Content': ensure_utf8(content)
                })


async def process_all_components(components_base_path: str):
    components_data = {}
    for component_folder in os.listdir(components_base_path):
        folder_path = os.path.join(components_base_path, component_folder)
        if os.path.isdir(folder_path):
            component_data = await collect_component_data(folder_path)
            if component_data:
                components_data[f"{component_data[0]}"] = component_data[1]

    save_to_json(components_data, OUTPUT_JSON_PATH)
    save_to_csv(components_data, OUTPUT_CSV_PATH)


def parse_recursivly_store_faiss():

    if not os.path.isfile(OUTPUT_CSV_PATH):
        asyncio.run(process_all_components(COMPONENTS_DIR))
    if not os.path.isdir(FAISS_DB_PATH):
        loader = CSVLoader(file_path=OUTPUT_CSV_PATH, autodetect_encoding=True)
        documents = loader.load()
        embeddings = OpenAIEmbeddings()
        db = FAISS.from_documents(
            documents, embeddings)

        db.save_local(FAISS_DB_PATH)


def get_comps_descs() -> str:

    with open(OUTPUT_JSON_PATH, 'r', encoding="utf=8") as file:
        comps_descs = json.load(file)

    descs = []
    [descs.append(f' COMPONENT {k}: {v}') for k, v in comps_descs.items()]
    descs = "\n".join(descs)

    return descs
