import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Wait for HTML to fully load before running tree logic
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing tree...");
    growFruit();
    updateStatus();
    
    // Add listeners
    document.getElementById('feedback-trigger').addEventListener('click', () => document.getElementById('feedback-lightbox').classList.add('show'));
    document.getElementById('close-feedback-btn').addEventListener('click', () => document.getElementById('feedback-lightbox').classList.remove('show'));
    document.getElementById('plant-btn').addEventListener('click', handlePlanting);
    document.getElementById('submit-feedback-btn').addEventListener('click', handleFeedback);
});

async function growFruit() {
    const container = document.getElementById('fruit-container');
    if (!container) {
        console.error("Fruit container not found in DOM!");
        return;
    }
    
    container.innerHTML = ""; 
    try {
        const q = query(collection(db, "thoughts"), orderBy("timestamp", "desc"), limit(9));
        const snap = await getDocs(q);
        
        console.log(`Found ${snap.size} thoughts.`);
        
        const branchNodes = [[30, 60], [70, 60], [50, 50], [40, 75], [60, 75], [35, 80], [65, 80], [45, 65], [55, 65]];
        let i = 0;
        snap.forEach((doc) => {
            const fruit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const [cx, cy] = branchNodes[i % branchNodes.length];
            fruit.setAttribute("cx", cx); 
            fruit.setAttribute("cy", cy); 
            fruit.setAttribute("r", "3.5"); 
            fruit.setAttribute("fill", i % 2 === 0 ? "var(--accent)" : "var(--accent-alt)");
            fruit.setAttribute("class", "fruit-node");
            container.appendChild(fruit);
            
            // Trigger animation
            setTimeout(() => fruit.classList.add("show"), i * 100);
            i++;
        });
    } catch (e) {
        console.error("Error fetching thoughts:", e);
    }
}

async function updateStatus() {
    try {
        const snap = await getCountFromServer(collection(db, "thoughts"));
        const count = snap.data().count;
        const statusEl = document.getElementById('grove-status');
        if(statusEl) statusEl.innerHTML = `<a href="harvest.html">The Grove holds ${count} seeds.</a>`;
    } catch (e) { console.error("Error updating status:", e); }
}

async function handlePlanting() {
    const input = document.getElementById('seed-input');
    if (!input.value) return;
    try {
        await addDoc(collection(db, "thoughts"), { thought: input.value, timestamp: serverTimestamp(), type: "thought", reflectionCount: 0 });
        input.value = "";
        growFruit();
        updateStatus();
    } catch (e) { console.error("Planting error:", e); }
}

async function handleFeedback() {
    const input = document.getElementById('feedback-input');
    if(!input.value) return;
    try {
        await addDoc(collection(db, "feedback"), { text: input.value, timestamp: serverTimestamp() });
        input.value = "";
        document.getElementById('feedback-lightbox').classList.remove('show');
    } catch (e) { console.error("Feedback error:", e); }
}
