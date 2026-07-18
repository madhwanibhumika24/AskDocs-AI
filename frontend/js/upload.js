/* ==========================================================
   AskDocs Upload Module
========================================================== */

const uploadInput = document.getElementById("pdfInput");
const uploadedContainer = document.getElementById("uploadedDocuments");

/* ==========================================================
   OPEN FILE PICKER
========================================================== */

function openUploadDialog() {

    if (!uploadInput) {
        console.error("[upload.js] #pdfInput not found in DOM");
        return;
    }

    uploadInput.click();

}

/* ==========================================================
   FILE SELECTED
========================================================== */

if (uploadInput) {

    uploadInput.addEventListener("change", uploadFiles);

} else {

    console.error("[upload.js] Could not bind change listener — #pdfInput missing");

}

/* ==========================================================
   UPLOAD FILES
========================================================== */

async function uploadFiles() {

    const files = uploadInput.files;

    console.log("[upload.js] files selected:", files);

    if (!files.length) {
        console.warn("[upload.js] no files in input.files — dialog was likely cancelled");
        return;
    }

    try {

        setUploading(true);

        console.log("[upload.js] calling uploadDocuments()...");

        const result = await uploadDocuments(files);

        console.log("[upload.js] uploadDocuments() resolved:", result);

        // Defensive: handle a few possible response shapes instead of
        // assuming result.data is always the array.
        const documents =
            result?.data ??
            result?.documents ??
            (Array.isArray(result) ? result : null);

        if (!documents) {
            console.error(
                "[upload.js] Unexpected response shape from uploadDocuments():",
                result
            );
            alert("Upload succeeded but the response format was unexpected. Check console.");
            return;
        }

        showDocuments(documents);

        uploadInput.value = "";

    }

    catch (error) {

        // Log the *real* error object, not just .message, so network
        // failures (CORS, 404, backend down) are visible in console.
        console.error("[upload.js] Upload failed:", error);

        alert(error?.message || "Upload failed. Check the browser console for details.");

    }

    finally {

        setUploading(false);

    }

}

/* ==========================================================
   SHOW DOCUMENT CHIPS
========================================================== */

function showDocuments(documents) {

    if (!uploadedContainer) {
        console.error("[upload.js] #uploadedDocuments not found in DOM");
        return;
    }

    // Remove the "no documents yet" placeholder the first time
    // real documents come in.
    const empty = uploadedContainer.querySelector(".chip-empty");
    if (empty) empty.remove();

    documents.forEach(doc => {

        const chip = document.createElement("div");

        chip.className = "document-chip";

        const filename = doc.filename || doc.name || "Untitled document";
        const docId = doc.document_id || doc.id || "";

        chip.innerHTML = `
            <span class="chip-icon">📄</span>
            <span>${filename}</span>
            <button type="button" aria-label="Remove ${filename}" onclick="removeDocument(this,'${docId}')">✕</button>
        `;

        uploadedContainer.appendChild(chip);

    });

}

/* ==========================================================
   REMOVE CHIP
========================================================== */

async function removeDocument(button, id) {

    const chip = button.parentElement;

    const confirmed = confirm("Delete this document? This can't be undone.");

    if (!confirmed) return;

    // Optimistically dim the chip while the request is in flight.
    chip.style.opacity = "0.5";
    button.disabled = true;

    try {

        await deleteDocument(id);

        chip.remove();

        // Restore the empty-state message if that was the last chip
        if (uploadedContainer && uploadedContainer.children.length === 0) {
            uploadedContainer.innerHTML =
                '<span class="chip-empty">No documents uploaded yet — click "Upload Document" to get started.</span>';
        }

    }

    catch (error) {

        console.error("[upload.js] Failed to remove document:", error);

        // Roll back the optimistic dimming — the document is still there.
        chip.style.opacity = "1";
        button.disabled = false;

        alert(error?.message || "Failed to delete document. Check the console for details.");

    }

}

/* ==========================================================
   LOADING
========================================================== */

function setUploading(status) {

    const button = document.querySelector(".upload-btn");

    if (!button) return;

    if (status) {

        button.disabled = true;

        button.innerHTML = "Uploading…";

    }

    else {

        button.disabled = false;

        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12M6 10l6-6 6 6M4 20h16"/></svg>
            Upload Document
        `;

    }

}

/* ==========================================================
   EXPORTS
========================================================== */

window.openUploadDialog = openUploadDialog;
window.uploadFiles = uploadFiles;
window.removeDocument = removeDocument;