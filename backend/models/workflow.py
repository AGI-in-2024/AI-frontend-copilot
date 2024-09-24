import asyncio
import logging
import os
import re
from typing import Dict, Any, Union, List

from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.runnables import chain
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.checkpoint.memory import MemorySaver
from langgraph.constants import END
from langgraph.graph import StateGraph
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.models.prompts import code_sample, FUNNEL, CODER, DEBUGGER, FUNNEL_ITER, CODER_ITER
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

    validator = TSXValidator()
    db = FAISS.load_local(
        FAISS_DB_PATH, embeddings, allow_dangerous_deserialization=True
    )
    retriever = db.as_retriever(
        search_type="mmr",
        search_kwargs={
            'k': 7,
            'lambda_mult': 0.25,
            'fetch_k': 35}
    )
    memory = MemorySaver()
    components_descs = get_comps_descs()
except Exception as e:
    logging.error(f"{e}")


class Component(BaseModel):
    title: str = Field(description="название компонента НЛМК")
    reason: str = Field(description="для чего использовать на данной странице")


class FunnelOutput(BaseModel):
    needed_components: list[Component] = Field(
        description="список необходимых компонентов для реализииции запроса пользователя")


class FunnelIterOutput(BaseModel):
    instructions: str = Field(description="Подробная инструкция по тому что нужно сделать")
    components_to_modify: list[Component] = Field(
        description="Список компонентов которые требуют модификации в имеющейся реализации")


class InterfaceGeneratingState(BaseModel):
    query: str | None = Field(default=None)
    components: FunnelOutput | None = Field(default=None, description="Релевантные для интерфейса компоненты")
    code: str | None = Field(default=code_sample, description="Код компонента")
    errors: str | None | list[Any] = Field(default=None, description="Ошибки вознкшие при генерации кода")

    new_query: str | None = Field(default=None, description="Новый запрос для изменения текущего интерфейса")
    instructions: list[Union[Dict[str, Any], None]] | None = Field(
        default=None,
        description="Подробная инструкция по тому как улучшить интерфейс"
    )
    components_to_modify: list[Component] | None = Field(
        default=None,
        description="Список компонентов которые требуют модификации в имеющейся реализации"
    )


async def funnel(state: InterfaceGeneratingState):
    if llm is None:
        state.errors = "LLM not initialized properly"
        return state
    if state.new_query:
        iter_funnel_chain = FUNNEL_ITER | llm | PydanticOutputParser(pydantic_object=FunnelIterOutput)
        res = iter_funnel_chain.invoke(
            input={
                "previous_query": state.query,
                "new_query": state.new_query,
                "existing_code": state.code,
                "components": components_descs
            }
        )

        print(f"\n\nITER_FUNNEL out: {res}")
        state.instructions = res.instructions
        state.components_to_modify = res.components_to_modify
    else:
        funnel_chain = FUNNEL | llm | PydanticOutputParser(pydantic_object=FunnelOutput)
        res = funnel_chain.invoke(
            input={
                "query": state.query,
                "components": components_descs
            }
        )

        # app.logger.info(f"cur state is {state}")
        print(f"\n\nNeeded comps {res}")
        state.components = res

    return state


@chain
async def search_docs(queries: list[str]):
    tasks = [retriever.ainvoke(query) for query in queries]  # создаем задачи для всех запросов
    results = await asyncio.gather(*tasks)  # выполняем их параллельно
    docs = [doc for result in results for doc in result]  # собираем все результаты в один список
    return docs


async def write_code(state: InterfaceGeneratingState):
    interface_coder_chain = (
            {
                "interface_components": lambda x: x["interface_components"],  # Get context and format it
                "query": lambda x: x["query"],  # Pass the question unchanged
                "code_sample": lambda x: x["code_sample"]
            }
            | CODER
            | llm
            | StrOutputParser()
    )
    interface_coder_iter_chain = (
            {
                "interface_components": lambda x: x["interface_components"],  # Get context and format it
                "query": lambda x: x["query"],  # Pass the question unchanged
                "new_query": lambda x: x["new_query"],  # Pass the question unchanged
                "instructions": lambda x: x["instructions"],  # Pass the question unchanged
                "existing_code": lambda x: x["existing_code"]
            }
            | CODER_ITER
            | llm
            | StrOutputParser()
    )

    if state.new_query:
        interface_code = interface_coder_iter_chain.invoke({
            "query": state.query,
            "new_query": state.new_query,
            "existing_code": state.code,
            "instructions": state.instructions,
            "interface_components": await search_docs.ainvoke(
                [f"Detailed ARG TYPES of props a component {x.title} can have and CODE examples of using {x.title}"
                 for x in state.components_to_modify]
            )
        })
    else:
        interface_code = interface_coder_chain.invoke({
            "query": state.query,
            "code_sample": state.code,
            "interface_components": await search_docs.ainvoke(
                [f"Detailed ARG TYPES of props a component {x.title} can have and CODE examples of using {x.title}"
                 for x in state.components.needed_components]
            )
        })

    state.code = interface_code

    print(f"\nWritten code: {interface_code}")

    return state


