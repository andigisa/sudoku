// CJS entry point for hosting providers that use require() (e.g. Hostinger/LiteSpeed).
// Dynamically imports the ESM app which has top-level await.
import("./apps/server/dist/index.js").catch((err) => {
  console.error(err);
  process.exit(1);
});
