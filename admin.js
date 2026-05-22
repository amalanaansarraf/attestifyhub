import { initializeApp, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./app.js";

const app = getApp();
const auth = getAuth(app);
const storage = getStorage(app);

const authBlock = document.getElementById('admin-auth');
const dashBlock = document.getElementById('admin-dashboard');

// Session Event State Tracker
onAuthStateChanged(auth, (user) => {
    if (user) {
        authBlock.classList.add('hidden');
        dashBlock.classList.remove('hidden');
    } else {
        authBlock.classList.remove('hidden');
        dashBlock.classList.add('hidden');
    }
});

// Processing Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Authorization Denied: " + error.message);
    }
});

// Terminate Session
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// Automate standard input slug generation patterns for clean URLs
document.getElementById('post-input-title').addEventListener('input', (e) => {
    const slugInput = document.getElementById('post-input-slug');
    slugInput.value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // strip invalid symbols
        .replace(/\s+/g, '-')       // swap spaces with hyphens
        .replace(/-+/g, '-');       // squeeze repetitive breaks
});

// Content Publish Pipeline Routine
document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "Uploading Payload to Servers...";

    const title = document.getElementById('post-input-title').value;
    const slug = document.getElementById('post-input-slug').value;
    const category = document.getElementById('post-input-category').value;
    const file = document.getElementById('post-input-image').files[0];
    const content = document.getElementById('post-input-content').value;

    let imageUrl = "";

    try {
        // 1. Process Media Upload if Asset Array is present
        if (file) {
            const storageRef = ref(storage, `blog_images/${Date.now()}_${file.name}`);
            const uploadSnapshot = await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(uploadSnapshot.ref);
        }

        // 2. Transmit Formatted Object to Firestore Collection Array
        await addDoc(collection(db, "posts"), {
            title,
            slug,
            category,
            imageUrl,
            content,
            createdAt: serverTimestamp()
        });

        alert("Operational Manual Successfully Published!");
        document.getElementById('post-form').reset();
        window.location.hash = "#/blog"; // Route to live catalog
    } catch (error) {
        console.error("Submission crash exception:", error);
        alert("Failed to commit document structure: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Commit Article to Blockchain & Database";
    }
});
