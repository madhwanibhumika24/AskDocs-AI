/* ==========================================================
   AskDocs Dashboard Controller
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

        // Bind all UI events
        bindEvents();

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

        // Auth isn't wired up yet, so this is expected for now —
        // just fall back to a placeholder instead of crashing.
        console.warn("[dashboard.js] Could not load profile (auth not set up yet):", err);

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
            <span class="chip-icon">📄</span>
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
   EVENTS
   ========================================================== */

function bindEvents() {

    // Send Button
    const sendBtn = document.getElementById("sendBtn");

    if (sendBtn) {

        sendBtn.addEventListener("click", askQuestion);

    }

    // Enter key (Shift+Enter for newline)
    const questionInput = document.getElementById("question");

    if (questionInput) {

        questionInput.addEventListener("keydown", function (e) {

            if (e.key === "Enter" && !e.shiftKey) {

                e.preventDefault();

                askQuestion();

            }

        });

    }

}

/* ==========================================================
   SEND QUESTION
   ========================================================== */

async function askQuestion() {

    const input = document.getElementById("question");

    if (!input) return;

    const question = input.value.trim();

    if (question === "") return;

    addUserMessage(question);

    input.value = "";
    input.style.height = "auto";

    try {

        const response = await sendMessage(question);

        addAIMessage(response.answer);

        updateSources(response.sources);

    }
    catch (err) {

        console.error("[dashboard.js] sendMessage failed:", err);

        addAIMessage("Unable to contact AI. Check the console for details.");

    }

}

/* ==========================================================
   USER MESSAGE
   ========================================================== */

function addUserMessage(message) {

    const container = document.getElementById("messages");

    if (!container) return;

    const el = document.createElement("div");
    el.className = "message user";
    el.innerHTML = `
        <span class="msg-avatar" aria-hidden="true">You</span>
        <div class="bubble"></div>
    `;
    el.querySelector(".bubble").textContent = message;

    container.appendChild(el);

    container.scrollTop = container.scrollHeight;

}

/* ==========================================================
   AI MESSAGE
   ========================================================== */

function addAIMessage(message) {

    const container = document.getElementById("messages");

    if (!container) return;

    const el = document.createElement("div");
    el.className = "message ai";
    el.innerHTML = `
        <span class="msg-avatar" aria-hidden="true">AI</span>
        <div class="bubble"></div>
    `;
    el.querySelector(".bubble").textContent = message;

    container.appendChild(el);

    container.scrollTop = container.scrollHeight;

}

/* ==========================================================
   SOURCES
   ========================================================== */

function updateSources(sources) {

    const panel = document.getElementById("sourceList");

    if (!panel) return;

    panel.innerHTML = "";

    if (!sources || sources.length === 0) {

        panel.innerHTML = `<div class="sources-empty">No sources found for this answer.</div>`;

        return;

    }

    sources.forEach(source => {

        const card = document.createElement("div");
        card.className = "source-card";
        card.innerHTML = `
            <div class="source-inner">
                <h4>${source.filename || "Document"}</h4>
                <p>Page ${source.page || "-"}</p>
            </div>
        `;

        panel.appendChild(card);

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
window.askQuestion = askQuestion;
window.addUserMessage = addUserMessage;
window.addAIMessage = addAIMessage;
window.updateSources = updateSources;
window.updateStats = updateStats;