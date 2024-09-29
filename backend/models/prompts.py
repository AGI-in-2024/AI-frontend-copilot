from langchain_core.prompts import ChatPromptTemplate

FUNNEL = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly experienced front-end TypeScript developer, specializing in React. You are familiar with complex component libraries and can quickly understand new components by reviewing their descriptions. Your goal is to accurately match user queries with appropriate components from the NLMK React design system. You will carefully select the most suitable components based on the user's request and provide structured feedback."
        ),
        (
            "human",
            """User's query: {query}
            You MUST select components only from the provided list:
            {components}

            Your response must be a strictly formatted JSON structured list:
            needed_components: [
                dict(
                    "title": "Component Name",  # название компонента из NLMK
                    "reason": "User query mapping"  # Какие требования пользователя может покрыть этот компонент
                ),
                ...
            ]
            """
        ),
    ]
)

FUNNEL_ITER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly experienced front-end TypeScript developer with a deep understanding of complex React component libraries. Your task is to help modify and improve an existing interface structure based on the user's new request. You will evaluate the changes and select appropriate components from the NLMK React design system."
        ),
        (
            "human",
            """User's previous query: {previous_query}
               User's current query for improvement: {new_query}
               Existing interface code: {existing_code}
               List of NLMK components: {components}

               Your task:
                - Analyze the previous and new queries to understand what the user wants to achieve.
                - Review the current code structure to determine what needs to be changed or added to meet the user's new requirements.
                - Use only components from the NLMK React design system to fulfill the user's request.
                - The instructions should be written as clear, human-readable steps (e.g., "Add component X to section Y", "Modify component Z to include prop A", etc.).
                - Be sure to reference the correct component names and describe any necessary prop changes.
                - Ensure that the instructions align with the user's updated request.
            
               Your response must be JUST a DICTIONARY:
               dict(
                   instructions: "A **detailed instruction** as a **string** describing what changes to make to the current code, including which components to add, modify, or remove.",
                   components_to_modify: [
                       dict(
                           "title": "Component Name",  # название компонента из NLMK
                           "reason": "User query mapping"  # какое требование пользователя покрывает этот компонент
                       ),
                       ...
                   ]
                )
                
                DONT WRAP RESPONSE in fromate like "```smth .... ```". You must return only dict!
            """
        ),
    ]
)


CODER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to generate TypeScript (TSX) code for a user interface based on a user's query and the provided component definitions. You can ONLY use the props and components described in the provided documentation."
        ),
        (
            "human",
            '''
            User's query:
            {query}

            ADDITIONAL SOURCE FILES with crucial information about these Components: Types, Styles, and Code examples:
            {interface_components}

            Your task is to:
            1. **Use ONLY props and components from the provided SOURCE FILES**:
               - You CANNOT invent or assume any props that are not explicitly described in the provided documentation.
               - If a prop is required in the source file (doesn't have a question mark `?`), you MUST initialize it.
               - DO NOT add, modify, or assume props, types, or behavior beyond what is strictly defined in the source files.
               - Your code must ONLY use the components and props exactly as described in the provided documentation.

            2. **Ensure compatibility with TypeScript**:
               - The final code must be fully type-safe, with all necessary TypeScript annotations in place.

            3. **Use only the necessary imports**:
               - Import components and types exclusively from the `@nlmk/ds-2.0` library.
               - DO NOT import or use any other external files, libraries, or components.

            4. **Ensure the final code is well-formatted**:
               - The code must be clean, organized, and properly formatted for a React project, ready to compile without errors.

            The final code should look like this:
            {code_sample}
            '''
        ),
    ]
)



CODER_ITER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to modify and improve existing TypeScript (TSX) code for a user interface based on the user's new request and provided instructions. You should use only the provided components and ensure all necessary imports from the '@nlmk/ds-2.0' library are included in the code."
        ),
        (
            "human",
            """
            Previous user query: {query}
            New user query: {new_query}

            Current interface code that requires modification:
            {existing_code}

            Instructions for modification:
            {instructions}

            ADDITIONAL SOURCE FILES with useful information about the components:
            {interface_components}

            Your task is to:
            1. **Modify the existing code** based on the user's new query and the instructions provided.
            2. Ensure **TypeScript annotations** are correct and use best practices for typing in React components.
            3. Follow the new user query carefully and implement all changes accordingly.
            4. Ensure the **output code is formatted** and ready for a React project without any TypeScript or prop errors.
            5. Dont add any comments in response!
            """
        ),
    ]
)

