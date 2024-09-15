# Vite-React-TS-SPA

![Known Vulnerabilities](https://snyk.io/test/github/AdiRishi/vite-react-ts-spa/badge.svg)
[![Node.js CI](https://github.com/AdiRishi/vite-react-ts-spa/actions/workflows/ci.yml/badge.svg)](https://github.com/AdiRishi/vite-react-ts-spa/actions/workflows/ci.yml)

An opinionated vite starter template for production ready Single Page Apps

## Features

- [Vite](https://vitejs.dev/)
- Pre-configured production builds with [@vitejs/plugin-legacy](https://vitejs.dev/guide/build.html#browser-compatibility)
- Build output analysis with [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)
- [Yarn v3](https://yarnpkg.com/getting-started/qa#why-should-you-upgrade-to-yarn-modern) package manager
- Eslint with recommended pre-configured lint rules : [Eslint](https://eslint.org/docs/latest/rules/), [Typescript](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin#recommended-configs), [React](https://github.com/jsx-eslint/eslint-plugin-react#configuration-legacy-eslintrc), [React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks), [Testing Library](https://testing-library.com/docs/ecosystem-eslint-plugin-testing-library), [JestDom Expects](https://testing-library.com/docs/ecosystem-eslint-plugin-jest-dom), [Prettier](https://github.com/prettier/eslint-config-prettier)
- [Prettier](https://prettier.io/) code formatter
- Pre-configured [Tailwind CSS](https://tailwindcss.com/)
- Unit testing with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- Pre-configured [web vitals](https://github.com/GoogleChrome/web-vitals)

## Getting Started

Use this repository as a [GitHub template](https://github.com/AdiRishi/vite-react-ts-spa/generate) or use [degit](https://github.com/Rich-Harris/degit) to clone to your machine with an empty git history:

```sh
npx degit AdiRishi/vite-react-ts-spa my-app
```

Then take the following steps to run the app

```sh
cd my-app
yarn install
yarn dev # starts the dev server
```

## Out of Scope for this template

In order to not stack too many unnecessary tools I decided to keep this repository simple and constrained in it's scope.

However modern React applications need a plethora of tools and packages to provide a good developer experience.
In this section I will go over the areas out of scope for this project and suggest libraries/tools to use to solve these problems.

**Server Side Rendering (SSR)**

Vite has recommendations for SSR which you can read in their [guide](https://vitejs.dev/guide/ssr.html).
However should you wish to build server rendered React applications I recommend using a framework like [Next.js](https://nextjs.org/)

**Global State Management**

State management should not be confused with state synchronization; specifically _server state synchronization_. Typical CRUD operations on APIs and server data falls under the category of state synchronization which will be discussed further down below.

State management in our context here refers to _client_ state management. This typically revolves around UI state e.g is my chat window open or not?
Often times react hooks are not enough and these values need to be globally accessible through the app.

- If you need complex state management, Redux is still the library to use. I recommend [@reduxjs/toolkit](https://redux-toolkit.js.org/) as it simplifies a lot of the boilerplate typically associated with Redux and provides a great developer experience.
- If all you need is sparse, simple and performant state management consider using [Jotai](https://jotai.org/) and/or [Zustand](https://github.com/pmndrs/zustand)
- If you need complex state machine like behavior use [XState](https://xstate.js.org/docs/)

**State Synchronization**

State synchronization is the process involved with querying and mutating data that typically lives on a server / database.

Back in the day this process was typically done with the help of Redux. Developers would write actions, reducers and side effects to query/mutate server data. This is an anti-pattern and results in a huge amount of boilerplate code even for simple tasks.

Luckily there are many libraries that solve this problem today. Which one you pick largely depends on the broader ecosystem your app lives in.

- If your app primarily communicates with REST APIs and does not use redux. Consider using [TanStack Query](https://tanstack.com/query) (formerly known as React Query)
- If you already use Redux in your application then [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) (which is already a part of Redux Toolkit) is your best bet.
- If your backend is GraphQL based, [Apollo Client](https://www.apollographql.com/apollo-client) will provide the best developer experience.
