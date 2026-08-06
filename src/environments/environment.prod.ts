export const environment = {
  production: true,
  // Set this to your deployed backend's public URL (e.g. Render/Railway/Azure
  // App Service), including the /api suffix. Vercel only hosts this frontend -
  // the .NET + SQLite backend needs a separate host that runs a persistent
  // process (Vercel's serverless functions don't support .NET, and SQLite's
  // file storage wouldn't survive Vercel's ephemeral filesystem anyway).
  apiBaseUrl: 'https://REPLACE-WITH-YOUR-BACKEND-URL/api'
};
