/* ==========================================================
   AskDocs Auth Module
   TEMPORARY STUB — real auth wiring comes later.
   Keeps requireAuth()/logout() as no-ops so other scripts
   (dashboard.js, upload.js, chat.js) don't crash while
   auth isn't implemented yet.
========================================================== */

function requireAuth() {

    // Auth is not wired up yet — intentionally does nothing.
    // Once login is built, this should check for a token in
    // localStorage and redirect to /login if missing.
    console.log("[auth.js] requireAuth() — auth disabled during development");

}

function logout() {

    // Intentionally NOT clearing tokens or redirecting yet,
    // so a failed /auth/profile call doesn't bounce you out
    // of the page while you're testing other features.
    console.log("[auth.js] logout() called — no-op (auth disabled during development)");

}

/* ==========================================================
   EXPORTS
========================================================== */

window.requireAuth = requireAuth;
window.logout = logout;