code_sample = """
            ```tsx
            // Import necessary components
            import React from 'react';
            import { ComponentName1, ComponentName2 } from '@nlmk/ds-2.0';

            // Main component structure based on JSON
            const Interface = () => {
              return (
                <div>
                  {/* Render components here based on users query and components list. Keep users wants of structure!*/}
                </div>
              );
            };

            // Export the main component
            export default Interface;
            ```
            
            DONT ADD ANY COMMENTS IN THE CODE!
            """

DEBUGGER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to rewrite the faulty lines or components in the provided TypeScript (TSX) code based on the exact component definitions from the documentation. No assumptions or new props should be added beyond what's in the documentation."
        ),
        (
            "human",
            '''
            Here is the current code with errors:
            {interface_code}

            Component definitions and documentation:
            {useful_info}

            List of errors identified:
            {errors_list}

            Your task:
            1. **Rewrite the problematic lines or the entire component**:
               - Only use the props and types defined in the documentation (`useful_info`).
               - Remove any incorrect props or types and replace them with the correct ones as per the documentation.
               - Ensure that all required props are included, especially those without a question mark.
               - Add or fix any missing imports for components from `@nlmk/ds-2.0`.

            2. **Ensure full TypeScript compatibility**:
               - The final code must be fully type-safe, with no type mismatches or missing props.

            3. **Return only the corrected code**:
               - Do not include explanations, comments, or any extra information.
               - Return just the fixed TypeScript code.
            '''
        ),
    ]
)




QUERY_GENERATOR = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to generate precise search queries based only on the provided TypeScript code and error messages."
        ),
        (
            "human",
            """
            Current code that contains errors:
            {code}

            List of identified errors in the code:
            {errors_list}

            Your task is to:
            1. Carefully review the error messages and the specific lines of code where the errors occur.
            2. Focus **only** on the component(s) where the errors occur, their props, and types, as evident from the code.
            3. Generate **concise, targeted search queries** to retrieve documentation or examples relevant to these components and their props.
            4. Ensure each query is clear and specific to the components and props, and does not contain unnecessary generalizations or external troubleshooting details.

            Return a STRING of clean, concise queries for retrieving documentation, separated by commas. Example output:
            "Box component missing prop types for display justifyContent, Box usage example with children and p props"
            """
        ),
    ]
)




def get_ui_improvement_prompt(result, question):
    return f"""
    Given a code, check if it follows the provided design, use only provided components, don't change any imports.
    Make sure the UI follows the provided design.
    Return only code in js format and nothing else. (no ```, no comments, no markdown, no nothing).
    The code will be written to App.js.
    The generated code will be pasted in a CodeSandbox as App.js
    index.js structure:

    ```
    import React, {{ StrictMode }} from "react";
    import {{ createRoot }} from "react-dom/client";
    import "./styles.css";
    import App from "./App";
    const root = createRoot(document.getElementById("root"));
    root.render(
        <StrictMode>
            <App />
        </StrictMode>
    );

    Code to improve:
    {result}    
    Design:
    {question}

    all text in the code must be in russian.
    """

def get_ui_description_prompt(question):
    return f"""
    Generate a detailed description for a user interface based on the following input: {question}
    referetence components onky by the name, dont include their description.
    Use components from the @nlmk/ds-2.0 library, component names and descriptions below:
    {component_description}

    example output:
    {example_output}
    """

def get_quick_improve_prompt(code, design, modification):
    return f"""
Given the following React code, design description, and modification request:

Code:
{code}

Design Description:
{design}

Modification Request:
{modification}



Please make the following improvements to the code:
1. Implement the changes described in the modification request.
2. Ensure the code adheres to the design description.
3. Use only components from the @nlmk/ds-2.0 library.
4. Maintain proper TypeScript typing.
5. Keep the existing imports and overall structure intact.
6. All text in the code must be in russian.

return only code and nothing else, no markdown, no ```, no comments, no nothing
"""


example_output = """
Design a web page with Sidebar on the left and Header at the top, then add a horizontal Divider, followed by a Tabs component, and under the Tabs, display a grid of Cards with images and descriptions.
"""

