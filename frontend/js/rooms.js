/* ==========================================================
   AskDocs Rooms Module
   ========================================================== */

let currentRoomId = null;
let currentRoomName = "";
let allRoomsCache = [];

document.addEventListener("DOMContentLoaded", bindRoomsEvents);

/* ==========================================================
   POPULATE ROOMS GRID
   Called from quiz.js's shared nav-switching logic when the
   Rooms view is opened.
   ========================================================== */

async function populateRoomsView() {

    showRoomListState();

    const grid = document.getElementById("roomsGrid");

    if (!grid) return;

    grid.innerHTML = '<p class="quiz-hint">Loading your rooms…</p>';

    try {

        const result = await listRooms();

        allRoomsCache = (result && result.rooms) ? result.rooms : [];

        renderRoomsGrid(allRoomsCache);

    }
    catch (error) {

        console.error("[rooms.js] Failed to load rooms:", error);
        grid.innerHTML = '<p class="quiz-hint">Could not load your rooms. Try refreshing.</p>';

    }

}

function renderRoomsGrid(rooms) {

    const grid = document.getElementById("roomsGrid");

    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 0; i < rooms.length; i++) {

        const room = rooms[i];

        const card = document.createElement("div");
        card.className = "room-card";
        card.dataset.roomId = room.id;

        card.innerHTML = `
            <div class="room-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/></svg>
            </div>
            <button class="room-delete-btn" title="Delete room" aria-label="Delete room">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <h3>${escapeHtml(room.name)}</h3>
        `;

        card.addEventListener("click", function (e) {
            if (e.target.closest(".room-delete-btn")) return;
            openRoom(room.id, room.name);
        });

        const deleteBtn = card.querySelector(".room-delete-btn");
        deleteBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            handleDeleteRoom(room.id, room.name);
        });

        grid.appendChild(card);

    }

    // "Create a new room" card always sits at the end.
    const createCard = document.createElement("div");
    createCard.className = "room-card new";
    createCard.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M4 12h16"/></svg>
        <span>Create a new room</span>
    `;
    createCard.addEventListener("click", showCreateRoomPrompt);
    grid.appendChild(createCard);

}

/* ==========================================================
   CREATE / DELETE ROOM
   ========================================================== */

function showCreateRoomPrompt() {

    const modal = document.getElementById("createRoomModal");
    const input = document.getElementById("createRoomInput");

    if (!modal) return;

    if (input) input.value = "";

    modal.classList.add("open");

    if (input) input.focus();

}

function closeCreateRoomModal() {

    const modal = document.getElementById("createRoomModal");

    if (modal) modal.classList.remove("open");

}

async function handleCreateRoom(name) {

    try {

        await createRoom(name);

        await populateRoomsView();

    }
    catch (error) {

        console.error("[rooms.js] Failed to create room:", error);
        alert(error?.message || "Could not create the room. Please try again.");

    }

}

async function handleDeleteRoom(roomId, roomName) {

    const confirmed = confirm(`Delete "${roomName}"? Documents inside it won't be deleted — they'll just no longer belong to a room.`);

    if (!confirmed) return;

    try {

        await deleteRoom(roomId);

        await populateRoomsView();

    }
    catch (error) {

        console.error("[rooms.js] Failed to delete room:", error);
        alert(error?.message || "Could not delete the room. Please try again.");

    }

}

/* ==========================================================
   ROOM DETAIL VIEW
   ========================================================== */

async function openRoom(roomId, roomName) {

    currentRoomId = roomId;
    currentRoomName = roomName;

    showRoomDetailState();

    const nameHeading = document.getElementById("roomDetailName");
    const docList = document.getElementById("roomDetailDocs");

    if (nameHeading) nameHeading.textContent = roomName;
    if (docList) docList.innerHTML = '<p class="quiz-hint">Loading documents…</p>';

    try {

        const result = await getDocumentsInRoom(roomId);

        const documents = (result && result.data) ? result.data : [];

        renderRoomDocuments(documents);

    }
    catch (error) {

        console.error("[rooms.js] Failed to load room documents:", error);
        if (docList) docList.innerHTML = '<p class="quiz-hint">Could not load documents for this room.</p>';

    }

}

function renderRoomDocuments(documents) {

    const docList = document.getElementById("roomDetailDocs");

    if (!docList) return;

    if (documents.length === 0) {
        docList.innerHTML = '<p class="quiz-hint">No documents in this room yet. Upload one and assign it to this room.</p>';
        return;
    }

    docList.innerHTML = "";

    for (let i = 0; i < documents.length; i++) {

        const doc = documents[i];
        const filename = doc.filename || "Untitled document";

        const item = document.createElement("div");
        item.className = "doc-item";
        item.innerHTML = `
            <div class="file-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4h8l5 5v11a1.6 1.6 0 01-1.6 1.6H6A1.6 1.6 0 014.4 20V5.6A1.6 1.6 0 016 4z"/></svg>
            </div>
            ${escapeHtml(filename)}
        `;

        docList.appendChild(item);

    }

}

function showRoomListState() {

    const listState = document.getElementById("roomsListState");
    const detailState = document.getElementById("roomsDetailState");

    if (listState) listState.hidden = false;
    if (detailState) detailState.hidden = true;

}

function showRoomDetailState() {

    const listState = document.getElementById("roomsListState");
    const detailState = document.getElementById("roomsDetailState");

    if (listState) listState.hidden = true;
    if (detailState) detailState.hidden = false;

}

async function handleRoomFileUpload(event) {

    const files = event.target.files;

    if (!files || files.length === 0) return;

    if (!currentRoomId) {
        alert("No room is open right now — this shouldn't happen. Try reopening the room.");
        return;
    }

    const addDocsBtn = document.getElementById("roomAddDocsBtn");
    if (addDocsBtn) {
        addDocsBtn.disabled = true;
        addDocsBtn.textContent = "Uploading…";
    }

    try {

        await uploadDocuments(files, currentRoomId);

        // Refresh the document list for this room so the new upload
        // shows up immediately, no manual page refresh needed.
        await openRoom(currentRoomId, currentRoomName);

    }
    catch (error) {

        console.error("[rooms.js] Room upload failed:", error);
        alert(error?.message || "Upload failed. Please try again.");

    }
    finally {

        if (addDocsBtn) {
            addDocsBtn.disabled = false;
            addDocsBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 4v16M4 12h16"/></svg> Add documents';
        }

        // Clear the input so selecting the exact same file again
        // later still triggers a "change" event.
        event.target.value = "";

    }

}

/* ==========================================================
   QUICK ACTIONS — jump into Chat/Quiz/Flashcards/Notes,
   pre-scoped to the currently open room.
   ========================================================== */

function bindRoomsEvents() {

    const backLink = document.getElementById("roomsBackLink");
    if (backLink) backLink.addEventListener("click", populateRoomsView);

    // "+ Add documents" inside a room — opens a file picker, and
    // whatever gets picked is uploaded tagged with the CURRENT room's
    // id. This uses its own hidden file input (roomUploadInput),
    // completely separate from the general Upload button's input, so
    // picking files here can never accidentally affect a normal
    // no-room upload elsewhere in the app.
    const addDocsBtn = document.getElementById("roomAddDocsBtn");
    const roomUploadInput = document.getElementById("roomUploadInput");

    if (addDocsBtn && roomUploadInput) {
        addDocsBtn.addEventListener("click", function () {
            roomUploadInput.click();
        });
    }

    if (roomUploadInput) {
        roomUploadInput.addEventListener("change", handleRoomFileUpload);
    }

    // Create Room modal
    const createForm = document.getElementById("createRoomForm");
    const cancelBtn = document.getElementById("createRoomCancelBtn");
    const modal = document.getElementById("createRoomModal");

    if (createForm) {
        createForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const input = document.getElementById("createRoomInput");
            const name = input ? input.value.trim() : "";
            if (!name) return;
            closeCreateRoomModal();
            handleCreateRoom(name);
        });
    }

    if (cancelBtn) cancelBtn.addEventListener("click", closeCreateRoomModal);

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) closeCreateRoomModal();
        });
    }

    const chatBtn = document.getElementById("roomQuickChat");
    const quizBtn = document.getElementById("roomQuickQuiz");
    const flashBtn = document.getElementById("roomQuickFlashcards");
    const notesBtn = document.getElementById("roomQuickNotes");

    if (chatBtn) chatBtn.addEventListener("click", function () {
        goToViewWithRoom("chat-view", "chatScopeSelect");
    });
    if (quizBtn) quizBtn.addEventListener("click", function () {
        goToViewWithRoom("quiz-view", "quizDocumentSelect");
    });
    if (flashBtn) flashBtn.addEventListener("click", function () {
        goToViewWithRoom("flashcards-view", "flashcardDocumentSelect");
    });
    if (notesBtn) notesBtn.addEventListener("click", function () {
        goToViewWithRoom("notes-view", "notesDocumentSelect");
    });

}

function goToViewWithRoom(viewId, selectId) {

    const navLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
    if (navLink) navLink.click();

    // Give the view's own populate function (which loads documents +
    // rooms into the dropdown) a moment to finish, then select this
    // room in it. window.pendingRoomSelection is read by each of
    // chat.js/quiz.js/flashcards.js/notes.js when they populate their
    // own scope dropdown.
    window.pendingRoomSelection = {
        selectId: selectId,
        roomId: currentRoomId,
    };

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

/* ==========================================================
   SHARED HELPERS — used by chat.js, quiz.js, flashcards.js,
   and notes.js to add "Rooms" as an option in their own
   document-scope dropdowns, not just individual documents.
   ========================================================== */

// Adds every room as an <option> at the top of a <select>, each
// tagged with a "room:" prefix so the calling code can tell a room
// apart from a plain document_id later.
async function addRoomOptionsToSelect(select) {

    if (!select) return;

    try {

        const result = await listRooms();
        const rooms = (result && result.rooms) ? result.rooms : [];

        if (rooms.length === 0) return;

        const groupLabel = document.createElement("option");
        groupLabel.disabled = true;
        groupLabel.textContent = "── Rooms ──";
        select.appendChild(groupLabel);

        for (let i = 0; i < rooms.length; i++) {

            const room = rooms[i];

            const option = document.createElement("option");
            option.value = "room:" + room.id;
            option.textContent = "🏠 " + room.name;

            select.appendChild(option);

        }

        const docsLabel = document.createElement("option");
        docsLabel.disabled = true;
        docsLabel.textContent = "── Individual documents ──";
        select.appendChild(docsLabel);

    }
    catch (error) {

        console.warn("[rooms.js] Could not load rooms for scope selector:", error);

    }

}

// If the person got here by clicking a room's quick-action button
// (Chat/Quiz/Flashcards/Notes), this selects that room in the
// dropdown automatically instead of leaving it on "All documents".
// Safe to call every time a select is populated — it does nothing
// if there's no pending selection waiting.
function applyPendingRoomSelection(selectId) {

    const pending = window.pendingRoomSelection;

    if (!pending || pending.selectId !== selectId) return;

    const select = document.getElementById(selectId);

    if (select) {
        select.value = "room:" + pending.roomId;
    }

    window.pendingRoomSelection = null;

}

// Reads whatever's currently selected in a scope dropdown and splits
// it into { documentId, roomId } — exactly one of the two will be
// set, matching what the backend expects.
function readScopeFromSelect(select) {

    const value = select ? select.value : "";

    if (value.startsWith("room:")) {
        return { documentId: null, roomId: value.slice(5) };
    }

    return { documentId: value || null, roomId: null };

}

/* ==========================================================
   EXPORTS
   ========================================================== */

window.populateRoomsView = populateRoomsView;
window.addRoomOptionsToSelect = addRoomOptionsToSelect;
window.applyPendingRoomSelection = applyPendingRoomSelection;
window.readScopeFromSelect = readScopeFromSelect;