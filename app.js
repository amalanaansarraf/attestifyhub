import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, where } from "firebase/firestore";

// REPLACE THESE SYNC CODES WITH VARIABLES GENERATED FROM YOUR FIREBASE WEB PROJECT SETUP PANEL
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Application Modules
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple Mobile Navigation Handler
document.getElementById('menu-btn').addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
});

// Single Page Routing Core
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);

function handleRouting() {
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.getElementById('mobile-menu').classList.add('hidden');

    if (hash === '#/' || hash === '') {
        document.getElementById('home-view').classList.add('active');
        fetchArticles(true);
    } else if (hash === '#/blog') {
        document.getElementById('blog-view').classList.add('active');
        fetchArticles(false);
    } else if (hash.startsWith('#/post/')) {
        const slug = hash.replace('#/post/', '');
        document.getElementById('post-view').classList.add('active');
        renderSinglePost(slug);
    } else if (hash === '#/admin') {
        document.getElementById('admin-view').classList.add('active');
    }
}

// Fetch content collections dynamically from cloud databases
async function fetchArticles(isFeaturedOnly = false) {
    const gridId = isFeaturedOnly ? 'featured-grid' : 'blog-grid';
    const targetElement = document.getElementById(gridId);
    if (!targetElement) return;

    targetElement.innerHTML = `
        <div class="col-span-full text-center py-12 text-slate-400">
            <i class="fa-solid fa-circle-notch animate-spin text-3xl mb-3 text-blue-600"></i>
            <p class="text-sm font-medium">Syncing database collections...</p>
        </div>`;

    try {
        let q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        if (isFeaturedOnly) {
            // Fetch maximum 3 items if on the landing preview view card strip
            q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        }
        
        const querySnapshot = await getDocs(q);
        targetElement.innerHTML = "";

        if (querySnapshot.empty) {
            targetElement.innerHTML = `<p class="col-span-full text-center py-12 text-slate-500">No regulatory guides published yet.</p>`;
            return;
        }

        let counter = 0;
        querySnapshot.forEach((doc) => {
            if (isFeaturedOnly && counter >= 3) return; // Cap landing page metrics
            const post = doc.data();
            targetElement.innerHTML += buildPostCardMarkup(post);
            counter++;
        });
    } catch (error) {
        console.error("Database compilation exception:", error);
        targetElement.innerHTML = `<p class="col-span-full text-rose-600 text-center py-12 font-medium">Unable to stream dynamic records. Verify security configurations.</p>`;
    }
}

function buildPostCardMarkup(post) {
    const fallbackImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/></svg>";
    return `
        <article class="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-md shadow-slate-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div class="h-48 w-full bg-slate-100 relative overflow-hidden">
                <img src="${post.imageUrl || fallbackImg}" class="w-full h-full object-cover" alt="${post.title}" loading="lazy">
                <span class="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase">${post.category || 'Compliance'}</span>
            </div>
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                    <h3 class="text-xl font-bold text-slate-900 tracking-tight line-clamp-2 hover:text-blue-600 transition">
                        <a href="#/post/${post.slug}">${post.title}</a>
                    </h3>
                    <p class="text-slate-500 text-sm line-clamp-3 leading-relaxed">${post.content.replace(/<[^>]*>/g, '').substring(0, 130)}...</p>
                </div>
                <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-400"><i class="fa-regular fa-calendar mr-1.5"></i>${new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    <a href="#/post/${post.slug}" class="text-blue-600 hover:text-blue-700 text-sm font-bold inline-flex items-center group">Read Manual <i class="fa-solid fa-arrow-right ml-1.5 transform group-hover:translate-x-1 transition"></i></a>
                </div>
            </div>
        </article>
    `;
}

async function renderSinglePost(slug) {
    const titleEl = document.getElementById('post-title');
    const metaEl = document.getElementById('post-meta');
    const imgEl = document.getElementById('post-hero-image');
    const contentEl = document.getElementById('post-content');

    contentEl.innerHTML = `<div class="text-center py-12"><i class="fa-solid fa-spinner animate-spin text-2xl text-blue-600"></i></div>`;

    try {
        const q = query(collection(db, "posts"), where("slug", "===", slug));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            titleEl.innerText = "Guide Index Record Missing";
            contentEl.innerHTML = "<p class='text-rose-600'>The document directory route you requested could not be resolved on-chain.</p>";
            imgEl.classList.add('hidden');
            return;
        }

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            titleEl.innerText = post.title;
            metaEl.innerText = `${post.category} | Published ${new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}`;
            
            if(post.imageUrl) {
                imgEl.src = post.imageUrl;
                imgEl.classList.remove('hidden');
            } else {
                imgEl.classList.add('hidden');
            }
            
            // Render structured HTML safely injected into content wrapper
            contentEl.innerHTML = post.content.replace(/\n/g, '<br>');
            document.title = `${post.title} | AttestifyHub`;
        });
    } catch (error) {
        console.error("Content retrieval failure:", error);
    }
}

export { db };
