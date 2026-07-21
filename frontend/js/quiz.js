/* ==========================================================
   AskDocs Quiz Module
   ========================================================== */

let currentQuiz = [];
let quizDocumentsLoaded = false;
let quizDocumentsLoadPromise = null;

document.addEventListener("DOMContentLoaded", initQuiz);

/* ==========================================================
   INIT
   ========================================================== */

function initQuiz() {

    bindNavSwitching();
    bindQuizEvents();

}

/* ==========================================================
   VIEW SWITCHING
   Handles clicking between "Dashboard", "AI Chat", and "Quiz"
   in the sidebar — shows the matching section, hides the rest.
   ========================================================== */

function bindNavSwitching() {

    const navLinks = document.querySelectorAll(".nav-link[data-view]");

    for (let i = 0; i < navLinks.length; i++) {

        const link = navLinks[i];

        link.addEventListener("click", function () {

            const targetId = link.getAttribute("data-view");

            switchView(targetId);
            markLinkAsActive(link, navLinks);

            // The first time someone opens the Quiz view, load the
            // list of documents into the dropdown.
            if (targetId === "quiz-view") {
                populateQuizDocumentSelect();
            }

            // Chat has its own document dropdown, handled in chat.js.
            // We just call it here if it exists.
            if (targetId === "chat-view" && typeof window.populateChatDocumentSelect === "function") {
                window.populateChatDocumentSelect();
            }

            // Flashcards has its own document dropdown too, handled in
            // flashcards.js.
            if (targetId === "flashcards-view" && typeof window.populateFlashcardDocumentSelect === "function") {
                window.populateFlashcardDocumentSelect();
            }

            // The Documents view loads its own file list, handled in
            // documents.js.
            if (targetId === "documents-view" && typeof window.populateDocumentsView === "function") {
                window.populateDocumentsView();
            }

            // Notes has its own document dropdown too, handled in
            // notes.js.
            if (targetId === "notes-view" && typeof window.populateNotesDocumentSelect === "function") {
                window.populateNotesDocumentSelect();
            }

            // Rooms has its own grid-loading logic, handled in
            // rooms.js.
            if (targetId === "rooms-view" && typeof window.populateRoomsView === "function") {
                window.populateRoomsView();
            }

        });

    }

}

function markLinkAsActive(clickedLink, allLinks) {

    for (let i = 0; i < allLinks.length; i++) {
        allLinks[i].classList.remove("active");
    }

    clickedLink.classList.add("active");

}

function switchView(viewId) {

    const allViews = document.querySelectorAll(".view");

    for (let i = 0; i < allViews.length; i++) {

        const view = allViews[i];
        const isTheOneWeWant = (view.id === viewId);

        if (isTheOneWeWant) {
            view.classList.add("active-view");
            view.hidden = false;
        } else {
            view.classList.remove("active-view");
            view.hidden = true;
        }

    }

}

/* ==========================================================
   POPULATE DOCUMENT DROPDOWN
   ========================================================== */

async function populateQuizDocumentSelect() {

    const select = document.getElementById("quizDocumentSelect");

    if (!select) return;

    if (quizDocumentsLoaded) {
        if (window.applyPendingRoomSelection) {
            window.applyPendingRoomSelection("quizDocumentSelect");
        }
        return;
    }

    if (!quizDocumentsLoadPromise) {
        quizDocumentsLoadPromise = loadQuizDocumentOptions(select);
    }

    await quizDocumentsLoadPromise;

    if (window.applyPendingRoomSelection) {
        window.applyPendingRoomSelection("quizDocumentSelect");
    }

}

async function loadQuizDocumentOptions(select) {

    try {

        if (window.addRoomOptionsToSelect) {
            await window.addRoomOptionsToSelect(select);
        }

        const result = await getDocuments();

        // The backend might send the document list back in slightly
        // different shapes depending on the endpoint, so we check a
        // few possibilities instead of assuming just one.
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

        quizDocumentsLoaded = true;

    }
    catch (error) {

        console.warn("[quiz.js] Could not load documents for quiz selector:", error);

    }

}

