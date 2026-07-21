/* ==========================================================
   AskDocs Flashcards Module
   ========================================================== */

let currentFlashcards = [];
let currentCardIndex = 0;
let flashcardDocumentsLoaded = false;
let flashcardDocumentsLoadPromise = null;

document.addEventListener("DOMContentLoaded", bindFlashcardEvents);

/* ==========================================================
   POPULATE DOCUMENT DROPDOWN
   Called from quiz.js's shared nav-switching logic the first
   time someone opens the Flashcards view.
   ========================================================== */

async function populateFlashcardDocumentSelect() {

    const select = document.getElementById("flashcardDocumentSelect");

    if (!select) return;

    if (flashcardDocumentsLoaded) {
        if (window.applyPendingRoomSelection) {
            window.applyPendingRoomSelection("flashcardDocumentSelect");
        }
        return;
    }

    if (!flashcardDocumentsLoadPromise) {
        flashcardDocumentsLoadPromise = loadFlashcardDocumentOptions(select);
    }

    await flashcardDocumentsLoadPromise;

    if (window.applyPendingRoomSelection) {
        window.applyPendingRoomSelection("flashcardDocumentSelect");
    }

}

async function loadFlashcardDocumentOptions(select) {

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

        flashcardDocumentsLoaded = true;

    }
    catch (error) {

        console.warn("[flashcards.js] Could not load documents for selector:", error);

    }

}

/* ==========================================================
   EVENTS
   ========================================================== */

function bindFlashcardEvents() {

    const generateBtn = document.getElementById("generateFlashcardsBtn");
    const regenerateBtn = document.getElementById("regenerateFlashcardsBtn");
    const flashcardEl = document.getElementById("flashcard");
    const prevBtn = document.getElementById("flashcardPrevBtn");
    const nextBtn = document.getElementById("flashcardNextBtn");

    if (generateBtn) {
        generateBtn.addEventListener("click", handleGenerateFlashcards);
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener("click", resetFlashcards);
    }

    if (flashcardEl) {
        flashcardEl.addEventListener("click", flipCurrentCard);
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", goToPreviousCard);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", goToNextCard);
    }

}

/* ==========================================================
   GENERATE FLASHCARDS
   ========================================================== */

async function handleGenerateFlashcards() {

    const documentSelect = document.getElementById("flashcardDocumentSelect");
    const countInput = document.getElementById("flashcardCount");

    const scope = window.readScopeFromSelect
        ? window.readScopeFromSelect(documentSelect)
        : { documentId: documentSelect ? documentSelect.value : "", roomId: null };
    const numCards = getValidCardCount(countInput);

    setGenerating(true);

    try {

        const result = await generateFlashcards(scope.documentId, numCards, scope.roomId);

        currentFlashcards = (result && result.flashcards) ? result.flashcards : [];

        if (currentFlashcards.length === 0) {
            alert("The AI didn't return any flashcards. Try again, or pick a different document.");
            return;
        }

        currentCardIndex = 0;
        showStudyPanel();
        renderCurrentCard();

    }
    catch (error) {

        console.error("[flashcards.js] Flashcard generation failed:", error);

        const message = (error && error.message)
            ? error.message
            : "Failed to generate flashcards. Check the console for details.";

        alert(message);

    }
    finally {

        setGenerating(false);

    }

}

function getValidCardCount(inputElement) {

    if (!inputElement) return 10;

    let count = parseInt(inputElement.value, 10);

    if (isNaN(count)) {
        count = 10;
    }

    if (count < 1) {
        count = 1;
    }

    if (count > 30) {
        count = 30;
    }

    return count;

}

function setGenerating(isGenerating) {

    const btn = document.getElementById("generateFlashcardsBtn");

    if (!btn) return;

    btn.disabled = isGenerating;

    if (isGenerating) {
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Generating…';
    } else {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="14" height="10" rx="2"/><rect x="7" y="10" width="14" height="10" rx="2"/></svg> Generate Flashcards';
    }

}

/* ==========================================================
   SHOW / HIDE PANELS
   ========================================================== */

function showStudyPanel() {

    const emptyState = document.getElementById("flashcardEmptyState");
    const studyPanel = document.getElementById("flashcardStudyPanel");

    if (emptyState) emptyState.hidden = true;
    if (studyPanel) {
        studyPanel.hidden = false;
        studyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

}

/* ==========================================================
   RENDER CURRENT CARD
   ========================================================== */

function renderCurrentCard() {

    if (currentFlashcards.length === 0) return;

    const card = currentFlashcards[currentCardIndex];

    const termEl = document.getElementById("flashcardTerm");
    const definitionEl = document.getElementById("flashcardDefinition");
    const progressEl = document.getElementById("flashcardProgressText");
    const flashcardEl = document.getElementById("flashcard");
    const prevBtn = document.getElementById("flashcardPrevBtn");
    const nextBtn = document.getElementById("flashcardNextBtn");

    if (termEl) termEl.textContent = card.term;
    if (definitionEl) definitionEl.textContent = card.definition;

    if (progressEl) {
        progressEl.textContent = (currentCardIndex + 1) + " / " + currentFlashcards.length;
    }

    // Always show the front (term) side when a new card is displayed.
    if (flashcardEl) flashcardEl.classList.remove("is-flipped");

    // Disable Prev on the first card and change Next to "Done" on the
    // last card, so the buttons make sense at both ends of the deck.
    if (prevBtn) {
        prevBtn.disabled = (currentCardIndex === 0);
    }

    if (nextBtn) {
        const isLastCard = (currentCardIndex === currentFlashcards.length - 1);
        nextBtn.innerHTML = isLastCard
            ? "Done"
            : 'Next <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>';
    }

}

/* ==========================================================
   FLIP / NAVIGATE
   ========================================================== */

function flipCurrentCard() {

    const flashcardEl = document.getElementById("flashcard");

    if (flashcardEl) {
        flashcardEl.classList.toggle("is-flipped");
    }

}

function goToPreviousCard() {

    if (currentCardIndex === 0) return;

    currentCardIndex -= 1;
    renderCurrentCard();

}

function goToNextCard() {

    const isLastCard = (currentCardIndex === currentFlashcards.length - 1);

    if (isLastCard) {
        // "Done" was clicked — just go back to the start of the deck.
        currentCardIndex = 0;
        renderCurrentCard();
        return;
    }

    currentCardIndex += 1;
    renderCurrentCard();

}

/* ==========================================================
   RESET
   ========================================================== */

function resetFlashcards() {

    currentFlashcards = [];
    currentCardIndex = 0;

    const studyPanel = document.getElementById("flashcardStudyPanel");
    const emptyState = document.getElementById("flashcardEmptyState");

    if (studyPanel) studyPanel.hidden = true;
    if (emptyState) emptyState.hidden = false;

}

/* ==========================================================
   EXPORTS
   ========================================================== */

window.populateFlashcardDocumentSelect = populateFlashcardDocumentSelect;