/* ==========================================================
   AskDocs Dashboard Controller
   Owns: auth check, profile, document loading (chips/sidebar/
   stats). Chat lives in chat.js, quiz in quiz.js, upload in
   upload.js — each module binds its own events independently.
   ========================================================== */

document.addEventListener("DOMContentLoaded", initDashboard);

/* ==========================================================
   INITIALIZE DASHBOARD
   ========================================================== */

async function initDashboard() {

    try {

        // Check authentication (currently a no-op stub — see auth.js)
        requireAuth();

        // Load logged in user
        await loadUserProfile();

        // Load documents into chips / sidebar / stats
        await loadDocuments();

    }
    catch (err) {

        console.error("[dashboard.js] initDashboard failed:", err);

    }

}

/* ==========================================================
   LOAD USER PROFILE
   ========================================================== */

async function loadUserProfile() {

    try {

        const profile = await getProfile();

        if (!profile.user) return;

        const username = document.getElementById("username");
        const avatar = document.getElementById("avatarInitial");

        if (username) {
            username.innerText = profile.user.full_name;
        }

        if (avatar && profile.user.full_name) {
            avatar.innerText = profile.user.full_name.trim().charAt(0).toUpperCase();
        }

    }
    catch (err) {

        // Don't force the logout confirmation modal here — a failed
        // profile fetch is often just a transient hiccup, not proof
        // the session is actually dead. Real session expiry (a true
        // 401) is already handled separately and silently by the
        // global check in api.js's apiRequest() — that one bypasses
        // the modal entirely and redirects straight to login, which
        // is the correct behavior for an actually-expired token.
        console.warn("[dashboard.js] Could not load profile:", err);

        const username = document.getElementById("username");
        const avatar = document.getElementById("avatarInitial");

        if (username) username.innerText = "Guest";
        if (avatar) avatar.innerText = "G";

    }

}

/* ==========================================================
   LOAD DOCUMENTS (chips + recent list + stat count)
   ========================================================== */

async function loadDocuments() {

    try {

        const result = await getDocuments();

        const documents =
            result?.data ??
            result?.documents ??
            (Array.isArray(result) ? result : []);

        renderUploadedChips(documents);
        renderRecentDocuments(documents);
        updateStats(documents.length);

    }
    catch (err) {

        console.warn("[dashboard.js] Could not load documents yet:", err);

    }

}

function renderUploadedChips(documents) {

    const container = document.getElementById("uploadedDocuments");

    if (!container) return;

    if (!documents.length) {
        container.innerHTML = '<span class="chip-empty">No documents uploaded yet — click "Upload Document" to get started.</span>';
        return;
    }

    container.innerHTML = "";

    documents.forEach(doc => {

        const filename = doc.filename || doc.name || "Untitled document";
        const docId = doc.document_id || doc.id || "";

        const chip = document.createElement("div");
        chip.className = "document-chip";
        chip.innerHTML = `
            <span class="chip-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8l5 5v11a1.6 1.6 0 01-1.6 1.6H6A1.6 1.6 0 014.4 20V5.6A1.6 1.6 0 016 4z"/><path d="M14 4v5h5"/></svg></span>
            <span>${filename}</span>
            <button type="button" aria-label="Remove ${filename}" onclick="removeDocument(this,'${docId}')">✕</button>
        `;

        container.appendChild(chip);

    });

}

function renderRecentDocuments(documents) {

    const container = document.getElementById("recentDocuments");

    if (!container) return;

    if (!documents.length) {
        container.innerHTML = '<div class="sources-empty">No documents yet.</div>';
        return;
    }

    container.innerHTML = "";

    documents.forEach(doc => {

        const filename = doc.filename || doc.name || "Untitled document";

        const item = document.createElement("div");
        item.className = "recent-doc";
        item.innerHTML = `
            <div class="recent-doc-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h8l5 5v11a1.6 1.6 0 01-1.6 1.6H6A1.6 1.6 0 014.4 20V5.6A1.6 1.6 0 016 4z"/><path d="M14 4v5h5"/></svg>
            </div>
            <div class="recent-doc-info">
                <h5>${filename}</h5>
                <span>Uploaded</span>
            </div>
        `;

        container.appendChild(item);

    });

}

/* ==========================================================
   DASHBOARD STATS
   ========================================================== */

function updateStats(documentCount = 0) {

    const count = document.getElementById("docCount");

    if (count) {

        count.innerText = documentCount;

    }

}

/* ==========================================================
   REFRESH DASHBOARD
   ========================================================== */

async function refreshDashboard() {

    await loadUserProfile();

    await loadDocuments();

}

/* ==========================================================
   EXPORTS
   ========================================================== */

window.refreshDashboard = refreshDashboard;
window.renderUploadedChips = renderUploadedChips;
window.renderRecentDocuments = renderRecentDocuments;
window.updateStats = updateStats;