# OC BATTLE LINK Deploy

## Local run

1. Copy `.env.example` to `.env`
2. Set `COHERE_API_KEY`
3. Run `npm start`
4. Open `http://localhost:3000`

## Why this hides the API key

- The browser no longer calls Cohere directly.
- The browser calls `/api/cohere/chat` on your server.
- Your server reads `COHERE_API_KEY` from environment variables.
- The key is never shipped to the client.

## Easy publish options

### Render

1. Push this folder to GitHub
2. Create a new Web Service on Render
3. Build command: leave empty
4. Start command: `npm start`
5. Add environment variable `COHERE_API_KEY`
6. Optional: add `COHERE_MODEL_DEFAULT=command-r-plus-08-2024`

### Railway

1. Push this folder to GitHub
2. Create a new project from the repo
3. Add environment variable `COHERE_API_KEY`
4. Deploy

## Important

- Do not put the Cohere API key back into the frontend.
- Do not commit `.env`.
- For production, keep `COHERE_API_KEY` only in the hosting platform's secret settings.
