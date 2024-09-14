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
                    "reason": "User query mapping"  # какое требование пользователя покрывает этот компонент
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

               Your response must be a strictly formatted JSON:
               instructions: {
                   "action": "add | modify | remove",
                   "component": "Component Name",  # название компонента из NLMK
                   "reason": "User query mapping",  # какое требование пользователя покрывает этот компонент
               }
               components_to_modify: [
                   dict(
                       "title": "Component Name",  # название компонента из NLMK
                       "reason": "User query mapping"  # какое требование пользователя покрывает этот компонент
                   ),
                   ...
               ]
            """
        ),
    ]
)

INTERFACE_JSON_ITER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end TypeScript developer specializing in React. You will modify the existing interface structure by applying changes to the components based on user input. Your goal is to update the current structure using NLMK React components."
        ),
        (
            "human",
            """User's current query:
               {new_query}
               Existing interface structure: {existing_interface_json}
               Needed changes and components to be modified: {modification_instructions}

               Here are the details of the components you need to modify:
               {components_info}

               Update the current structure and return a strictly formatted JSON:
               modified_interface: [
                   dict(
                       "title": "Component Name",                   # название компонента из NLMK
                       "used_reason": "Why it's used",  # причина использования компонента
                       "props": list[Dict[str, Any]],               # инициализированные пропсы компонента
                       "children": list[ VALID INITIALIZED CHILDREN ELEMENTS]  # список дочерних элементов                      
                   )
               ]
            """
        ),
    ]
)


INTERFACE_JSON = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly experienced front-end TypeScript developer specializing in React. You are familiar with complex component libraries and can quickly understand new components by reviewing their source code and documentation. Your task is to help build a structured interface based on the user's query using components from the NLMK React design system."
        ),
        (
            "human",
            """User's query:
             {query}

            You MUST use components only from the provided list:
            {needed_components}

            Here are information of these components: Types of arguments, Styles and Codes:
            {components_info}

            Your response must be a strictly formatted JSON structured list:
            initialized_components: [
                dict(
                    "title": "Component Name",                   # название компонента из NLMK
                    "used_reason": "Its primary functionality",  # для чего этот компонент тут находится
                    "props": list[Dict[str, Any]],               # инициализированные пропсы компонента
                    "children": list[ VALID INITIALIZED CHILDREN ELEMENTS]  # список инициализированных элементов                    
                )
            ]
            Put only NLMK COMPONENTS!
            """
        ),
    ]
)

CODER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to convert a structured JSON description of a user interface into fully functional React code. The JSON contains information about the components, their props, and their hierarchical structure. You should generate code that accurately reflects this structure."
        ),
        (
            "human",
            """
            It is a user's query: 
            {query}

            Here is the JSON structure that describes the interface:
            {json_structure}

            ADDITIONAL SOURCE FILES with extremely useful info about these Components: Types, Styles and Codes examples
            {interface_components}

            You MUST convert this JSON structure into a working React code using functional NLMK components ( its configurations i have described in json earlier )and JSX. Make sure to:
            - Use TypeScript.
            - Reflect the component hierarchy as per the "children" field in the JSON.
            - If props are passed in the JSON, ensure they are included in the component invocation and check their correctness with the help of SOURCE FILES.
            - Add Styles from NLMK lib to make interface components placement more structured and beautiful
            - Ensure the output is formatted correctly for use in a TypeScript React project.


            YOU MUST USE ONLY PURE react and COMPONENTS from '@nlmk/ds-2.0' that i gave to you!
            DONT USE ANY imported STYLES or any!

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
            ```tsx
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
            """

DEBUGGER = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a highly skilled front-end developer specializing in React and TypeScript. Your task is to review and correct TypeScript code for a user interface based on the structure provided in a JSON description and a list of identified issues. You will return a JSON object with the corrected code and the interface structure where you need to EDIT lines, the errors came from!."
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
            - Identify the incorrect fields in the JSON structure that are likely causing the errors in the code.
            - Don't add any things in what you are not absolute confident
            - Make only the necessary targeted changes to these fields - CHANGE or DELETE elements in the JSON structure to resolve the identified issues.
            - Correct the TypeScript code based on these updates in the JSON structure.
            - Ensure that the corrected code adheres to the updated JSON structure, reflecting the proper component hierarchy and props as described in the "children" field and other attributes.
            - Use the code examples from the provided useful information to apply the best practices for fixing the identified issues.
            - Ensure the code uses only pure React and components from '@nlmk/ds-2.0', as specified in the JSON and the example.
            - Format the code properly, ensuring it is functional and ready for use in a TypeScript React project.
            - Make sure to resolve all errors mentioned in the errors list.

            Return the result as a JSON object with the following structure:
            dict(
                "fixed_code": "<corrected TypeScript code as a string>",
                "fixed_structure": initialized_components: [
                        dict(
                            "title": "Component Name",                   # название компонента из NLMK
                            "used_reason": "Its primary functionality",  # для чего этот компонент тут находится
                            "props": list[Dict[str, Any]],               # инициализированные пропсы компонента
                            "children": list[ VALID INITIALIZED CHILDREN ELEMENTS]  # список инициализированных элементов                    
                        )
                    ]
            ))
            """
        ),
    ]
)
