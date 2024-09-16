import re


def extract_component_by_error_line(interface_code: str, error_line: int) -> str:
    """
    Извлекает компонент, продолжая искать выше по коду, если он не найден в строке с ошибкой.
    """
    code_lines = interface_code.split("\n")
    component = interface_code

    # Начинаем с строки с ошибкой и движемся вверх по коду
    for i in range(error_line - 1, -1, -1):
        line_code = code_lines[i].strip()

        # Используем регулярное выражение для поиска компонента
        match = re.search(r"<([A-Za-z0-9]+)(\s|>)", line_code)

        if match:
            component = match.group(1)
            break  # Если компонент найден, прекращаем поиск

    return component