/* ==========================================================
   EVENTS
   ========================================================== */

function bindQuizEvents() {

    const generateBtn = document.getElementById("generateQuizBtn");
    const regenerateBtn = document.getElementById("regenerateQuizBtn");
    const submitBtn = document.getElementById("submitQuizBtn");

    if (generateBtn) {
        generateBtn.addEventListener("click", handleGenerateQuiz);
    }

    if (regenerateBtn) {
        regenerateBtn.addEventListener("click", resetQuiz);
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", scoreQuiz);
    }

}

/* ==========================================================
   GENERATE QUIZ
   ========================================================== */

async function handleGenerateQuiz() {

    const documentSelect = document.getElementById("quizDocumentSelect");
    const questionCountInput = document.getElementById("quizQuestionCount");

    const scope = window.readScopeFromSelect
        ? window.readScopeFromSelect(documentSelect)
        : { documentId: documentSelect ? documentSelect.value : "", roomId: null };
    const numQuestions = getValidQuestionCount(questionCountInput);

    setGenerating(true);

    try {

        const result = await generateQuiz(scope.documentId, numQuestions, scope.roomId);

        currentQuiz = (result && result.questions) ? result.questions : [];

        if (currentQuiz.length === 0) {
            alert("The AI didn't return any questions. Try again, or pick a different document.");
            return;
        }

        renderQuiz(currentQuiz);

    }
    catch (error) {

        console.error("[quiz.js] Quiz generation failed:", error);

        const message = (error && error.message)
            ? error.message
            : "Failed to generate quiz. Check the console for details.";

        alert(message);

    }
    finally {

        setGenerating(false);

    }

}

function getValidQuestionCount(inputElement) {

    // Keep the question count sensible even if the user typed
    // something odd into the box (blank, negative, way too big, etc).

    if (!inputElement) return 5;

    let count = parseInt(inputElement.value, 10);

    if (isNaN(count)) {
        count = 5;
    }

    if (count < 1) {
        count = 1;
    }

    if (count > 20) {
        count = 20;
    }

    return count;

}

function setGenerating(isGenerating) {

    const btn = document.getElementById("generateQuizBtn");

    if (!btn) return;

    btn.disabled = isGenerating;

    if (isGenerating) {
        btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Generating…';
    } else {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg> Generate Quiz';
    }

}

/* ==========================================================
   RENDER QUIZ
   ========================================================== */

function renderQuiz(questions) {

    const emptyState = document.getElementById("quizEmptyState");
    const resultsPanel = document.getElementById("quizResultsPanel");
    const container = document.getElementById("quizQuestions");

    if (!container || !resultsPanel) return;

    if (emptyState) emptyState.hidden = true;
    resultsPanel.hidden = false;

    // Remove any previous score banner from a prior attempt.
    removeScoreBannerIfPresent();

    container.innerHTML = "";

    for (let i = 0; i < questions.length; i++) {

        const question = questions[i];
        const card = buildQuestionCard(question, i);

        container.appendChild(card);

    }

    // Let the user click an option to highlight it, before submitting.
    const allOptionLabels = container.querySelectorAll(".quiz-option");

    for (let i = 0; i < allOptionLabels.length; i++) {
        allOptionLabels[i].addEventListener("click", handleOptionClick);
    }

    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });

}

function buildQuestionCard(question, index) {

    const card = document.createElement("div");
    card.className = "quiz-card";
    card.dataset.correctAnswer = question.correct_answer;

    const typeLabel = (question.type === "true_false") ? "True / False" : "Multiple Choice";

    // Build the list of answer options as HTML text.
    let optionsHtml = "";
    const options = question.options || [];

    for (let i = 0; i < options.length; i++) {

        const optionText = escapeHtml(options[i]);

        optionsHtml += `
            <label class="quiz-option">
                <input type="radio" name="quiz-q${index}" value="${optionText}">
                <span>${optionText}</span>
            </label>
        `;

    }

    card.innerHTML = `
        <div class="quiz-card-head">
            <span class="quiz-number">${index + 1}</span>
            <p class="quiz-question-text">${escapeHtml(question.question)}</p>
            <span class="quiz-type-tag">${typeLabel}</span>
        </div>
        <div class="quiz-options">
            ${optionsHtml}
        </div>
    `;

    return card;

}

