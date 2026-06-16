# CodeScope Deployment

This app deploys as two services:

- Frontend: Vercel project rooted at `codescope/client`
- Backend: Railway service rooted at `codescope/server`

## Railway Backend

Create a Railway service from this repository and set the root directory to:

```txt
codescope/server
```

Railway will use `railway.json`, install dependencies with Nixpacks, run `npm start`, and check `GET /health`.

Set these Railway variables:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
AUTH_SECRET=replace_with_a_random_string_at_least_32_characters_long
CLIENT_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
```

Do not set `PORT` on Railway. Railway provides it automatically.
Set `CLIENT_ORIGINS` to the exact frontend origins that may call the API. Use a comma-separated list for multiple frontends, and do not include `/api` in these values.

After Railway deploys, copy the public backend URL. It should look similar to:

```txt
https://your-railway-api.up.railway.app
```

## Vercel Frontend

Create a Vercel project from this repository and set the root directory to:

```txt
codescope/client
```

Use these Vercel settings:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Set this Vercel variable:

```env
VITE_API_URL=https://your-railway-api.up.railway.app/api
```

Set `VITE_API_URL` to the backend API URL, including `/api`.

The included `vercel.json` rewrites all routes to `index.html`, so browser refreshes work on client-side routes.

## Connect Both Services

1. Deploy the backend on Railway first.
2. Put the Railway URL plus `/api` into Vercel as `VITE_API_URL`.
3. Deploy the frontend on Vercel.
4. Put the final Vercel URL into Railway `CLIENT_ORIGINS`.
5. Redeploy the Railway backend after changing `CLIENT_ORIGINS`.

For Vercel preview deployments, add each preview URL to `CLIENT_ORIGINS` if you want that preview to call the Railway API.
