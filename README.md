# CodeScope

CodeScope is a MERN style code analysis app. A user creates an account, uploads one or more code files, receives a readable developer focused scan, and can reopen or delete saved scan history later.

The app is intentionally file only.

## What The App Does

1. The React client asks the user to sign up or log in.
2. The server stores the account in MongoDB with a hashed password.
3. After login, the client stores a signed bearer token in `localStorage`.
4. The user uploads files from the scanner page.
5. Express receives the files through `multer`.
6. The scanner skips unsafe or unsupported files, reads supported text/code files, and builds language percentages.
7. The backend sends a limited snapshot of the files to Gemini.
8. Gemini returns JSON with overview, purpose, potential issues, security concerns, code quality notes, possible improvements, and ELI5.
9. The server saves the result with the current user's `userId`.
10. The history panel shows only that user's saved scans and lets them delete old results.

The result page is split into two readable groups. Brief Overview shows `Summary`, `Purpose`, and `ELI5`. In Depth shows `Uploaded Files`, `Language Percentages`, `Overview`, `Code Quality Notes`, `Potential Issues + Security Concerns`, and `Possible Improvements`.

## Tech Stack

- React and Vite for the browser UI.
- Express for the API.
- MongoDB and Mongoose for users and saved analyses.
- `multer` for file uploads.
- Node `crypto` for password hashing and signed auth tokens.
- Gemini through `@google/genai` for the code explanation.
- Plain CSS for the visual design.

## Run Locally

Install server dependencies:

```bash
cd codescope/server
npm install
```

Install client dependencies:

```bash
cd ../client
npm install
```

Create `codescope/server/.env` from `codescope/server/.env.example`:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
AUTH_SECRET=replace_with_a_random_string_at_least_32_characters_long
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
cd codescope/server
npm run dev
```

Start the frontend in another terminal:

```bash
cd codescope/client
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Deploy

Use [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel frontend and Railway backend setup.

## API Routes

Auth:

- `POST /api/auth/signup` creates an account and returns a token.
- `POST /api/auth/login` checks the password and returns a token.
- `GET /api/auth/me` returns the signed-in user.

Analysis:

- `POST /api/analyze` uploads files, analyzes them, and saves the result.
- `GET /api/analyses` returns the current user's recent saved scans.
- `GET /api/analyses/:id` returns one saved scan owned by the current user.
- `DELETE /api/analyses/:id` deletes one saved scan owned by the current user.

All analysis routes require an `Authorization: Bearer <token>` header.

## Upload Rules

- File upload only. 
- Maximum 120 files per scan.
- Maximum 5 MB per uploaded file.
- Binary/media files are skipped.
- Lock files, `.env` files, `node_modules`, `.git`, `dist`, `build`, and similar noise are skipped.
- The server sends a limited amount of text to Gemini so large files do not overload the request.

## File Map

```txt
codescope/
  client/
    src/
      api/analysisApi.js        Browser API helpers.
      pages/AuthPage.jsx        Sign up and login screen.
      pages/Home.jsx            Main upload, result, and history page.
      components/UploadBox.jsx  File-only upload UI.
      components/AnalysisResult.jsx
      components/FileTree.jsx
      components/LanguageChart.jsx
      styles.css
  server/
    src/
      app.js                    Express app setup.
      server.js                 Starts the API and connects MongoDB.
      config/db.js              MongoDB connection helper.
      controllers/authController.js
      controllers/analysisController.js
      middleware/authMiddleware.js
      models/User.js
      models/Analysis.js
      routes/authRoutes.js
      routes/analysisRoutes.js
      services/authService.js
      services/fileScanner.js
      services/geminiService.js
      services/languageStats.js
      utils/extensionMap.js
```

For deeper walkthroughs, read:

- [client/README.md](client/README.md)
- [server/README.md](server/README.md)
