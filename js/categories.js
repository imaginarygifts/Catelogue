import { db } from './firebase.js';
import { 
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const list = document.getElementById("catList");
let draggedItem = null;

async function load() {
  list.innerHTML = "";

  const q = query(collection(db, "categories"), orderBy("order"));
  const snap = await getDocs(q);

  snap.forEach(docu => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = docu.id;

    li.innerHTML = `
      <span>${docu.data().name}</span>
      <button onclick="del('${docu.id}')">❌</button>
    `;

    // drag events
    li.addEventListener("dragstart", () => draggedItem = li);
    li.addEventListener("dragover", e => e.preventDefault());
    li.addEventListener("drop", () => swapOrder(draggedItem, li));

    list.appendChild(li);
  });
}

async function swapOrder(item1, item2) {
  if (!item1 || !item2 || item1 === item2) return;

  const id1 = item1.dataset.id;
  const id2 = item2.dataset.id;

  const items = [...list.children];
  const index1 = items.indexOf(item1);
  const index2 = items.indexOf(item2);

  await updateDoc(doc(db, "categories", id1), { order: index2 });
  await updateDoc(doc(db, "categories", id2), { order: index1 });

  load();
}

window.addCategory = async () => {
  const name = document.getElementById("catName").value.trim();
  if (!name) return;

  const snap = await getDocs(collection(db, "categories"));
  const order = snap.size; // next position

  await addDoc(collection(db, "categories"), { name, order });
  load();
};

window.del = async (id) => {
  await deleteDoc(doc(db, "categories", id));
  load();
};

load();