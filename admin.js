import { getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./app.js";

const app = getApp();
const auth = getAuth(app);
const storage = getStorage(app);

const loginWrap = document.getElementById('admin-auth');
const deskWrap = document.getElementById('admin-dashboard');

let quillEditor;
let activePostsCache = []; // Holding elements array snapshot safely to manage local key searches quickly

function initializeRichTextEditor() {
    if (document.getElementById('editor-container') && !quillEditor) {
        quillEditor = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'align': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'clean']
                ]
            }
        });
    }
}

onAuthStateChanged(auth, (sessionUser) => {
    if (sessionUser) {
        loginWrap.classList.add('hidden');
        deskWrap.classList.remove('hidden');
        initializeRichTextEditor();
        syncAdminLedgerList();
    } else {
        loginWrap.classList.remove('hidden');
        deskWrap.classList.add('hidden');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mail = document.getElementById('login-email').value;
    const word = document.getElementById('login-password').value;
    try { await signInWithEmailAndPassword(auth, mail, word); } catch (err) { alert("Authorization Error: " + err.message); }
});

document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth); });

document.getElementById('post-input-title').addEventListener('input', (e) => {
    if(document.getElementById('post-edit-id').value !== "") return;
    document.getElementById('post-input-slug').value = e.target.value
        .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
});

// Sync data rows from Firestore database and calculate dashboard metrics values
async function syncAdminLedgerList() {
    const container = document.getElementById('admin-posts-ledger');
    if (!container) return;

    container.innerHTML = `<div class="text-center py-12 text-slate-400 text-sm font-semibold"><i class="fa-solid fa-spinner animate-spin mr-2 text-indigo-600"></i>Refreshing Records Desk...</div>`;

    try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        activePostsCache = [];
        snapshot.forEach(docObj => {
            activePostsCache.push({ id: docObj.id, ...docObj.data() });
        });

        // Set the Total Posts metric count indicator field
        document.getElementById('metric-total-posts').innerText = activePostsCache.length;

        renderLedgerRows(activePostsCache);

    } catch (err) {
        console.error("Critical stream error failure:", err);
        container.innerHTML = `<p class="text-xs text-center text-rose-500 font-semibold">Ledger Connection Interrupted.</p>`;
    }
}

function renderLedgerRows(postsArray) {
    const container = document.getElementById('admin-posts-ledger');
    container.innerHTML = "";

    if (postsArray.length === 0) {
        container.innerHTML = `<p class="text-center py-12 text-slate-400 text-sm font-medium">No files match your current filter parameters.</p>`;
        return;
    }

    postsArray.forEach((item) => {
        const fallbackGraphic = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/></svg>";
        const rowHtml = `
            <div class="p-4 border border-slate-100 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-md hover:border-slate-200/80">
                <div class="flex items-center space-x-4 min-w-0">
                    <img src="${item.imageUrl || fallbackGraphic}" class="w-14 h-14 object-cover rounded-lg border bg-slate-50 shrink-0" alt="Thumbnail">
                    <div class="min-w-0 space-y-0.5">
                        <h4 class="text-sm font-bold text-slate-900 truncate tracking-tight pr-2">${item.title}</h4>
                        <div class="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-1 rounded inline-block max-w-full truncate">slug: ${item.slug}</div>
                        <p class="text-[10px] font-semibold text-slate-400 tracking-tight">${item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just Now'}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button type="button" data-id="${item.id}" class="edit-trigger-btn text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition">Edit</button>
                    <button type="button" data-id="${item.id}" class="delete-trigger-btn text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition">Delete</button>
                </div>
            </div>
        `;
        container.innerHTML += rowHtml;
    });

    attachManagementEventListeners();
}

// Handle Realtime Filter Inputs
document.getElementById('admin-search-box').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    const filtered = activePostsCache.filter(p => p.title.toLowerCase().includes(keyword) || p.slug.toLowerCase().includes(keyword));
    renderLedgerRows(filtered);
});

function attachManagementEventListeners() {
    document.querySelectorAll('.delete-trigger-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetId = btn.getAttribute('data-id');
            if (confirm("Permanently discard this document index module record row?")) {
                try {
                    await deleteDoc(doc(db, "posts", targetId));
                    alert("Record deleted successfully.");
                    syncAdminLedgerList();
                    if(document.getElementById('post-edit-id').value === targetId) resetFormState();
                } catch (err) { alert("Deletion error: " + err.message); }
            }
        });
    });

    document.querySelectorAll('.edit-trigger-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-id');
            const postData = activePostsCache.find(p => p.id === targetId);
            
            if(postData) {
                document.getElementById('post-edit-id').value = targetId;
                document.getElementById('post-input-title').value = postData.title;
                document.getElementById('post-input-slug').value = postData.slug;
                document.getElementById('post-input-category').value = postData.category;
                quillEditor.root.innerHTML = postData.content;

                document.getElementById('form-action-title').innerText = "Edit Blog Details";
                document.getElementById('submit-btn').innerText = "Save and Update Blog Changes";
                document.getElementById('edit-image-status').classList.remove('hidden');
                document.getElementById('cancel-edit-btn').classList.remove('hidden');
                document.getElementById('post-form').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function resetFormState() {
    document.getElementById('post-form').reset();
    document.getElementById('post-edit-id').value = "";
    quillEditor.root.innerHTML = "";
    document.getElementById('form-action-title').innerText = "Create New Blog";
    document.getElementById('submit-btn').innerText = "Commit Record to Database";
    document.getElementById('edit-image-status').classList.add('hidden');
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

document.getElementById('cancel-edit-btn').addEventListener('click', resetFormState);

document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const actionButton = document.getElementById('submit-btn');
    const editId = document.getElementById('post-edit-id').value;
    const isEditingMode = editId !== "";

    actionButton.disabled = true;
    actionButton.innerText = "Transmitting secure cloud packets...";

    const title = document.getElementById('post-input-title').value;
    const slug = document.getElementById('post-input-slug').value;
    const category = document.getElementById('post-input-category').value;
    const fileAsset = document.getElementById('post-input-image').files[0];
    const formattedContentHTML = quillEditor.root.innerHTML;

    let resolvedImageUrl = "";

    try {
        if (fileAsset) {
            const fileRef = ref(storage, `blog_images/${Date.now()}_${fileAsset.name}`);
            const snapshot = await uploadBytes(fileRef, fileAsset);
            resolvedImageUrl = await getDownloadURL(snapshot.ref);
        }

        if (isEditingMode) {
            const documentReference = doc(db, "posts", editId);
            const updatePayload = { title, slug, category, content: formattedContentHTML };
            if (resolvedImageUrl !== "") updatePayload.imageUrl = resolvedImageUrl;
            await updateDoc(documentReference, updatePayload);
            alert("Blog updated successfully.");
        } else {
            await addDoc(collection(db, "posts"), {
                title, slug, category, imageUrl: resolvedImageUrl, content: formattedContentHTML, createdAt: serverTimestamp()
            });
            alert("Blog published successfully!");
        }

        resetFormState();
        syncAdminLedgerList();
    } catch (err) { alert("Transaction Failed: " + err.message); } 
    finally {
        actionButton.disabled = false;
        actionButton.innerText = isEditingMode ? "Save and Update Blog Changes" : "Commit Record to Database";
    }
});