async def debug_docs(code: str, errors_list: list[Dict[str, Any]]) -> list[str]:
    queries = []
    code_lines = code.split("\n")

    for err in errors_list:
        cur_line = code_lines[int((err["location"]).split(" ")[4]) - 1]
        if "Type" in err["message"]:
            queries.append(f"Types and Code samples to debug {cur_line} with error {err["message"]}")
        elif "Property" in err["message"]:
            queries.append(f"Props to debug {cur_line} with error {err["message"]}")
        elif "Children" in err["message"]:
            queries.append(f"Children types to debug {cur_line} with error {err["message"]}")
        elif "Module" in err["message"]:
            queries.append(
                f"ArgTypes and Codes for COMPONENT that could replace non-existent member specified in this message: {err["message"]}")

    res = "No special information needed to fix these errors"
    if queries:
        res = await search_docs.ainvoke(queries)

    return res


async def revise_code(state: InterfaceGeneratingState):
    interface_debugger_chain = (
            {
                "useful_info": lambda x: x["useful_info"],  # Передаём найденные доки по ошибкам
                "interface_code": lambda x: x["interface_code"],
                "errors_list": lambda x: x["errors_list"]
            }
            | DEBUGGER
            | llm
            | StrOutputParser()
    )
    docs = await debug_docs(state.code, state.errors)

    fixed_code = interface_debugger_chain.invoke(
        {
            "interface_code": state.code,
            "errors_list": state.errors,
            "useful_info": docs
        }
    )

    print(f"Fixed code: {fixed_code}")

    state.code = fixed_code

    return state


async def compile_code(state: InterfaceGeneratingState):
    tsx_code = state.code
    clean_code = re.sub(r"```(jsx|tsx)\s*|\s*```", "", tsx_code)
    state.code = clean_code
    validation_result = validator.validate_tsx(clean_code.strip())

    print(f"Validation res: {validation_result}")

    if validation_result["valid"]:
        state.errors = ""
        if state.new_query:
            state.query = state.query + state.new_query
    else:
        state.errors = validation_result["errors"]

    return state


async def compile_interface(state: InterfaceGeneratingState):
    compiling_res = state.errors
    if not compiling_res:
        return END
    else:
        return "debug"


async def generate(query: str) -> str:
    logging.info(f"Starting generation for query: {query}")

    try:
        # Set up configuration with retry mechanism
        config = {
            "configurable": {"thread_id": "42"},
            "recursion_limit": 50,  # Increase the number of retries further
        }
        cur_state = None
        if memory.get_tuple(config):
            cur_dict: dict = memory.get_tuple(config)[1]["channel_values"]
            cur_state = InterfaceGeneratingState(**cur_dict)
            cur_state.new_query = query
            logging.info(f"\n\nPREVIOUS STATE: {cur_state}")
        if not cur_state:
            cur_state = InterfaceGeneratingState(query=query)

        builder = StateGraph(InterfaceGeneratingState)
        builder.add_node("funnel", funnel)
        builder.add_node("coder", write_code)
        builder.add_node("compiler", compile_code)
        builder.add_node("debug", revise_code)

        builder.set_entry_point("funnel")
        builder.add_edge("funnel", "coder")
        builder.add_edge("coder", "compiler")
        builder.add_conditional_edges(
            'compiler',
            compile_interface
        )
        builder.add_edge("debug", "compiler")
        graph = builder.compile(checkpointer=memory)

        try:
            logging.info(f"\n\nEXECUTING WITH STATE: {cur_state}")
            state = await graph.ainvoke(cur_state, config)
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
