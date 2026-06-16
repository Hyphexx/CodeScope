# CodeScope Server

This is the Express backend. It handles user accounts, protected routes, file uploads, file scanning, Gemini analysis, and saved scan history.

## Main Flow

1. `src/server.js` loads environment variables, connects MongoDB, and starts Express.
2. `src/app.js` creates the Express app, enables CORS, parses JSON, and mounts routes.
3. `authRoutes.js` handles sign up, login, and current-user lookup.
4. `analysisRoutes.js` handles upload, saved history lookup, and delete.
5. `requireAuth` protects analysis routes.
6. `fileScanner.js` filters and reads uploaded files.
7. `languageStats.js` calculates language percentages.
8. `geminiService.js` asks Gemini for a structured JSON explanation.
9. `Analysis.js` saves the scan with the current user's `userId`.

## Environment Variables

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
AUTH_SECRET=replace_with_a_random_string_at_least_32_characters_long
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://your-vercel-app.vercel.app
```

`AUTH_SECRET` signs login tokens. Use a long random value in real deployments. Use `CLIENT_ORIGINS` when more than one frontend origin should call the API.

## Important Files

### `src/server.js`

This is the entry point.

It does three things:

1. Loads `.env`.
2. Calls `connectDB()`.
3. Starts listening on `PORT`.

Interview explanation:

> server.js is intentionally small. It starts infrastructure but leaves route behavior inside app.js and the route/controller files.

### `src/app.js`

This creates the Express application.

It configures:

- CORS for the frontend origin.
- JSON body parsing.
- `GET /` health response.
- `/api/auth` auth routes.
- `/api` analysis routes.
- Upload limit error messages.

Interview explanation:

> app.js is where middleware and route modules are assembled.

### `src/config/db.js`

This connects to MongoDB through Mongoose.

If `MONGO_URI` is missing or the connection fails, the server still starts, but account-protected routes return an error because accounts need MongoDB.

### `src/models/User.js`

User records store:

- `username`
- `passwordHash`
- `createdAt`

The password itself is never stored.

### `src/models/Analysis.js`

Analysis records store:

- `userId`
- `projectName`
- `fileCount`
- `folderCount`
- `languageStats`
- `fileTree`
- `skippedFiles`
- `geminiResult`
- `createdAt`

`userId` is the ownership link. History routes always filter by both analysis id and `req.user._id`.

### `src/services/authService.js`

This owns password and token logic.

Password hashing:

- Creates a random salt.
- Uses PBKDF2 with SHA-256.
- Stores algorithm, iteration count, salt, and hash in one string.

Token creation:

- Builds a small JSON payload with user id, username, and expiration.
- Base64url encodes the payload.
- Signs it with HMAC-SHA256 and `AUTH_SECRET`.

Token verification:

- Splits payload and signature.
- Recreates the signature.
- Rejects invalid or expired tokens.

Interview explanation:

> The server trusts the token only if the signature matches. A user cannot change the user id inside the token without breaking the signature.

### `src/middleware/authMiddleware.js`

`requireAuth` protects routes.

It:

1. Checks MongoDB is connected.
2. Reads `Authorization: Bearer <token>`.
3. Verifies the token.
4. Loads the user from MongoDB.
5. Attaches the user to `req.user`.

Any controller after this middleware can trust `req.user`.

### `src/controllers/authController.js`

Handles auth requests.

- `signUp`: validates username/password, checks duplicate usernames, hashes password, creates user, returns token.
- `logIn`: finds user, verifies password, returns token.
- `getMe`: returns the current signed-in user.

### `src/routes/authRoutes.js`

Maps auth URLs to controller functions.

```txt
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

### `src/routes/analysisRoutes.js`

Configures `multer` and maps analysis URLs.

Upload limits:

- 5 MB per file.
- 120 files per request.

Routes:

```txt
POST   /api/analyze
GET    /api/analyses
GET    /api/analyses/:id
DELETE /api/analyses/:id
```

All routes use `requireAuth`.

### `src/controllers/analysisController.js`

This coordinates a scan.

`createAnalysis`:

1. Requires at least one uploaded file.
2. Calls `scanUploadedFiles`.
3. Rejects the request if no supported files remain.
4. Calculates language stats.
5. Calls Gemini.
6. Builds an analysis payload.
7. Saves it with `userId: req.user._id`.
8. Deletes temporary uploaded files.
9. Returns the saved analysis.

`getAnalyses`:

- Returns recent scans for only the signed-in user.

`getAnalysisById`:

- Returns one scan only if it belongs to the signed in user.

`deleteAnalysis`:

- Deletes one scan only if it belongs to the signed in user.

### `src/services/fileScanner.js`

This reads and filters files.

It does not support folders now. Even if a browser sends a path, the server keeps only the base filename with `path.basename`.

Important limits:

- `MAX_TEXT_CHARS`: total text sent to Gemini.
- `MAX_SINGLE_FILE_CHARS`: max text read from one file for Gemini.

The scanner returns:

- `projectName`
- `fileCount`
- `folderCount`
- `fileTree`
- `safeFiles`
- `skippedFiles`
- `totalChars`

### `src/services/languageStats.js`

This calculates language percentages based on file extensions and file sizes.

Example:

```js
[
  { language: "JavaScript", bytes: 10240, percentage: 70.5 },
  { language: "CSS", bytes: 4280, percentage: 29.5 }
]
```

### `src/services/geminiService.js`

This builds a project snapshot and prompt, calls Gemini, and parses JSON.

The requested output keys are:

- `overviewParagraph`
- `summary`
- `purpose`
- `structureNotes`
- `issues`
- `securityConcerns`
- `qualityNotes`
- `improvements`
- `beginnerExplanation`

The frontend displays `improvements` as Possible Improvements. The stored key stays short because it is part of the JSON shape returned by the analysis service.

If Gemini is unavailable or returns bad JSON, the service returns a fallback object so the UI still has something to render.

### `src/utils/extensionMap.js`

This file controls which uploads are useful.

It contains:

- supported language extensions
- supported text file names
- ignored folder names
- ignored sensitive or noisy file names
- binary/media extensions to skip

## Security Notes

- Passwords are hashed, not stored in plain text.
- Auth tokens are signed and expire.
- Analysis routes require a valid token.
- History queries filter by `userId`.
- `.env` files are ignored during scanning.
- Gemini calls happen on the server, not in the browser.

## Common Interview Questions

Why use middleware for auth?

Middleware keeps repeated auth checks out of every controller. Once `requireAuth` passes, the controller can focus on business logic.

Why use `userId` on analyses?

It creates ownership. Without `userId`, every saved scan would be global.

Why clean up uploads after scanning?

Uploaded files are temporary. Leaving them on disk would waste storage and could keep sensitive code longer than needed.

Why parse Gemini as JSON?

The UI needs predictable fields. JSON is easier to render than free-form text.

What would you improve next?

Use HTTP-only cookies for auth, add rate limiting, add request logging, add tests, and consider background jobs for large scans.
