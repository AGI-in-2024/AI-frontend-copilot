import logging
import os
import re
from typing import Dict, Any, Union, List

from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import END
from langgraph.graph import StateGraph
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.models.errors_analizer import extract_component_by_error_line
from backend.models.prompts import code_sample, FUNNEL, INTERFACE_JSON, CODER, DEBUGGER
from backend.models.tsxvalidator.validator import TSXValidator
from backend.parsers.recursive import get_comps_descs, parse_recursivly_store_faiss

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_DB_PATH = os.path.join(BASE_DIR, "../parsers", "data", "faiss_extended")
openai_api_key = os.environ.get('OPENAI_API_KEY')
try:
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    llm = ChatOpenAI(temperature=0.0, api_key=openai_api_key, model="gpt-4o-mini")
    embeddings = OpenAIEmbeddings(api_key=openai_api_key)
    parse_recursivly_store_faiss()
    db = FAISS.load_local(
        FAISS_DB_PATH, embeddings, allow_dangerous_deserialization=True
    )
except Exception as e:
    logging.error(f"{e}")


def format_docs(docs):
    return "\n\n".join([d.page_content for d in docs])


class Component(BaseModel):
    title: str = Field(description="название компонента НЛМК")
    reason: str = Field(description="для чего использовать на данной странице")


class FunnelOutput(BaseModel):
    needed_components: list[Component] = Field(
        description="список необходимых компонентов для реализииции запроса пользователя")


class InterfaceComponent(BaseModel):
    signature: str = Field(description="# то как вызывается компонент или подкомпонент из NLMK")
    props: Union[Dict[str, Any], None] | Any = Field(description="Словарь пропсов и их значений")
    used_reason: str = Field(description="Функция компонента в данном контексте")
    children: Any = Field(
        description="Список дочерних элементов, который может включать как другие компоненты, так и строки"
    )


class InterfaceJson(BaseModel):
    initialized_components: list[InterfaceComponent | Any]


class RefactoredInterface(BaseModel):
    fixed_code: str = Field(description="Исправленная код интерфейса")
    fixed_structure: Any = Field(description="Исправленная JSON структура, после фикса ошибок")


class InterfaceGeneratingState(BaseModel):
    query: str | None = Field(default=None)
    components: FunnelOutput | None = Field(default=None, description="Релевантные для интерфейса компоненты")
    json_structure: InterfaceJson | None | Any = Field(default=None, description="Структурра интерфейса")
    code: str | None = Field(default=code_sample, description="Код компонента")
    errors: str | None | list[Any] = Field(default=None, description="Ошибки вознкшие при генерации кода")


def funnel(state: InterfaceGeneratingState):
    if llm is None:
        state.errors = "LLM not initialized properly"
        return state

    comps_funnel_chain = FUNNEL | llm | JsonOutputParser(pydantic_object=FunnelOutput)
    components_descs = get_comps_descs()

    res = FunnelOutput(**comps_funnel_chain.invoke(
        input={
            "query": state.query,
            "components": components_descs
        }
    ))

    # app.logger.info(f"cur state is {state}")
    print(f"\n\nNeeded comps {res}")
    state.components = res

    return state


def search_component_docs(queries: list[str]):
    results = []
    for query in queries:
        docs = db.as_retriever(
            search_type="mmr",
            search_kwargs={'k': 3, 'lambda_mult': 0.1, 'fetch_k': 25}
        ).invoke(query)
        results += docs
    return results


def make_structure(state: InterfaceGeneratingState):
    interface_json_chain = (
            {
                "components_info": lambda x: format_docs(x["components_info"]),
                "query": lambda x: x["query"],  # Pass the question unchanged
                "needed_components": lambda x: x["needed_components"],
            }
            | INTERFACE_JSON
            | llm
            | JsonOutputParser(pydantic_object=InterfaceJson)
    )

    interface_json = interface_json_chain.invoke(
        {
            "query": state.query,
            "needed_components": state.components.needed_components,
            "components_info": search_component_docs(
                [f"Detailed ARG TYPES of props a component {x.title} can have"
                 for x in state.components.needed_components] +
                [f"CODE examples of using {x.title}"
                 for x in state.components.needed_components]
            )
        }
    )
    state.json_structure = interface_json

    print(f"\nInterface json {interface_json}")
    return state


def write_code(state: InterfaceGeneratingState):
    interface_coder_chain = (
            {
                "interface_components": lambda x: x["code_sample"],  # Get context and format it
                "query": lambda x: x["query"],  # Pass the question unchanged
                "json_structure": lambda x: x["json_structure"],
                "code_sample": lambda x: x["code_sample"]
            }
            | CODER
            | llm
            | StrOutputParser()
    )

    interface_code = interface_coder_chain.invoke({
        "query": state.query,
        "json_structure": state.json_structure,
        "code_sample": state.code,
        "interface_components": search_component_docs(
            [f"The best CODE examples of using {x.title} component"
             for x in state.components.needed_components] +
            [f"Styles definition of {x.title}'s props"
             for x in state.components.needed_components]

        )
    })

    state.code = interface_code

    print(f"\nWritten code: {interface_code}")

    return state