component_description = """
{
    "descriptions": {
        "Accordion": "{`Компонент \"аккордеон\" предоставляет большие объемы контента в ограниченном пространстве с помощью пошагового раскрытия. Заголовок обеспечивает пользователю общий обзор содержимого, позволяя решить, какие разделы читать.\n\n        Аккордеоны могут сделать обработку информации и поиск более эффективными. Однако они скрывают контент от пользователей, и важно учесть, что пользователь может не заметить или не прочитать весь включенный контент. Если пользователь, вероятно, должен прочесть весь контент, не используйте аккордеон, так как это добавляет дополнительный клик; вместо этого используйте плноценную прокручиваемую страницу с обычными заголовками.`}",
        "Alert": "\"Компонент Alert представляет собой компонент уведомления или предупреждения. Он используется для отображения важных сообщений пользователю с цветовой кодировкой в зависимости от уровня серьёзности ситуации. Поддерживает несколько вариантов отображения: стандарный, заполненный и с обведённым контуром.\"",
        "AttachFiles": "\"Компонент, используемый для прикрепления файла. Компонент AttachFiles\n          собирается из необходимого количества компонентов File.\"",
        "Avatar": "{`Компонент Avatar представляет собой пользовательский компонент, который отображает аватар пользователя. Этот аватар может быть изображением, инициалами пользователя, иконкой профиля, а также может включать индикаторы онлайн-статуса, числовой индикатор или иконку в виде значка (badge). Компонент также поддерживает различные размеры и формы для кастомизации внешнего вида аватара.`}",
        "Badge": "\"Компонент Badge используется для отображения меток (badges), таких как лейблы, тэги, статусы и т.д. Обычно Badge используют внутри или в непосредственной близости от другого более крупного компонента интерфейса.\"",
        "Box": "\"Компонент Box представляет собой универсальный контейнер, используемый для стилизации и компоновки содержимого. Он обладает пропсами для управления стилями, включая background, padding, border, borderRadius и flexbox свойствами, такими как display, flexDirection, justifyContent, alignItems, flexWrap и gap. Это делает Box инструментом для создания структурированного и адаптивного интерфейса.\"",
        "Breadcrumbs": "\"Компонент BreadCrumbs (хлебные крошки) используется в пользовательском интерфейсе для предоставления визуальной навигационной структуры, позволяющей пользователям быстро и эффективно понимать своё местоположение в иерархии контента или приложения. BreadCrumbs представляют собой последовательность ссылок или текста, а каждый элемент в ней указывает на уровень иерархии, переходя от более общего к более специфическому контенту.\"",
        "Button": "\"Компонент Button представляет собой кнопку, которую можно настроить с помощью различных параметров, таких как\n          размер, иконки, знаки и стили.\"",
        "Card": "\"Компонент Card является функциональным компонентом, который предназначен для отображения карточки с различными элементами интерфейса, такими как изображение, заголовок, описание, значки, селектор и группа кнопок.\"",
        "Checkbox": "\"Компонент Checkbox является элементом пользовательского интерфейса, который позволяет пользователю взаимодействовать с формой, выбирая или снимая выбор с определённых опций. \"",
        "Chip": "\"Компонент Chip обычно используется для отображения небольших интерактивных элементов пользовательского интерфейса, таких как теги, метки, категории или выборы в фильтрах, а также для представления небольших блоков информации.\"",
        "DatePicker": "\"Компонент для выбора даты и времени, с возможностью ограничения времени, выбором периода времени и опциональным сдвигом.\"",
        "Divider": "\"Компонент Divider - это визуальный элемент, используемый для разделения содержимого на разных частях пользовательского интерфейса, таких как списки, сетки или разделы на странице.\"",
        "DragAndDrop": "\"Компонент DragAndDrop представляет собой компонент ...\"",
        "Drawer": "\"Компонент Drawer обеспечивает отображение выдвижной панели с возможностью настройки позиции и обработки закрытия.\"",
        "Dropdown": "\"Dropdown позволяет пользователям выбирать одно действие из выпадающего меню\"",
        "ErrorPage": "\"Компонент ErrorPage предназначен для информирования пользователя о различных ошибках веб-приложения и предложения возможных действий для их решения с помощью настраиваемых сообщений и изображений.\"",
        "Grid": "\"Компонент Grid представляет собой универс��льный контейнер, используемый для позиционирования внутренних компонентов/элементов: горизонтальный или вертикальный. Он обладает различными пропсами, что делает Grid инструментом для создания структурированного и адаптивного интерфейса.\"",
        "Header": "\"Header - это компонент, который отображает настраиваемый верхний колонтитул (шапку) веб-страницы или приложения.\"",
        "Icon": "\"Компонент иконок, который можно использовать как самостоятельно, так и внутри других компонентов\"",
        "ImagePicture": "\"ImagePicture обеспечивает гибкую отрисовку изображений с различными соотношениями сторон и радиусами границ. Поддерживает функцию зума при наведении.\"",
        "Input": "\"Компонент Input позволяет пользователям вводить текстовую информацию. Он поддерживает различные варианты, включая лейблы, иконки, многострочный ввод и различные стили.\"",
        "InputRange": "\"Компонент InputRange отражает диапазон значений вдоль полосы, из которой пользователи могут выбрать диапазон\n        значений. Компонент подходит для настройки таких параметров, как громкость, яркость или применение фильтров\n        изображения.\"",
        "InputSlider": "\"InputSlider представляет собой слайдер для ввода числовых значений, который позволяет пользователю выбирать значение в заданном диапазоне.\"",
        "Link": "\"Link компонент позволяет пользователям переходить по заданным ссылкам. Он пддерживает иконки, разные размеры и состояния, такие как disabled.\"",
        "Modal": "\"Компонент Modal обеспечивает отображение модальных окон с возможностями перетаскивания, изменения размера и обработки закрытия.\"",
        "ProgressBar": "\"ProgressBar представляет собой компонент, показывающий прогресс выполнения задачи или процесса. Он предоставляет наглядное представление о проценте выполнения.\"",
        "PseudoInput": "\"PseudoInput - элемент, который позволяет отображать информацию.\"",
        "Radio": "\"Компонент Radio обычно используется для выбора одного из нескольких взаимоисключающих вариантов в рамках определённой группы.\"",
        "SegmentButtonGroup": "\"Компонент SegmentButtonGroup - это набор кнопок, из которых пользователь может выбрать только одну.\"",
        "Sidebar": "{`Компонент для навигации и организации контента в интерфейсе.`}",
        "SimpleSelect": "\"SimpleSelect позволяет пользователям выбирать один элемент из списка. Он поддерживает различные настройки и стили.\"",
        "SkeletonLoader": "\"Skeleton Loader — это статический/анимированный элемент для информации, которая все еще загружается.\"",
        "SlideToggle": "\"SlideToggle — элемент, который позволяет отображать/скрывать элемент.\"",
        "Snackbar": "\"Snackbar - это компонент, который предоставляет краткое уведомление или сообщение о событии.\"",
        "Spinner": "\"Spinner — это компонент который используется в качестве индикатора загрузки.\"",
        "Stepper": "{\n          'Компонент Stepper представляет из себя пользовательный компонент, который отображает текущий Step (с помощью компонента Badge), его название и линию - Divider. По нему можно кликнуть и получить его состояние и индекс.'\n        }",
        "Switch": "\"Switch - это компонент, который реализует функциональность переключателя, часто используемого в пользовательских интерфейсах для настройки параметров, таких как включение/выключение определенных функций приложения.\"",
        "Tabs": "\"Компонент Tabs, который объединил в себя Tab элементы. Компонент использует подход compound pattern.\"",
        "TimePicker": "\"TimePicker позволяет пользователям выбирать время или период времени. Поддерживает различные форматы и диапазоны времени.\"",
        "ToggleButtonGroup": "\"Компонент ToggleButtonGroup - это набор кнопок, из которых пользователь может выбрать только одну.\"",
        "Tooltip": "\"Компонент-подсказка, появляющийся при определенном взаимодействии с дочерним элементом компонента (по умолчанию: при наведении курсора). Tooltip рассчитан не только на работу с простой информацией (текст) с единой стилизацией, но и на визуализацию подсказок, содержащих нестандартную информацию (списки, картинки, таблицы).\"",
        "Typography": "{`Компонент для стандартизации текста и относящимся к нему свойствам стилизации.`}"
    }
}
"""


test_prompt = """

package.json:
{{
    "dependencies": {{
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "react-scripts": "^5.0.0",
        "@nlmk/ds-2.0": "2.5.3"
    }},
    "main": "/index.js",
    "devDependencies": {{}}
}}

style.css:
@import url('https://nlmk-group.github.io/ds-2.0//css/main.css');
@import url('https://fonts.cdnfonts.com/css/pt-root-ui');
html, body {{
    background-color: var(--steel-10);
}}
#root {{
    -webkit-font-smoothing: auto;
    -moz-font-smoothing: auto;
    -moz-osx-font-smoothing: grayscale;
    font-smoothing: auto;
    text-rendering: optimizeLegibility;
    font-smooth: always;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    margin: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}}
* {{
    font-family: 'PT Root UI', sans-serif !important;
}}

public/index.html:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
"""