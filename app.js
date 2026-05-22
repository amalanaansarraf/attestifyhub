import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, where } from "firebase/firestore";

// Your Explicit App Infrastructure Metrics Object Link Injection 
const firebaseConfig = {
    apiKey: "AIzaSyBC-9dYZspjbkH9-XcVx7jzyI8APPotR_I",
    authDomain: "attestifyhub.firebaseapp.com",
    projectId: "attestifyhub",
    storageBucket: "attestifyhub.firebasestorage.app",
    messagingSenderId: "140396215714",
    appId: "1:140396215714:web:c44d4377202bfabd4286fb",
    measurementId: "G-GRN4DPJ4Z8"
};

// Initialize Instance
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple Responsive Nav Toggle Execution
document.getElementById('menu-btn').addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
});

// Routing Controller Logic Matrix
window.addEventListener('hashchange', routerPipeline);
window.addEventListener('load', routerPipeline);

function routerPipeline() {
    const hash = window.location.hash || '#/';
    const sections = document.querySelectorAll('.view-section');
    
    sections.forEach(sec => {
        sec.classList.remove('active-view');
        sec.style.opacity = '0';
    });
    document.getElementById('mobile-menu').classList.add('hidden');

    setTimeout(() => {
        if (hash === '#/' || hash === '') {
            renderView('home-view');
            fetchCollectionRecords(true);
        } else if (hash === '#/blog') {
            renderView('blog-view');
            fetchCollectionRecords(false);
        } else if (hash.startsWith('#/post/')) {
            const cleanSlug = hash.replace('#/post/', '');
            renderView('post-view');
            compileIndividualArticle(cleanSlug);
        } else if (hash === '#/admin') {
            renderView('admin-view');
        }
    }, 200); // Gives time for smooth fade out
}

function renderView(viewId) {
    const target = document.getElementById(viewId);
    target.classList.add('active-view');
    setTimeout(() => { target.style.opacity = '1'; }, 50);
}

// Pull Content from Database Dynamic Fields
async function fetchCollectionRecords(isFeaturedOnly = false) {
    const componentTarget = isFeaturedOnly ? 'featured-grid' : 'blog-grid';
    const domElement = document.getElementById(componentTarget);
    if (!domElement) return;

    domElement.innerHTML = `
        <div class="col-span-full text-center py-16 text-slate-400">
            <i class="fa-solid fa-compass-drafting animate-spin text-3xl mb-3 text-indigo-600"></i>
            <p class="text-xs font-semibold tracking-wide uppercase">Streaming Schema Manifests...</p>
        </div>`;

    try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        domElement.innerHTML = "";

        if (snapshot.empty) {
            domElement.innerHTML = `<p class="col-span-full text-center py-12 text-slate-400 font-medium text-sm">No verification documentation logged in this index node.</p>`;
            return;
        }

        let loopLimit = 0;
        snapshot.forEach((doc) => {
            if (isFeaturedOnly && loopLimit >= 3) return;
            const data = doc.data();
            domElement.innerHTML += buildCardTemplate(data);
            loopLimit++;
        });
    } catch (err) {
        console.error("Database streaming error:", err);
        domElement.innerHTML = `<p class="col-span-full text-center text-rose-600 text-sm font-semibold">Data Pipeline Interrupted.</p>`;
    }
}

function buildCardTemplate(post) {
    const fallback = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/></svg>";
    return `
        <article class="bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div class="h-52 w-full bg-slate-100 relative overflow-hidden">
                <img src="${post.imageUrl || fallback}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt="${post.title}" loading="lazy">
                <span class="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">${post.category || 'Compliance'}</span>
            </div>
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                    <h3 class="text-lg font-bold text-slate-900 tracking-tight line-clamp-2 group-hover:text-indigo-600 transition">
                        <a href="#/post/${post.slug}">${post.title}</a>
                    </h3>
                    <p class="text-slate-500 text-sm line-clamp-3 leading-relaxed font-medium">${post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
                </div>
                <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span class="text-slate-400 uppercase tracking-wider"><i class="fa-regular fa-calendar-check mr-1.5 text-indigo-500"></i>${new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    <a href="#/post/${post.slug}" class="text-indigo-600 hover:text-indigo-700 inline-flex items-center">Open Manual <i class="fa-solid fa-chevron-right ml-1 text-[10px]"></i></a>
                </div>
            </div>
        </article>
    `;
}

async function compileIndividualArticle(slug) {
    const title = document.getElementById('post-title');
    const meta = document.getElementById('post-meta');
    const img = document.getElementById('post-hero-image');
    const body = document.getElementById('post-content');

    body.innerHTML = `<div class="text-center py-20"><i class="fa-solid fa-spinner animate-spin text-3xl text-indigo-600"></i></div>`;

    try {
        const q = query(collection(db, "posts"), where("slug", "==", slug));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            title.innerText = "Directory Node Missing";
            body.innerHTML = "<p class='text-sm font-semibold text-rose-600'>The clean route string supplied does not map to an authenticated data packet structure on-chain.</p>";
            img.classList.add('hidden');
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            title.innerText = data.title;
            meta.innerText = `${data.category} // Issued ${new Date(data.createdAt?.seconds * 1000).toLocaleDateString()}`;
            
            if (data.imageUrl) {
                img.src = data.imageUrl;
                img.classList.remove('hidden');
            } else {
                img.classList.add('hidden');
            }
            
            body.innerHTML = data.content.replace(/\n/g, '<br>');
            document.title = `${data.title} | AttestifyHub Guide`;
        });
    } catch (err) {
        console.error("Pipeline breakdown failure:", err);
    }
}

export { db };
