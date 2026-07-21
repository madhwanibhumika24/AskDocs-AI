/* ==========================================================
   AskDocs Chat Module
   ========================================================== */

let chatDocumentsLoaded = false;
let chatDocumentsLoadPromise = null;

document.addEventListener("DOMContentLoaded", bindChatEvents);

/* ==========================================================
   EVENTS
   ========================================================== */

function bindChatEvents() {

    const sendBtn = document.getElementById("sendBtn");

    if (sendBtn) {
        sendBtn.addEventListener("click", askQuestion);
    }

    const questionInput = document.getElementById("question");

    if (questionInput) {

        questionInput.addEventListener("keydown", function (e) {

            if (e.key === "Enter" && !e.shiftKey) {

                e.preventDefault();

                askQuestion();

            }

        });

    }

    const summarizeBtn = document.getElementById("summarizeBtn");

    if (summarizeBtn) {
        summarizeBtn.addEventListener("click", askForSummary);
    }

}

/* ==========================================================
   SUMMARIZE QUICK ACTION
   Pre-fills a summary-style question (matching the backend's
   broad-question detection) and sends it right away, scoped to
   whatever document is currently selected in the dropdown.
   ========================================================== */

async function askForSummary() {

    const documentSelect = document.getElementById("chatDocumentSelect");
    const documentId = documentSelect ? documentSelect.value : "";

    if (!documentId) {
        alert("Pick a specific document or room from the dropdown first — summarizing works best when scoped, not across everything.");
        return;
    }

    const input = document.getElementById("question");

    if (input) {
        input.value = "Summarize this document.";
    }

    await askQuestion();

}

/* ==========================================================
   DOCUMENT SCOPE SELECTOR
   ========================================================== */

async function populateChatDocumentSelect() {

    const select = document.getElementById("chatDocumentSelect");

    if (!select) return;

    if (chatDocumentsLoaded) {
        // Already loaded — still check whether we arrived here from a
        // room's quick-action button and need to select that room.
        if (window.applyPendingRoomSelection) {
            window.applyPendingRoomSelection("chatDocumentSelect");
        }
        return;
    }

    if (!chatDocumentsLoadPromise) {
        chatDocumentsLoadPromise = loadChatDocumentOptions(select);
    }

    await chatDocumentsLoadPromise;

    if (window.applyPendingRoomSelection) {
        window.applyPendingRoomSelection("chatDocumentSelect");
    }

}

async function loadChatDocumentOptions(select) {

    try {

        if (window.addRoomOptionsToSelect) {
            await window.addRoomOptionsToSelect(select);
        }

        const result = await getDocuments();

        const documents =
            result?.data ??
            result?.documents ??
            (Array.isArray(result) ? result : []);

        documents.forEach(doc => {

            const filename = doc.filename || doc.name || "Untitled document";
            const docId = doc.document_id || doc.id || "";

            const option = document.createElement("option");
            option.value = docId;
            option.textContent = filename;

            select.appendChild(option);

        });

        chatDocumentsLoaded = true;

    }
    catch (error) {

        console.warn("[chat.js] Could not load documents for chat selector:", error);

    }

}

/* ==========================================================
   SEND QUESTION
   ========================================================== */

async function askQuestion() {

    const input = document.getElementById("question");
    const documentSelect = document.getElementById("chatDocumentSelect");

    if (!input) return;

    const question = input.value.trim();

    if (question === "") return;

    const scope = window.readScopeFromSelect
        ? window.readScopeFromSelect(documentSelect)
        : { documentId: documentSelect ? documentSelect.value : "", roomId: null };

    addUserMessage(question);

    input.value = "";
    input.style.height = "auto";

    setSending(true);

    const typingBubble = addTypingIndicator();

    try {

        const response = await sendMessage(question, scope.documentId, scope.roomId);

        removeTypingIndicator(typingBubble);

        addAIMessage(response.answer);

        updateSources(response.sources);

    }
    catch (err) {

        console.error("[chat.js] sendMessage failed:", err);

        removeTypingIndicator(typingBubble);

        addAIMessage("Unable to contact AI. Check the console for details.");

    }
    finally {

        setSending(false);

    }

}

function setSending(isSending) {

    const sendBtn = document.getElementById("sendBtn");
    const summarizeBtn = document.getElementById("summarizeBtn");

    if (sendBtn) sendBtn.disabled = isSending;
    if (summarizeBtn) summarizeBtn.disabled = isSending;

}

/* ==========================================================
   TYPING INDICATOR
   Shown while waiting on the AI's response, removed once the
   real answer (or an error message) replaces it.
   ========================================================== */

function addTypingIndicator() {

    const container = document.getElementById("messages");

    if (!container) return null;

    const el = document.createElement("div");
    el.className = "message ai";
    el.innerHTML = `
        <span class="msg-avatar" aria-hidden="true">AI</span>
        <div class="bubble">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    container.appendChild(el);

    container.scrollTop = container.scrollHeight;

    return el;

}

function removeTypingIndicator(el) {

    if (el) el.remove();

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
   EXPORTS
   ========================================================== */

window.askQuestion = askQuestion;
window.addUserMessage = addUserMessage;
window.addAIMessage = addAIMessage;
window.updateSources = updateSources;
window.populateChatDocumentSelect = populateChatDocumentSelect;