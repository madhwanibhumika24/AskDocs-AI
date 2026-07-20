/* ==========================================================
   AskDocs Auth Module
   ========================================================== */

// Runs immediately when this script loads, before requireAuth() is
// called — catches the token Google OAuth hands back after login.
// The backend redirects here as: dashboard.html?token=xxxxx
(function captureTokenFromGoogleRedirect() {

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {

        localStorage.setItem("access_token", tokenFromUrl);

        // Remove the token from the visible URL so it doesn't sit in
        // browser history / get shared accidentally in a screenshot.
        params.delete("token");
        const cleanUrl = window.location.pathname +
            (params.toString() ? "?" + params.toString() : "");
        window.history.replaceState({}, "", cleanUrl);

    }

})();

function requireAuth() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        console.log("[auth.js] No token found — redirecting to login.");
        window.location.href = "login.html";
        return;
    }

    // Having a token doesn't guarantee it's still valid (it may have
    // expired) — dashboard.js's loadUserProfile() already calls
    // /auth/profile on page load and handles a 401 there, so an
    // expired token gets caught right after this check runs.

}

function logout() {

    const modal = document.getElementById("logoutModal");

    if (!modal) {
        // Fallback for any page that doesn't have the modal markup —
        // shouldn't normally happen, but better than silently doing
        // nothing if it's ever missing.
        localStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
    }

    modal.classList.add("open");

}

function performLogout() {

    localStorage.removeItem("access_token");

    window.location.href = "login.html";

}

function closeLogoutModal() {

    const modal = document.getElementById("logoutModal");

    if (modal) modal.classList.remove("open");

}

// Wire up the modal's buttons once the page has loaded.
document.addEventListener("DOMContentLoaded", function () {

    const confirmBtn = document.getElementById("logoutConfirmBtn");
    const cancelBtn = document.getElementById("logoutCancelBtn");
    const modal = document.getElementById("logoutModal");

    if (confirmBtn) confirmBtn.addEventListener("click", performLogout);
    if (cancelBtn) cancelBtn.addEventListener("click", closeLogoutModal);

    // Clicking the dark backdrop (outside the card) also cancels.
    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) closeLogoutModal();
        });
    }

});

/* ==========================================================
   EXPORTS
   ========================================================== */

window.requireAuth = requireAuth;
window.logout = logout;