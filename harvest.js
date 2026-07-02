import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy, where, doc, writeBatch, increment, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyCNtb9aKUOLjJXH59mDnD6IQMYIxpAT3ss", 
    authDomain: "no-ledge-tree.firebaseapp.com", 
    projectId: "no-ledge-tree", 
    storageBucket: "no-ledge-tree.firebasestorage.app", 
    messagingSenderId: "633687715329", 
    appId: "1:633687715329:web:c18aa11ccb64b7d43fda00" 
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let activethoughtId = null;
let activeMode = null;

// Attach functions to window so the HTML 'onclick' tags can find them
window.showToast = (msg) => {
    const toast = document.getElementById('toast');
    toast.innerText = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
};

async function loadHarvest() {
    const feed = document.getElementById('feed');
    try {
        const q = query(collection(db, "thoughts"), orderBy("timestamp", "desc"), limit(20));
        const snap = await getDocs(q);
        feed.innerHTML = "";
        
        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const seedCount = data.reflectionCount || 0;
            
            const div = document.createElement('div');
            div.className = 'thought-card';
            div.innerHTML = `
                <div class="seed-header">
                    <div class="seed-dot"></div>
                    <span class="seed-count-text">
                        <span class="seed-number" id="count-${id}">${seedCount}</span> ${seedCount === 1 ? 'seed' : 'seeds'}
                    </span>
                </div>
                <div class="text">${data.thought}</div>
                <div class="action-row">
                    <button class="btn btn-view" onclick="toggleAccordion('${id}')">View seeds</button>
                    <button class="btn" onclick="openLightbox('${id}', 'Echo')">Echo</button>
                    <button class="btn" onclick="openLightbox('${id}', 'Dissolve')">Dissolve</button>
                </div>
                <div id="acc-${id}" class="accordion"></div>
            `;
            feed.appendChild(div);
        });
    } catch (e) { 
        console.error(e); 
        feed.innerText = "The grove is resting.";
    }
}

window.toggleAccordion = async (id) => {
    const acc = document.getElementById(`acc-${id}`);
    if (acc.classList.contains('open')) { 
        acc.classList.remove('open'); 
        return; 
    }
    acc.classList.add('open');
    if (acc.innerHTML !== "") return; 
    
    acc.innerHTML = "<div style='color:#333; font-size:0.7rem;'>Unfolding...</div>";
    const q = query(collection(db, "reflections"), where("thoughtId", "==", id), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    
    acc.innerHTML = snap.empty ? "<p style='color:#333; font-size:0.7rem;'>No seeds sown here yet.</p>" : "";
    snap.forEach(d => {
        const data = d.data();
        const type = data.type || 'reflection';
        const colorClass = type === 'challenge' ? 'echo-challenge' : 'echo-reflection';
        acc.innerHTML += `<div class="echo-item ${colorClass}">${data.text}</div>`;
    });
};

window.openLightbox = (id, mode) => {
    activethoughtId = id; activeMode = mode;
    document.getElementById('modal-title').innerText = mode === 'Echo' ? "Hold a Mirror" : "Dissolve the Ledge";
    document.getElementById('lightbox').classList.add('show'); 
    setTimeout(() => document.getElementById('lightbox-input').focus(), 100);
};

window.closeLightbox = () => document.getElementById('lightbox').classList.remove('show');

window.submitLightboxReply = async () => {
    const input = document.getElementById('lightbox-input');
    const submitBtn = document.getElementById('sow-btn');
    if(!input.value) return;

    submitBtn.disabled = true;
    submitBtn.innerText = "Sowing...";
    
    const countEl = document.getElementById(`count-${activethoughtId}`);
    let current = parseInt(countEl.innerText);
    countEl.innerText = current + 1;
    
    try {
        const batch = writeBatch(db);
        const ref = doc(collection(db, "reflections"));
        batch.set(ref, { 
            thoughtId: activethoughtId, text: input.value, 
            timestamp: serverTimestamp(), type: activeMode === 'Dissolve' ? 'challenge' : 'reflection'
        });
        batch.update(doc(db, "thoughts", activethoughtId), { reflectionCount: increment(1) });
        await batch.commit();
        
        const acc = document.getElementById(`acc-${activethoughtId}`);
        if(acc.classList.contains('open')) {
            const item = document.createElement('div');
            item.className = `echo-item ${activeMode === 'Dissolve' ? 'echo-challenge' : 'echo-reflection'}`;
            item.innerText = input.value;
            acc.prepend(item);
        }

        window.showToast("Sown."); 
        input.value = ""; 
        window.closeLightbox();
    } catch(e) { 
        window.showToast("Error."); 
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Sow";
    }
};

// Initial setup
document.getElementById('sow-btn').addEventListener('click', window.submitLightboxReply);
document.getElementById('close-lightbox-btn').addEventListener('click', window.closeLightbox);
loadHarvest();
