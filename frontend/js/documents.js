/* ==========================================================
   AskDocs Documents View
   Shows every uploaded document as a card. Called from
   quiz.js's shared nav-switching logic the first time someone
   opens the Documents view.
   ========================================================== */

let documentsViewLoaded = false;

/* ==========================================================
   LOAD + RENDER
   ========================================================== */

async function populateDocumentsView() {

    if (documentsViewLoaded) return;

    const grid = document.getElementById("documentsGrid");
    const emptyState = document.getElementById("documentsEmptyState");
    const countHint = document.getElementById("documentsCountHint");

    if (!grid) return;

    try {

        const result = await getDocuments();

        let documents = [];

        if (result && Array.isArray(result.data)) {
            documents = result.data;
        } else if (result && Array.isArray(result.documents)) {
            documents = result.documents;
        } else if (Array.isArray(result)) {
            documents = result;
        }

        if (countHint) {
            countHint.textContent = documents.length === 1
                ? "1 document"
                : documents.length + " documents";
        }

        if (documents.length === 0) {
            if (emptyState) emptyState.hidden = false;
            documentsViewLoaded = true;
            return;
        }

        grid.innerHTML = "";

        for (let i = 0; i < documents.length; i++) {
            grid.appendChild(buildDocumentCard(documents[i]));
        }

        documentsViewLoaded = true;

    }
    catch (error) {

        console.warn("[documents.js] Could not load documents:", error);

        if (countHint) countHint.textContent = "Couldn't load documents";

    }

}

function buildDocumentCard(doc) {

    const filename = doc.filename || doc.name || "Untitled document";
    const docId = doc.document_id || doc.id || "";
    const fileType = (doc.file_type || "").toUpperCase();
    const sizeText = formatFileSize(doc.size);
    const dateText = formatUploadDate(doc.created_at);

    const card = document.createElement("div");
    card.className = "doc-card";
    card.dataset.documentId = docId;

    card.innerHTML = `
        <div class="doc-card-top">
            <div class="doc-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h8l5 5v11a1.6 1.6 0 01-1.6 1.6H6A1.6 1.6 0 014.4 20V5.6A1.6 1.6 0 016 4z"/><path d="M14 4v5h5"/></svg>
            </div>
            <div>
                <p class="doc-card-name">${escapeHtml(filename)}</p>
                <span class="doc-card-meta">${escapeHtml(fileType)} · ${sizeText} · ${dateText}</span>
            </div>
        </div>
        <div class="doc-card-actions">
            <button type="button" class="doc-card-btn chat-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h13l3 3v13H4z"/><path d="M8 10h8M8 14h5"/></svg>
                Chat
            </button>
            <button type="button" class="doc-card-btn quiz-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                Quiz
            </button>
            <button type="button" class="doc-card-btn flashcards-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="14" height="10" rx="2"/><rect x="7" y="10" width="14" height="10" rx="2"/></svg>
                Flashcards
            </button>
            <button type="button" class="doc-card-btn delete-action" aria-label="Delete ${escapeHtml(filename)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg>
            </button>
        </div>
    `;

    card.querySelector(".chat-action").addEventListener("click", function () {
        openDocumentInChat(docId);
    });

    card.querySelector(".quiz-action").addEventListener("click", function () {
        openDocumentInQuiz(docId);
    });

    card.querySelector(".flashcards-action").addEventListener("click", function () {
        openDocumentInFlashcards(docId);
    });

    card.querySelector(".delete-action").addEventListener("click", function () {
        deleteDocumentFromCard(card, docId, filename);
    });

    return card;

}

/* ==========================================================
   "CHAT ABOUT THIS" SHORTCUT
   Switches to the Chat view and pre-selects this document in
   the scope dropdown, once that dropdown has finished loading.
   ========================================================== */

async function openDocumentInChat(docId) {

    const chatNavLink = document.querySelector('.nav-link[data-view="chat-view"]');

    if (chatNavLink) chatNavLink.click();

    // populateChatDocumentSelect() is safe to call again even if the
    // nav click above already started loading it — it reuses the same
    // in-flight request instead of firing a second one.
    if (typeof window.populateChatDocumentSelect === "function") {
        await window.populateChatDocumentSelect();
    }

    const select = document.getElementById("chatDocumentSelect");

    if (select) select.value = docId;

}

/* ==========================================================
   "QUIZ" SHORTCUT
   Same idea as the chat shortcut, but for the quiz document
   selector — jumps to the Quiz view with this document
   pre-selected, ready to hit Generate.
   ========================================================== */

async function openDocumentInQuiz(docId) {

    const quizNavLink = document.querySelector('.nav-link[data-view="quiz-view"]');

    if (quizNavLink) quizNavLink.click();

    if (typeof window.populateQuizDocumentSelect === "function") {
        await window.populateQuizDocumentSelect();
    }

    const select = document.getElementById("quizDocumentSelect");

    if (select) select.value = docId;

}

/* ==========================================================
   "FLASHCARDS" SHORTCUT
   ========================================================== */

async function openDocumentInFlashcards(docId) {

    const flashcardsNavLink = document.querySelector('.nav-link[data-view="flashcards-view"]');

    if (flashcardsNavLink) flashcardsNavLink.click();

    if (typeof window.populateFlashcardDocumentSelect === "function") {
        await window.populateFlashcardDocumentSelect();
    }

    const select = document.getElementById("flashcardDocumentSelect");

    if (select) select.value = docId;

}

/* ==========================================================
   DELETE
   ========================================================== */

async function deleteDocumentFromCard(card, docId, filename) {

    const confirmed = confirm(`Delete "${filename}"? This can't be undone.`);

    if (!confirmed) return;

    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";

    try {

        await deleteDocument(docId);

        card.remove();

        const grid = document.getElementById("documentsGrid");
        const emptyState = document.getElementById("documentsEmptyState");
        const countHint = document.getElementById("documentsCountHint");

        const remaining = grid ? grid.children.length : 0;

        if (countHint) {
            countHint.textContent = remaining === 1
                ? "1 document"
                : remaining + " documents";
        }

        if (remaining === 0 && emptyState) {
            emptyState.hidden = false;
        }

    }
    catch (error) {

        console.error("[documents.js] Failed to delete document:", error);

        card.style.opacity = "1";
        card.style.pointerEvents = "auto";

        alert(error?.message || "Failed to delete document. Check the console for details.");

    }

}

/* ==========================================================
   HELPERS
   ========================================================== */

function formatFileSize(bytes) {

    if (!bytes || isNaN(bytes)) return "—";

    if (bytes < 1024) return bytes + " B";

    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(kb < 10 ? 1 : 0) + " KB";

    const mb = kb / 1024;
    return mb.toFixed(mb < 10 ? 1 : 0) + " MB";

}

function formatUploadDate(isoString) {

    if (!isoString) return "Unknown date";

    const date = new Date(isoString);

    if (isNaN(date.getTime())) return "Unknown date";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

}

function escapeHtml(text) {

    if (text === null || text === undefined) text = "";

    text = String(text);

    text = text.split("&").join("&amp;");
    text = text.split("<").join("&lt;");
    text = text.split(">").join("&gt;");
    text = text.split('"').join("&quot;");
    text = text.split("'").join("&#39;");

    return text;

}

/* ==========================================================
   EXPORTS
   ========================================================== */

window.populateDocumentsView = populateDocumentsView;