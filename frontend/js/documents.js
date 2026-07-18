async function loadDocuments() {

    const docs = await api("/documents");

    console.log(docs);

}