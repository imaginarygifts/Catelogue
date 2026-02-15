import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= CATEGORIES ================= */

const list = document.getElementById("catList");
const input = document.getElementById("catName");
const parentSelect = document.getElementById("parentCategory");

let draggedItem = null;

/* ---------- LOAD CATEGORIES ---------- */
async function loadCategories() {
  list.innerHTML = "";
  parentSelect.innerHTML = `<option value="">Select Category</option>`;

  const q = query(collection(db, "categories"), orderBy("order"));
  const snap = await getDocs(q);

  snap.forEach(docu => {
    // List
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = docu.id;

    li.innerHTML = `
      <span>${docu.data().name}</span>
      <button onclick="delCategory('${docu.id}')">❌</button>
    `;

    // Drag
    li.addEventListener("dragstart", () => {
      draggedItem = li;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      clearDragOver();
    });

    li.addEventListener("dragover", e => {
      e.preventDefault();
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", async () => {
      li.classList.remove("drag-over");
      await reorderCategories(draggedItem, li);
    });

    list.appendChild(li);

    // Dropdown
    const opt = document.createElement("option");
    opt.value = docu.id;
    opt.textContent = docu.data().name;
    parentSelect.appendChild(opt);
  });
}

/* ---------- CLEAR DRAG ---------- */
function clearDragOver() {
  document.querySelectorAll(".drag-over")
    .forEach(el => el.classList.remove("drag-over"));
}

/* ---------- REORDER ---------- */
async function reorderCategories(item1, item2) {
  if (!item1 || !item2 || item1 === item2) return;

  const items = [...list.children];
  const from = items.indexOf(item1);
  const to = items.indexOf(item2);

  if (from < to) list.insertBefore(item1, item2.nextSibling);
  else list.insertBefore(item1, item2);

  await Promise.all(
    [...list.children].map((li, i) =>
      updateDoc(doc(db, "categories", li.dataset.id), { order: i })
    )
  );
}

/* ---------- ADD CATEGORY ---------- */
window.addCategory = async () => {
  const name = input.value.trim();
  if (!name) return;

  const snap = await getDocs(collection(db, "categories"));

  await addDoc(collection(db, "categories"), {
    name,
    order: snap.size
  });

  input.value = "";
  loadCategories();
};

/* ---------- DELETE CATEGORY ---------- */
window.delCategory = async (id) => {
  await deleteDoc(doc(db, "categories", id));
  loadCategories();
};

/* ================= SUB CATEGORIES ================= */

const subList = document.getElementById("subCatList");

parentSelect.addEventListener("change", e => {
  loadSubCategories(e.target.value);
});

/* ---------- LOAD SUB CATEGORIES ---------- */
async function loadSubCategories(categoryId) {
  subList.innerHTML = "";
  if (!categoryId) return;

  const q = query(
    collection(db, "subcategories"),
    where("categoryId", "==", categoryId),
    orderBy("order")
  );

  const snap = await getDocs(q);

  snap.forEach(docu => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${docu.data().name}</span>
      <button onclick="delSubCategory('${docu.id}', '${categoryId}')">❌</button>
    `;
    subList.appendChild(li);
  });
}

/* ---------- ADD SUB CATEGORY ---------- */
window.addSubCategory = async () => {
  const name = document.getElementById("subCatName").value.trim();
  const categoryId = parentSelect.value;

  if (!name || !categoryId) return;

  const snap = await getDocs(
    query(
      collection(db, "subcategories"),
      where("categoryId", "==", categoryId)
    )
  );

  await addDoc(collection(db, "subcategories"), {
    name,
    categoryId,
    order: snap.size
  });

  document.getElementById("subCatName").value = "";
  loadSubCategories(categoryId);
};

/* ---------- DELETE SUB CATEGORY ---------- */
window.delSubCategory = async (id, categoryId) => {
  await deleteDoc(doc(db, "subcategories", id));
  loadSubCategories(categoryId);
};

/* ---------- INIT ---------- */
loadCategories();