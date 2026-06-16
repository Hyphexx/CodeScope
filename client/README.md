# CodeScope Client

This is the React/Vite frontend. It is responsible for the user interface only: account forms, file selection, displaying an analysis, and showing saved history.

## Main Flow

1. `src/main.jsx` mounts React into `index.html`.
2. `src/App.jsx` checks whether a token exists in `localStorage`.
3. If no valid token exists, `AuthPage.jsx` is shown.
4. If a valid token exists, `Home.jsx` is shown.
5. `Home.jsx` lets the user upload files and view saved scan history.
6. API calls are made through `src/api/analysisApi.js`.

## Important Files

### `src/App.jsx`

`App` is the top-level controller for authentication state.

It stores:

- `token`: the bearer token returned by the server.
- `user`: the signed in user object.
- `isCheckingAuth`: whether the app is still verifying a saved token.

When the app loads, it reads `codescope_token` from `localStorage`. If a token exists, it calls `GET /api/auth/me`. If that succeeds, the user stays logged in. If it fails, the token is removed and the login page is shown.

Interview explanation:

> App decides whether the user should see the auth page or the main workspace. It keeps auth state at the top so every page can receive the current token as a prop.

### `src/pages/AuthPage.jsx`

This page handles both login and sign up.

It stores:

- `mode`: either `login` or `signup`.
- `username`
- `password`
- `error`
- `isLoading`

On submit, it calls either `logIn` or `signUp` from `analysisApi.js`. Both return `{ token, user }`. The result is passed up to `App` through `onAuth`.

Interview explanation:

> AuthPage is a controlled form. React state owns the input values, and the submit handler sends those values to the API.

### `src/pages/Home.jsx`

This is the main signed in workspace.

It stores:

- selected upload files
- current analysis result
- saved history list
- loading and error states

Important handlers:

- `handleSubmit`: sends selected files to the backend and refreshes history.
- `refreshHistory`: loads saved scans for the signed-in user.
- `handleLoadAnalysis`: loads one saved scan by id.
- `handleDeleteAnalysis`: deletes one saved scan and refreshes the list.

Interview explanation:

> Home coordinates the workflow after login. It does not know how fetch works internally; it calls API helper functions and updates React state based on the result.

### `src/components/UploadBox.jsx`

This component owns the upload UI.

It accepts:

- `files`
- `onFilesChange`
- `onSubmit`
- `isLoading`

The input is file-only:

```jsx
<input type="file" multiple />
```

The old folder picker was removed. The component sends only `file.name`, not `webkitRelativePath`.

Interview explanation:

> UploadBox is presentational plus a small amount of file list logic. It does not call the API directly; it gives selected files to Home.

### `src/components/AnalysisResult.jsx`

This renders the saved or newly created analysis.

The main sections are:

- Brief Overview
- Summary
- Purpose
- ELI5
- In Depth
- Uploaded Files
- Language Percentages
- Overview
- Code Quality Notes
- Potential Issues + Security Concerns
- Possible Improvements

`Summary`, `Purpose`, and `ELI5` are grouped under Brief Overview so the user can understand the scan quickly. The deeper technical details live under In Depth. It combines `issues` and `securityConcerns` into one readable section because that is easier to scan.

### `src/components/FileTree.jsx`

This now shows a flat list of selected/uploaded files. The server also stores a flat file tree because folder upload is no longer supported.

### `src/components/LanguageChart.jsx`

This renders simple bars from `languageStats`.

Each stat looks like:

```js
{
  language: "JavaScript",
  bytes: 12345,
  percentage: 62.4
}
```

### `src/api/analysisApi.js`

This file keeps all fetch calls in one place.

Auth helpers:

- `signUp`
- `logIn`
- `getCurrentUser`

Analysis helpers:

- `analyzeFiles`
- `getAnalyses`
- `getAnalysisById`
- `deleteAnalysis`

The helper function `authHeaders(token)` adds this header:

```txt
Authorization: Bearer <token>
```

Interview explanation:

> Keeping fetch calls in one API file makes components easier to read and makes it simpler to update URLs, headers, or error handling later.

## How Data Moves Through The Client

Example: uploading files.

1. User chooses files in `UploadBox`.
2. `UploadBox` calls `onFilesChange`.
3. `Home` stores the files in state.
4. User clicks Analyze.
5. `Home` calls `analyzeFiles(files, token)`.
6. `analysisApi.js` builds `FormData`.
7. Server returns the saved analysis.
8. `Home` stores it in `analysis`.
9. `AnalysisResult` renders it.

## Common Interview Questions

Why store the token in `localStorage`?

For a small project, it is simple and works across refreshes. In a production app, an HTTP-only secure cookie is usually safer because JavaScript cannot read it.

Why pass the token as a prop?

The app is small. Passing the token directly keeps the flow obvious without introducing global state.

Why no folder upload?

The requested workflow is file-only. Normal file input is more predictable across browsers than folder selection.

Why use plain CSS?

The app does not need a component library. Plain CSS keeps the design easy to inspect and explain.
