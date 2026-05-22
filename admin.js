import { getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./app.js";

const app = getApp();
const auth = getAuth(app);
const storage = getStorage(app);

const loginWrap = document.getElementById('admin-auth');
const deskWrap = document.getElementById('admin-dashboard');

onAuthStateChanged(auth, (sessionUser) => {
    if (sessionUser) {
        loginWrap.classList.add('hidden');
        deskWrap.classList.remove('hidden');
    } else {
        loginWrap.classList.remove('hidden');
        deskWrap.classList.add('hidden');
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

// Automated Clean SEO Slug Generation Pipeline Engine
document.getElementById('post-input-title').addEventListener('input', (e) => {
    const slugBox = document.getElementById('post-input-slug');
    slugBox.value = e.target.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')  // Wipe illegal structures
        .replace(/\s+/g, '-')          // Transform empty margins to single hyphens
        .replace(/-+/g, '-');          // Squeeze continuous hyphens
});

// Publish Form Submission Matrix
document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const actionButton = document.getElementById('submit-btn');
    actionButton.disabled = true;
    actionButton.innerText = "Uploading Payload to Storage Cluster...";

    const title = document.getElementById('post-input-title').value;
    const slug = document.getElementById('post-input-slug').value;
    const category = document.getElementById('post-input-category').value;
    const fileAsset = document.getElementById('post-input-image').files[0];
    const explicitContent = document.getElementById('post-input-content').value;

    let resolvedImageUrl = "";

    try {
        if (fileAsset) {
            const fileRef = ref(storage, `blog_images/${Date.now()}_${fileAsset.name}`);
            const snapshot = await uploadBytes(fileRef, fileAsset);
            resolvedImageUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, "posts"), {
            title,
            slug,
            category,
            imageUrl: resolvedImageUrl,
            content: explicitContent,
            createdAt: serverTimestamp()
        });

        alert("Data Packet Successfully Committed!");
        document.getElementById('post-form').reset();
        window.location.hash = "#/blog";
    } catch (err) {
        alert("Transaction Failed: " + err.message);
    } finally {
        actionButton.disabled = false;
        actionButton.innerText = "Commit Metadata Record to Cluster";
    }
});
