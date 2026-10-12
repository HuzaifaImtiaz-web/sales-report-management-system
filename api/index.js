// Vercel serverless entry point. vercel.json sends every /api/* request (and /health) here; the
// Express app in server/ routes them exactly as it does when it runs as a normal server.
// Database schema changes are applied with `npm run migrate`, not on each cold start.
import serverApp from '../server/src/app.js';
import serverDb from '../server/src/db/index.js';

export default serverApp.createApp({ db: serverDb.getDb() });
