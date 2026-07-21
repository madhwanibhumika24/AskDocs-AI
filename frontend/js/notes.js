/* ==========================================================
   AskDocs Notes Module
   ========================================================== */

let notesDocumentsLoaded = false;

document.addEventListener("DOMContentLoaded", bindNotesEvents);

/* ==========================================================
   POPULATE DOCUMENT DROPDOWN
   Called from quiz.js's shared nav-switching logic the first
   time someone opens the Notes view.
   ========================================================== */

async function populateNotesDocumentSelect() {

    const select = document.getElementById("notesDocumentSelect");

    if (!select) return;

    if (notesDocumentsLoaded) {
        if (window.applyPendingRoomSelection) {
            window.applyPendingRoomSelection("notesDocumentSelect");
        }
        return;
    }

    try {

        if (window.addRoomOptionsToSelect) {
            await window.addRoomOptionsToSelect(select);
        }

        const result = await getDocuments();

        let documents = [];

        if (result && Array.isArray(result.data)) {
            documents = result.data;
        } else if (result && Array.isArray(result.documents)) {
            documents = result.documents;
        } else if (Array.isArray(result)) {
            documents = result;
        }

        for (let i = 0; i < documents.length; i++) {

            const doc = documents[i];

            const filename = doc.filename || doc.name || "Untitled document";
            const docId = doc.document_id || doc.id || "";

            const option = document.createElement("option");
            option.value = docId;
            option.textContent = filename;

            select.appendChild(option);

        }

        notesDocumentsLoaded = true;

        if (window.applyPendingRoomSelection) {
            window.applyPendingRoomSelection("notesDocumentSelect");
        }

    }
    catch (error) {

        console.warn("[notes.js] Could not load documents for selector:", error);

    }

}

/* ==========================================================
   EVENTS
   ========================================================== */

function bindNotesEvents() {

    const generateBtn = document.getElementById("generateNotesBtn");
    const regenerateBtn = document.getElementById("regenerateNotesBtn");

    if (generateBtn) {
        generateBtn.addEventListener("click", handleGenerateNotes);
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener("click", resetNotes);
    }

}

/* ==========================================================
   GENERATE NOTES
   ========================================================== */

async function handleGenerateNotes() {

    const documentSelect = document.getElementById("notesDocumentSelect");
    const scope = window.readScopeFromSelect
        ? window.readScopeFromSelect(documentSelect)
        : { documentId: documentSelect ? documentSelect.value : "", roomId: null };

    setGenerating(true);

    try {

        const result = await generateNotes(scope.documentId, scope.roomId);

        const sections = (result && result.sections) ? result.sections : [];

        if (sections.length === 0) {
            alert("The AI didn't return any notes. Try again, or pick a different document.");
            return;
        }

        renderNotes(sections);

    }
    catch (error) {

        console.error("[notes.js] Notes generation failed:", error);

        const message = (error && error.message)
            ? error.message
            : "Failed to generate notes. Check the console for details.";

        alert(message);

    }
    finally {

        setGenerating(false);

    }

}

function setGenerating(isGenerating) {

    const btn = document.getElementById("generateNotesBtn");

    if (!btn) return;

    btn.disabled = isGenerating;

    if (isGenerating) {
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Generating…';
    } else {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg> Generate Notes';
    }

}

/* ==========================================================
   RENDER NOTES
   ========================================================== */

function renderNotes(sections) {

    const emptyState = document.getElementById("notesEmptyState");
    const resultsPanel = document.getElementById("notesResultsPanel");
    const container = document.getElementById("notesSections");

    if (!container || !resultsPanel) return;

    if (emptyState) emptyState.hidden = true;
    resultsPanel.hidden = false;

    container.innerHTML = "";

    for (let i = 0; i < sections.length; i++) {

        const section = sections[i];
        container.appendChild(buildSectionElement(section));

    }

    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });

}

function buildSectionElement(section) {

    const wrapper = document.createElement("div");
    wrapper.className = "notes-section";

    const heading = escapeHtml(section.heading || "Untitled section");

    let pointsHtml = "";
    const points = section.points || [];

    for (let i = 0; i < points.length; i++) {
        pointsHtml += `<li>${escapeHtml(points[i])}</li>`;
    }

    wrapper.innerHTML = `
        <h4>${heading}</h4>
        <ul>${pointsHtml}</ul>
    `;

    return wrapper;

}

/* ==========================================================
   RESET
   ========================================================== */

function resetNotes() {

    const resultsPanel = document.getElementById("notesResultsPanel");
    const emptyState = document.getElementById("notesEmptyState");
    const container = document.getElementById("notesSections");

    if (resultsPanel) resultsPanel.hidden = true;
    if (emptyState) emptyState.hidden = false;
    if (container) container.innerHTML = "";

}

/* ==========================================================
   ESCAPE HTML
   ========================================================== */

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

window.populateNotesDocumentSelect = populateNotesDocumentSelect;