def debug_docs(code: str, errors_list: list[Dict[str, Any]]) -> list[str]:
    info_to_fix = [""]

    for err in errors_list:
        if "Type" in err["message"]:
            component_with_err = extract_component_by_error_line(code, int(
                (err["location"]).split(" ")[4]))  # Извлекаем компонент по строке с ошибкой
            print(f"COMPONENT WITH ERROR {component_with_err}")

            if len(component_with_err.split(' ')) == 1:
                doc_info = db.as_retriever(
                    search_type="mmr",
                    search_kwargs={
                        'k': 5,  # Извлекаем один наиболее релевантный результат
                        'fetch_k': 10,
                        'lambda_mult': 0.1
                    }
                ).invoke(
                    f"Documentation for component: {component_with_err} "
                )
                info_to_fix.append(doc_info)

    return info_to_fix


def revise_code(state: InterfaceGeneratingState):
    interface_debugger_chain = (
            {
                "useful_info": lambda x: debug_docs(x["interface_code"], x["errors_list"]),
                # Передаём найденные доки по ошибкам
                "query": lambda x: x["query"],  # Передаём запрос пользователя
                "json_structure": lambda x: x["json_structure"],
                "interface_code": lambda x: x["interface_code"],
                "errors_list": lambda x: x["errors_list"]
            }
            | DEBUGGER
            | llm
            | JsonOutputParser(pydantic_object=RefactoredInterface)
    )

    fixes = interface_debugger_chain.invoke(
        {
            "query": state.query,
            "json_structure": state.json_structure,
            "interface_code": state.code,
            "errors_list": state.errors
        }
    )

    print(f"FIxes: {fixes}")

    state.code = fixes["fixed_code"]
    state.json_structure = fixes["fixed_structure"]

    return state


def compile_code(state: InterfaceGeneratingState):
    tsx_code = state.code
    clean_code = re.sub(r"```tsx\s*|\s*```", "", tsx_code)
    state.code = clean_code
    validator = TSXValidator()
    validation_result = validator.validate_tsx(clean_code.strip())

    print(f"Validation res: {validation_result}")

    if validation_result["valid"]:
        state.errors = ""
    else:
        state.errors = validation_result["errors"]

    return state


def compile_interface(state: InterfaceGeneratingState):
    compiling_res = state.errors
    if not compiling_res:
        return END
    else:
        # STATES_TMP_DUMP["1"] = state.model_dump()
        return "debug"


def generate(query: str) -> str:
    logging.info(f"Starting generation for query: {query}")

    try:
        cur_state = InterfaceGeneratingState(query=query)
        builder = StateGraph(InterfaceGeneratingState)
        builder.add_node("funnel", funnel)
        builder.add_node("interface", make_structure)
        builder.add_node("coder", write_code)
        builder.add_node("compiler", compile_code)
        builder.add_node("debug", revise_code)

        builder.set_entry_point("funnel")
        builder.add_edge("funnel", "interface")
        builder.add_edge("interface", "coder")
        builder.add_edge("coder", "compiler")
        builder.add_conditional_edges(
            'compiler',
            compile_interface
        )
        builder.add_edge("debug", "compiler")

        memory = MemorySaver()
        graph = builder.compile(checkpointer=memory)

        # Set up configuration with retry mechanism
        config = {
            "configurable": {"thread_id": "42"},
            "recursion_limit": 50,  # Increase the number of retries further
        }

        try:
            state = graph.invoke(cur_state, config)
            logging.info("Generation process completed successfully.")
            if isinstance(state, dict):
                logging.info(f"Final state errors: {state.get('errors', 'No errors')}")
                logging.info(f"Final state code length: {len(state.get('code', ''))}")
                return str(state.get('code', 'No code generated'))
            else:
                logging.error(f"Unexpected state type: {type(state)}")
                return "An error occurred: Unexpected state type"
        except EnvironmentError as e:
            logging.error(f"Environment setup error: {str(e)}")
            return f"An error occurred during environment setup: {str(e)}"
        except Exception as e:
            logging.error(f"Error in generate function: {str(e)}")
            return f"An error occurred during generation: {str(e)}"
    except Exception as e:
        logging.error(f"Error in generate function: {str(e)}")
        return f"An error occurred during generation: {str(e)}"


def _add_error_handling(func):
    def wrapper(state: InterfaceGeneratingState):
        try:
            return func(state)
        except Exception as e:
            logging.error(f"Error in {func.__name__}: {str(e)}")
            state.errors = f"Error in {func.__name__}: {str(e)}"
            return state

    return wrapper
