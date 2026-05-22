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

let quillEditor; // Local pointer holding the rich text initialization object array

// Initialize Rich Text Console Layouts
function initializeRichTextEditor() {
    if (document.getElementById('editor-container') && !quillEditor) {
        quillEditor = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'clean']
                ]
            }
        });
    }
}

// Session Event State Tracker Initialization Node
onAuthStateChanged(auth, (sessionUser) => {
    if (sessionUser) {
        loginWrap.classList.add('hidden');
        deskWrap.classList.remove('hidden');
        initializeRichTextEditor();
        syncAdminLedgerList();
    } else {
        loginWrap.classList.remove('hidden');
        dashBlock.classList.add('hidden');
    }
});

// Authorizing Identity Credentials
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mail = document.getElementById('login-email').value;
    const word = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, mail, word);
    } catch (err) {
        alert("Authentication Blocked: " + err.message);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth); });

// Automated Clean SEO Slug Generation Engine Configuration
document.getElementById('post-input-title').addEventListener('input', (e) => {
    // Block generation routines if currently editing existing documents
    if(document.getElementById('post-edit-id').value !== "") return;
    
    const slugBox = document.getElementById('post-input-slug');
    slugBox.value = e.target.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')  
        .replace(/\s+/g, '-')          
        .replace(/-+/g, '-');          
});

// Fetch and render the structural admin data list array inside the right sidebar ledger panel
async function syncAdminLedgerList() {
    const container = document.getElementById('admin-posts-ledger');
    if (!container) return;

    container.innerHTML = `<div class="text-center py-8 text-slate-400 text-xs font-semibold"><i class="fa-solid fa-arrows-spin animate-spin mr-1.5"></i>Syncing Index Ledger Data...</div>`;

    try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `<p class="text-center py-6 text-slate-400 text-xs font-medium">No live documentation packages found.</p>`;
            return;
        }

        snapshot.forEach((docRecord) => {
            const item = docRecord.data();
            const id = docRecord.id;

            // Generate structural element layouts mapping administrative command triggers securely 
            const entryItemHtml = `
                <div class="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col space-y-2 group transition hover:bg-white hover:border-slate-200">
                    <div class="space-y-0.5">
                        <span class="text-[9px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 px-2 py-0.5 rounded">${item.category}</span>
                        <h4 class="text-xs font-bold text-slate-900 tracking-tight line-clamp-1 mt-1">${item.title}</h4>
                        <p class="text-[10px] font-mono text-slate-400 truncate">#/${item.slug}</p>
                    </div>
                    <div class="flex items-center justify-end gap-2 pt-1 border-t border-slate-100/60">
                        <button type="button" data-id="${id}" class="edit-trigger-btn text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/40 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
                        <button type="button" data-id="${id}" class="delete-trigger-btn text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50/40 hover:bg-rose-50 px-2.5 py-1 rounded-md transition"><i class="fa-solid fa-trash-can mr-1"></i>Delete</button>
                    </div>
                </div>
            `;
            container.innerHTML += entryItemHtml;
        });

        // Register tracking hook variables dynamically 
        attachManagementEventListeners(snapshot);

    } catch (err) {
        console.error("Ledger rendering failure error:", err);
        container.innerHTML = `<p class="text-xs text-center text-rose-500 font-semibold">Ledger Pipeline Interrupted.</p>`;
    }
}

function attachManagementEventListeners(snapshot) {
    // Delete action tracking routines
    document.querySelectorAll('.delete-trigger-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetId = btn.getAttribute('data-id');
            if (confirm("Are you absolutely sure you want to permanently discard this document manual node?")) {
                try {
                    await deleteDoc(doc(db, "posts", targetId));
                    alert("Document removed from cluster matrix successfully.");
                    syncAdminLedgerList();
                    // If we were editing this specific piece, clear edit contexts out
                    if(document.getElementById('post-edit-id').value === targetId) resetFormState();
                } catch (err) {
                    alert("Deletions rejected: " + err.message);
                }
            }
        });
    });

    // Edit pipeline preparation mapping routines
    document.querySelectorAll('.edit-trigger-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-id');
            
            // Extract core snapshot values cleanly matching identity references 
            snapshot.forEach(docObj => {
                if(docObj.id === targetId) {
                    const postData = docObj.data();
                    
                    // Route values accurately back into the UI forms arrays
                    document.getElementById('post-edit-id').value = targetId;
                    document.getElementById('post-input-title').value = postData.title;
                    document.getElementById('post-input-slug').value = postData.slug;
                    document.getElementById('post-input-category').value = postData.category;
                    
                    // Inject database content safely inside Quill editor fields
                    quillEditor.root.innerHTML = postData.content;

                    // Swap operational messaging displays smoothly
                    document.getElementById('form-action-title').innerText = "Revise Active Schema Content";
                    document.getElementById('submit-btn').innerText = "Save and Update Document Changes";
                    document.getElementById('edit-image-status').classList.remove('hidden');
                    document.getElementById('cancel-edit-btn').classList.remove('hidden');
                    
                    // Focus user screen focus up to viewport parameters nicely
                    document.getElementById('post-input-title').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    });
}

// Reset admin tracking metrics back to default baseline states
function resetFormState() {
    document.getElementById('post-form').reset();
    document.getElementById('post-edit-id').value = "";
    quillEditor.root.innerHTML = "";
    
    document.getElementById('form-action-title').innerText = "Create New Publication";
    document.getElementById('submit-btn').innerText = "Commit Record to Database";
    document.getElementById('edit-image-status').add('hidden');
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

document.getElementById('cancel-edit-btn').addEventListener('click', resetFormState);

// Central form submission routing controller matrix
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
    
    // Extract formatted clean structural HTML directly from our Quill context fields
    const formattedContentHTML = quillEditor.root.innerHTML;

    let resolvedImageUrl = "";

    try {
        // Process media uploads if file values are present inside input selectors
        if (fileAsset) {
            const fileRef = ref(storage, `blog_images/${Date.now()}_${fileAsset.name}`);
            const uploadSnapshot = await uploadBytes(fileRef, fileAsset);
            resolvedImageUrl = await getDownloadURL(uploadSnapshot.ref);
        }

        if (isEditingMode) {
            // Compile updating object packets smoothly
            const documentReference = doc(db, "posts", editId);
            const updatePayload = {
                title,
                slug,
                category,
                content: formattedContentHTML
            };
            
            // Only update image path indices if user submitted a new asset
            if (resolvedImageUrl !== "") updatePayload.imageUrl = resolvedImageUrl;
            
            await updateDoc(documentReference, updatePayload);
            alert("Active documentation directory successfully updated.");
        } else {
            // Standard baseline execution for entirely fresh posts entries
            await addDoc(collection(db, "posts"), {
                title,
                slug,
                category,
                imageUrl: resolvedImageUrl,
                content: formattedContentHTML,
                createdAt: serverTimestamp()
            });
            alert("Data Packet Successfully Committed!");
        }

        resetFormState();
        syncAdminLedgerList();
    } catch (err) {
        alert("Transaction Failed: " + err.message);
    } finally {
        actionButton.disabled = false;
        actionButton.innerText = isEditingMode ? "Save and Update Document Changes" : "Commit Record to Database";
    }
});
