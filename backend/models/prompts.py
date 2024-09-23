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
               Existing interface structure: {existing_interface_json}
               List of NLMK components: {components}

               Based on the new query, determine what needs to be changed in the existing structure and suggest any new or modified components that should be added or updated.

               Your response must be a strictly formatted JSON dict with two keys which values are lists:
               HERE AN OUTPUT FORMAT 
               dict(
                   instructions: [
                        dict(
                            "action": "add | modify | remove",
                            "component_identity": "Component Name",  # какой именно компонент в текущей структуре надо модифицировать
                        ),
                        ...
                    ],
                   components_to_modify: [
                       dict(
                           "title": "Component Name",  # название компонента из NLMK
                           "reason": "User query mapping"  # какое требование пользователя покрывает этот компонент
                       ),
                       ...
                   ]
                )
            """
        ),
    ]
)


init_components_example = """
initialized_components: [
                {
                    "signature": "Component or Subcomponent signature",   # The name of the component or subcomponent from NLMK
                    "used_reason": "A clear explanation of why this component is used here",  # Reason for this component's presence
                    "props": { ... },   # A dictionary of props initialized with the provided types and values
                    "children": [ ... ] # A list of child components, initialized and valid per NLMK rules
                }
            ]"""


INTERFACE_JSON = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly experienced front-end TypeScript developer specializing in React. You have deep expertise in component libraries and can quickly understand and apply new components by reviewing their source code and documentation. Your task is to help construct a well-structured interface strictly following the user's request using only components from the NLMK React design system."
        ),
        (
            "human",
            """User's query:
            {query}

            STRICT REQUIREMENTS:
            1. **Components**: You MUST use only the components from the provided list:
            {needed_components}

            2. **Prop Usage**: All components must use their provided props, respecting the given prop types and values. Initialize all props based on the information provided ONLY in bool or str FORMAT!:
            {components_info}

            3. **Functional Props**: If a prop is expected to be a function, JUST DESCRIBE ITS BEHAVIOR in str format!.

            4. **Children**: Ensure that components correctly nest their child components where applicable, based on the structure defined in the **Components**. Use the components from the list, ensuring valid child-parent relationships.

            5. **JSON Output**: Your response must be a clear JSON-structured list with no ```formatting:
            {init_components_example}

            6. **NO Additional Wrapping**: Do not wrap the output in unnecessary JSON blocks or other wrappers. Provide only the required JSON structure.

            7. **Focus**: Stick strictly to the provided components and initialize only their available props and children. Avoid creating additional elements not in the list.

            Respond with a valid, cleanly formatted JSON structure, ensuring all components and props are properly initialized based on the details provided."""
        ),
    ]
)

INTERFACE_JSON_ITER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end TypeScript developer specializing in React. Your task is to modify the existing interface structure by applying precise changes to the components based on the user's new request. You will strictly follow the NLMK React design system components and the user's modification instructions."
        ),
        (
            "human",
            """User's query for changes:
               {new_query}

               Existing interface structure that needs to be modified:
               {existing_interface_json}

               Detailed modification instructions provided by the user:
               {modification_instructions}

               **STRICT INSTRUCTIONS:**
               1. **Component Modification**: Modify only the components or subcomponents listed in the modification instructions. If the instructions mention a change to a specific component, ensure the updated component adheres to the structure of NLMK components and uses valid props.

               2. **Prop Initialization**: Only initialize the props provided. All functional props (like onClick, onChange) should be described as string explanations of what the function should do, rather than the actual code.

               3. **Children**: Ensure that the child components are correctly nested under their parent components. If changes to children are required, ensure they follow valid parent-child relationships.

               4. **JSON Structure**: The output must strictly be in the format of this struct!:
                {init_components_example}
               5. **NO ADDITIONAL WRAPPING**: Do not add extra blocks like 'json', '() =>', or other unnecessary wrappers.

               6. **Components Info**: Only use the components and props described in the provided information:
               {components_info}

               Return a valid JSON structure with all requested changes applied, ensuring all components and props are properly initialized based on the given instructions."""
        ),
    ]
)

CODER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and JavaScript. Your task is to convert a structured JSON description of a user interface into fully functional React code. The JSON contains information about the components, their props, visual styles, and their hierarchical structure. You should generate code that accurately reflects this structure."
        ),
        (
            "human",
            """
            It is a user's query: 
            {query}

            Here is the JSON structure that describes the interface:
            {json_structure}

            ADDITIONAL SOURCE FILES with extremely useful info about these Components: Types, Styles and Codes examples:
            {interface_components}

            You MUST convert this JSON structure into working React code using functional NLMK components (its configurations I have described in JSON earlier) and JSX. Make sure to:
            - Use only JavaScript (not TypeScript).
            - Reflect the component hierarchy as per the "children" field in the JSON.
            - If props are passed in the JSON, ensure they are included in the component invocation and validated against the SOURCE FILES.
            - Ensure the output is formatted correctly for use in a React project.

            YOU MUST USE ONLY PURE React and COMPONENTS from '@nlmk/ds-2.0' that I gave to you!
            DO NOT USE TypeScript annotations, external or imported stylesheets, or styles!

            The final code should look like this:
            {code_sample}

            """
        ),
    ]
)



CODER_ITER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to update existing React code by modifying it according to a new JSON structure that describes changes to the user interface. The JSON contains information about the components, their props, and their hierarchical structure. Your job is to carefully merge these changes into the previous code while maintaining its functionality."
        ),
        (
            "human",
            """
            It is a user's query: 
            {query}

            Here is the previous code:
            {previous_code}

            Here is the updated JSON structure that describes the new interface:
            {json_structure}

            ADDITIONAL SOURCE FILES with extremely useful info about these Components: Types, Styles, and Code examples:
            {interface_components}

            You MUST update the previous code according to the new JSON structure and generate working React code using functional NLMK components (as described in JSON). Make sure to:
            - Modify only the components that need updating, but preserve any existing code that doesn't need changes.
            - Use TypeScript.
            - Reflect the updated component hierarchy as per the "children" field in the JSON.
            - If new props are passed in the JSON, ensure they are included in the component invocation and check their correctness with the help of the SOURCE FILES.
            - Add Styles from the NLMK library to ensure that interface components are visually structured and correctly placed.
            - Ensure the final code is formatted correctly for use in a TypeScript React project.

            YOU MUST USE ONLY PURE React and COMPONENTS from '@nlmk/ds-2.0' that I gave to you!
            DO NOT USE ANY imported STYLES or external libraries!

            The final updated code should look like this:
            {code_sample}
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
                  {/* Render components here based on JSON */}
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
            "You are a highly skilled front-end developer specializing in React and JavaScript. Your task is to review and correct JavaScript code (JSX) for a user interface based on the provided JSON structure and a list of identified issues. You should modify only the specific lines of code that contain the errors, while ensuring the overall structure and functionality of the interface remains correct."
        ),
        (
            "human",
            """
            Here is the JSON structure that describes the interface:
            {json_structure}

            Here is the current interface code that requires corrections:
            {interface_code}

            The following issues have been identified in the code:
            {errors_list}

            Additionally, here is some useful information, including code examples, that may assist in correcting the code:
            {useful_info}

            Your task is to:
            1. **Fix errors in JSX**:
               - Use the location and details provided in the error messages to directly target the problematic code sections.
               - Prioritize fixing errors related to properties and component structure. For example, fix any issues related to incorrect property usage or component imports.
               - If a specific property does not match, replace it with the correct one based on the documentation or provided examples in `useful_info`.
            2. **Ensure compatibility**: 
               - The code must use components and props strictly from the '@nlmk/ds-2.0' library. You may adjust imports or remove unused components to fix the errors.
               - Do not use TypeScript annotations or any TypeScript-specific features. Keep the code purely in JavaScript (JSX).
            3. **Review JSON structure**: 
               - After fixing the code, ensure that the JSON structure is accurate and fully reflects the interface components and their properties.
               - If necessary, make adjustments to the JSON structure based on the fixed code, but only after resolving the code issues.
            4. **Correct Formatting**:
               - Ensure the corrected JavaScript code follows best practices and is properly formatted for use in a React project.
               - Ensure that strings (including those in Cyrillic) are returned in human-readable format, without being converted into Unicode escape sequences.
               - Provide the corrected code and updated JSON structure in the format below.

            Return the result as a JSON with the following keys:
            "fixed_code": "<corrected JSX code as a string>",
            "fixed_structure": {init_components_example}

            Do NOT wrap the result in extra JSON blocks. If you are initializing props functions in the JSON structure, just describe their behavior.
            """
        ),
    ]
)



