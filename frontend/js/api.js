/* ==========================================================
   AskDocs API
========================================================== */

const API_URL = "http://127.0.0.1:8000";

/* ==========================================================
   AUTH TOKEN
========================================================== */

function getToken() {
    return localStorage.getItem("access_token");
}

/* ==========================================================
   GENERIC REQUEST
========================================================== */

async function apiRequest(
    endpoint,
    method = "GET",
    body = null,
    isFormData = false
) {

    const headers = {};

    const token = getToken();

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(API_URL + endpoint, {

        method,

        headers,

        body: isFormData
            ? body
            : body
                ? JSON.stringify(body)
                : null

    });

    const data = await response.json();

    if (response.status === 401) {

        // The token is missing, invalid, or expired — no matter which
        // feature triggered this (chat, documents, quiz, whatever),
        // the right move is always the same: send the user back to
        // log in again, instead of showing a confusing error message
        // in whatever part of the UI happened to make the request.
        console.warn("[api.js] Session expired — redirecting to login.");

        localStorage.removeItem("access_token");

        window.location.href = "login.html";

        // Stop here — nothing after this point should run, since the
        // page is about to navigate away.
        return new Promise(() => {});

    }

    if (!response.ok) {

        throw new Error(
            data.detail || "Request Failed"
        );

    }

    return data;

}

/* ==========================================================
   PROFILE
========================================================== */

async function getProfile() {

    return await apiRequest("/auth/profile");

}

/* ==========================================================
   CHAT
========================================================== */

async function sendMessage(question, documentId) {

    return await apiRequest(

        "/chat",

        "POST",

        {
            session_id: getSessionId(),
            question: question,
            document_id: documentId || null
        }

    );

}

/* ==========================================================
   SESSION ID
   A simple per-tab session id so /chat has something to key
   conversation history on, until real auth/sessions exist.
========================================================== */

function getSessionId() {

    let sessionId = sessionStorage.getItem("askdocs_session_id");

    if (!sessionId) {
        sessionId = "guest-" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem("askdocs_session_id", sessionId);
    }

    return sessionId;

}

/* ==========================================================
   UPLOAD DOCUMENT
========================================================== */

async function uploadDocuments(files) {

    const formData = new FormData();

    for (const file of files) {

        formData.append("files", file);

    }

    const token = getToken();

    const headers = {};

    if (token) {

        headers["Authorization"] = `Bearer ${token}`;

    }

    const response = await fetch(

        API_URL + "/documents/upload",

        {

            method: "POST",

            headers,

            body: formData

        }

    );

    const data = await response.json();

    if (response.status === 401) {

        console.warn("[api.js] Session expired — redirecting to login.");

        localStorage.removeItem("access_token");

        window.location.href = "login.html";

        return new Promise(() => {});

    }

    if (!response.ok) {

        throw new Error(

            data.detail || "Upload Failed"

        );

    }

    return data;

}

/* ==========================================================
   QUIZ
========================================================== */

async function generateQuiz(documentId, numQuestions) {

    return await apiRequest(

        "/quiz/generate",

        "POST",

        {
            document_id: documentId || null,
            num_questions: numQuestions
        }

    );

}

/* ==========================================================
   TEACH IT BACK
========================================================== */

async function getTeachBackPrompt(documentId) {

    return await apiRequest(

        "/teach-back/prompt",

        "POST",

        {
            document_id: documentId || null
        }

    );

}

async function evaluateTeachBack(documentId, concept, studentExplanation) {

    return await apiRequest(

        "/teach-back/evaluate",

        "POST",

        {
            document_id: documentId || null,
            concept: concept,
            student_explanation: studentExplanation
        }

    );

}

/* ==========================================================
   NOTES
========================================================== */

async function generateNotes(documentId) {

    return await apiRequest(

        "/notes/generate",

        "POST",

        {
            document_id: documentId || null
        }

    );

}

/* ==========================================================
   FLASHCARDS
========================================================== */

async function generateFlashcards(documentId, numCards) {

    return await apiRequest(

        "/flashcards/generate",

        "POST",

        {
            document_id: documentId || null,
            num_cards: numCards
        }

    );

}

/* ==========================================================
   DOCUMENTS
========================================================== */

async function getDocuments() {

    return await apiRequest(

        "/documents"

    );

}

/* ==========================================================
   DELETE DOCUMENT
========================================================== */

async function deleteDocument(documentId) {

    return await apiRequest(

        `/documents/${documentId}`,

        "DELETE"

    );

}

/* ==========================================================
   EXPORTS
========================================================== */

window.getProfile = getProfile;

window.sendMessage = sendMessage;

window.uploadDocuments = uploadDocuments;

window.generateQuiz = generateQuiz;

window.generateFlashcards = generateFlashcards;

window.generateNotes = generateNotes;

window.getTeachBackPrompt = getTeachBackPrompt;
window.evaluateTeachBack = evaluateTeachBack;

window.getDocuments = getDocuments;

window.deleteDocument = deleteDocument;