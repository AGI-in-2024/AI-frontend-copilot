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
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to generate TypeScript (TSX) code for a user interface based on a user's query and provided component definitions. You should use only the provided components and ensure all necessary imports from the '@nlmk/ds-2.0' library are included in the code."
        ),
        (
            "human",
            '''
            User's query:
            {query}

            ADDITIONAL SOURCE FILES with extremely useful info about these Components: Types, Styles, and Code examples:
            {interface_components}

            You MUST convert the user's request into working TypeScript (TSX) code using ONLY the components and props described in the provided component definitions. Make sure to:
            - **Strictly follow the provided component definitions**. DO NOT invent or assume props that are not explicitly described in the provided documentation.
            - **Include all necessary imports** from the `@nlmk/ds-2.0` library based on the components used or from React. DO NOT IMPORT ANY OTHER FILES!
            - Ensure props are used strictly according to their type definitions, as outlined in the provided documentation.
            - Reflect the component hierarchy and prop types exactly as described.
            - Use **TypeScript annotations** and follow best practices for typing in React components.
            - Ensure the final code is correctly formatted for a React project and is fully compatible with TypeScript.

            REMINDER:
            - Use ONLY React and components from '@nlmk/ds-2.0' as specified.
            - DO NOT use external stylesheets or any unlisted components.
            - DO NOT add or modify any new props or components beyond those explicitly provided.

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
            2. **Include all necessary imports** from the `@nlmk/ds-2.0` library, ensuring that only components from this library are used.
            3. **Respect component hierarchies and props**: Follow the structure and props usage as described in the instructions and the component definitions.
            4. Ensure **TypeScript annotations** are correct and use best practices for typing in React components.
            5. Follow the new user query carefully and implement all changes accordingly.
            6. Ensure the **output code is formatted** and ready for a React project without any TypeScript or prop errors.
            7. Dont add any comments in response!
            """
        ),
    ]
)

code_sample = """
            ```jsx
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
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to review and correct TypeScript (TSX) code for a user interface based on the provided code sample and a list of identified issues. You should modify only the specific lines of code that contain the errors, while ensuring the overall structure and functionality of the interface remains correct."
        ),
        (
            "human",
            '''
            Here is the current interface code that requires corrections:
            {interface_code}

            The following issues have been identified in the code:
            {errors_list}

            Additionally, here is some useful information, including code examples and full component definitions, that may assist in correcting the code:
            {useful_info}

            Your task is to:
            1. **Fix errors in TypeScript (TSX)**:
               - Target the problematic code sections based on the error messages.
               - Ensure that any props or components used are STRICTLY from the provided documentation. DO NOT invent new props or assume functionality that isn't clearly defined in the provided documents.

            2. **Ensure all necessary imports are present**:
               - Add missing imports for components and types from the `@nlmk/ds-2.0` library ONLY.
               - Ensure NO unnecessary imports or external files are present in the final code.

            3. **Use ONLY the provided components**:
               - DO NOT modify or add any new components or props that are not clearly described in the provided documentation.

            4. **Ensure compatibility with TypeScript**:
               - Correct any TypeScript errors related to type mismatches, incorrect usage of props, or missing imports.
               - Ensure the corrected code adheres to TypeScript standards and is fully type-safe.

            5. **Correct Formatting and Human-Readable Strings**:
               - Ensure the corrected TypeScript code is well-formatted.
               - Any strings, including those in Cyrillic, should remain human-readable.

            Return ONLY the corrected TypeScript (TSX) code as a string, with the necessary imports added. Do not include any other information or JSON structures.
            '''
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
    """


<<<<<<< HEAD
test_prompt = """

<<<<<<< HEAD
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


