import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const grid = document.getElementById("productGrid");

console.log("✅ store.js running");

async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));

  if (!grid) {
    console.error("❌ productGrid missing");
    return;
  }

  grid.innerHTML = "";

  snap.forEach(d => {
    const p = d.data();
    const div = document.createElement("div");
    div.innerHTML = `<h3>${p.name}</h3>`;
    grid.appendChild(div);
  });
}

loadProducts();