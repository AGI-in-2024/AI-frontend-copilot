import { availablePresets, registerPreset, transform } from "@babel/standalone";
import {
  type TailwindConfig,
  createTailwindcss,
} from "@mhsdesign/jit-browser-tailwindcss";
import * as NLMKDS from '@nlmk/ds-2.0';

// Register "tsx" preset with both "typescript" and "react" presets
registerPreset("tsx", {
  presets: [
    [availablePresets["typescript"], { allExtensions: true, isTSX: true }],
    availablePresets["react"],
  ],
});

export const compileTypescript = async (code: string) => {
  // Remove all 'export' and 'import' statements (including multi-line)
  let modifiedCode = code.replace(/^(import|export)[^;]+;?$/gm, '');

  // Find the component name
  let componentName = 'UserComponent';
  const functionMatch = modifiedCode.match(/function\s+([A-Za-z0-9_]+)/);
  const classMatch = modifiedCode.match(/class\s+([A-Za-z0-9_]+)/);
  const constMatch = modifiedCode.match(
    /const\s+([A-Za-z0-9_]+)\s*=\s*(\(.*?\)\s*=>|\([\s\S]*?\)\s*=>)/
  );

  if (functionMatch && functionMatch[1]) {
    componentName = functionMatch[1];
  } else if (classMatch && classMatch[1]) {
    componentName = classMatch[1];
  } else if (constMatch && constMatch[1]) {
    componentName = constMatch[1];
  }

  // Wrap the component code in an IIFE to avoid global scope pollution
  const wrappedCode = `
    (function() {
      const React = window.React;
      const { useState, useEffect } = React;
      ${Object.keys(NLMKDS).map(key => `const ${key} = window.NLMKDS.${key};`).join('\n')}

      ${modifiedCode}

      window.UserComponent = ${componentName};
    })();
  `;

  // Transform TSX code to JS
  let outputCode = '';
  try {
    const output = babelCompile(wrappedCode, "index.tsx");
    outputCode = output.code || '';
  } catch (error: unknown) {
    console.error('Error compiling code:', error);
    outputCode = `console.error("Compilation error: ${error instanceof Error ? error.message : String(error)}");`;
  }

  // Initialize Tailwind CSS
  const tailwindConfig: TailwindConfig = {
    theme: {
      extend: {
        colors: {},
      },
    },
  };
  const tailwindCss = createTailwindcss({ tailwindConfig });

  // Generate CSS using Tailwind
  let css = '';
  try {
    css = await tailwindCss.generateStylesFromContent(
      `
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
      `,
      [modifiedCode, outputCode].filter(Boolean) as string[]
    );
  } catch (error) {
    console.error('Error generating Tailwind CSS:', error);
  }

  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <style>${css}</style>
    </head>
    <body style="background-color:#fff">
      <div id="root"></div>
      <script crossorigin src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
      <!-- Include the NLMKDS UMD build if available -->
      <script src="path_to_nlmk_ds_umd.js"></script>
      <script>
        // window.NLMKDS is now available via the UMD script
        Object.assign(window, NLMKDS);
      </script>
      <script>
        ${outputCode}
        const App = () => {
          return React.createElement(React.StrictMode, null,
            React.createElement(window.UserComponent, null)
          );
        };
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
      </script>
    </body>
  </html>
  `;

  return {
    html,
    compiledCode: modifiedCode
  };
};

// Transform TSX code to JS
const babelCompile = (code: string, filename: string) =>
  transform(code, {
    filename: filename,
    presets: [
      ["react", { runtime: "automatic" }],
      ["typescript", { isTSX: true, allExtensions: true }]
    ],
  });