function handleOptionClick(event) {

    const clickedLabel = event.currentTarget;
    const card = clickedLabel.closest(".quiz-card");

    const allOptionsInThisCard = card.querySelectorAll(".quiz-option");

    for (let i = 0; i < allOptionsInThisCard.length; i++) {
        allOptionsInThisCard[i].classList.remove("selected");
    }

    clickedLabel.classList.add("selected");

}

/* ==========================================================
   SCORE QUIZ
   ========================================================== */

function scoreQuiz() {

    const cards = document.querySelectorAll(".quiz-card");

    if (cards.length === 0) return;

    let correctCount = 0;

    for (let i = 0; i < cards.length; i++) {

        const card = cards[i];
        const wasCorrect = scoreOneCard(card);

        if (wasCorrect) {
            correctCount += 1;
        }

    }

    showScoreBanner(correctCount, cards.length);

    const submitBtn = document.getElementById("submitQuizBtn");
    if (submitBtn) submitBtn.disabled = true;

}

function scoreOneCard(card) {

    const correctAnswer = card.dataset.correctAnswer;
    const selectedInput = card.querySelector("input[type='radio']:checked");
    const options = card.querySelectorAll(".quiz-option");

    for (let i = 0; i < options.length; i++) {

        const option = options[i];
        const input = option.querySelector("input");
        const optionValue = input.value;

        if (optionValue === correctAnswer) {
            option.classList.add("correct");
        } else if (selectedInput && optionValue === selectedInput.value) {
            option.classList.add("incorrect");
        }

        // Lock the answers in — no changing your mind after submitting.
        input.disabled = true;

    }

    const userGotItRight = selectedInput && selectedInput.value === correctAnswer;

    return userGotItRight;

}

function showScoreBanner(correctCount, total) {

    const resultsPanel = document.getElementById("quizResultsPanel");
    const panelHead = resultsPanel ? resultsPanel.querySelector(".panel-head") : null;

    if (!panelHead) return;

    const percent = Math.round((correctCount / total) * 100);

    const banner = document.createElement("div");
    banner.className = "quiz-score-banner";
    banner.innerHTML = `
        <div>
            <h4>Quiz complete</h4>
            <p>You got ${correctCount} out of ${total} correct.</p>
        </div>
        <div class="score-value">${percent}%</div>
    `;

    panelHead.insertAdjacentElement("afterend", banner);

}

function removeScoreBannerIfPresent() {

    const banner = document.querySelector(".quiz-score-banner");

    if (banner) {
        banner.remove();
    }

}

/* ==========================================================
   RESET
   ========================================================== */

function resetQuiz() {

    currentQuiz = [];

    const resultsPanel = document.getElementById("quizResultsPanel");
    const emptyState = document.getElementById("quizEmptyState");
    const container = document.getElementById("quizQuestions");
    const submitBtn = document.getElementById("submitQuizBtn");

    if (resultsPanel) resultsPanel.hidden = true;
    if (emptyState) emptyState.hidden = false;
    if (container) container.innerHTML = "";
    if (submitBtn) submitBtn.disabled = false;

    removeScoreBannerIfPresent();

}

/* ==========================================================
   ESCAPE HTML
   Quiz questions come from the AI, so before we put that text
   into the page, we replace any HTML-special characters with
   their safe text equivalents. This stops a question like
   "5 < 10" from being misread as the start of an HTML tag.
   ========================================================== */

function escapeHtml(text) {

    if (text === null || text === undefined) {
        text = "";
    }

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

window.switchView = switchView;