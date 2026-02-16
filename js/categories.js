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

/* =====================================================
   ELEMENTS
===================================================== */

const list = document.getElementById("catList");
const input = document.getElementById("catName");
const parentSelect = document.getElementById("parentCategory");
const subList = document.getElementById("subCatList");

let draggedItem = null;

/* =====================================================
   LOAD CATEGORIES
===================================================== */

async function loadCategories() {
  list.innerHTML = "";
  parentSelect.innerHTML = `<option value="">Select Category</option>`;
  subList.innerHTML = "";

  const q = query(collection(db, "categories"), orderBy("order"));
  const snap = await getDocs(q);

  snap.forEach(docu => {
    /* ---------- CATEGORY LIST ---------- */
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.id = docu.id;
    li.innerHTML = `
      <span>${docu.data().name}</span>
      <button onclick="delCategory('${docu.id}')">❌</button>
    `;

    /* ---------- DRAG EVENTS ---------- */
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

    /* ---------- DROPDOWN ---------- */
    const opt = document.createElement("option");
    opt.value = docu.id;
    opt.textContent = docu.data().name;
    parentSelect.appendChild(opt);
  });

  /* 🔥 AUTO-SELECT FIRST CATEGORY & LOAD SUB-CATEGORIES */
  if (parentSelect.options.length > 1) {
    parentSelect.selectedIndex = 1; // skip "Select Category"
    loadSubCategories(parentSelect.value);
  }
}

/* =====================================================
   CATEGORY HELPERS
===================================================== */

function clearDragOver() {
  document
    .querySelectorAll(".drag-over")
    .forEach(el => el.classList.remove("drag-over"));
}

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

/* =====================================================
   CATEGORY ACTIONS
===================================================== */

window.addCategory = async () => {
  const name = input.value.trim();
  if (!name) return alert("Enter category name");

  try {
    const snap = await getDocs(collection(db, "categories"));
    await addDoc(collection(db, "categories"), {
      name,
      order: snap.size
    });

    input.value = "";
    loadCategories();
  } catch (err) {
    console.error(err);
    alert("Failed to add category");
  }
};

window.delCategory = async (id) => {
  if (!confirm("Delete this category?")) return;

  try {
    await deleteDoc(doc(db, "categories", id));
    loadCategories();
  } catch (err) {
    console.error(err);
    alert("Failed to delete category");
  }
};

/* =====================================================
   SUB-CATEGORIES
===================================================== */

async function loadSubCategories(categoryId) {
  subList.innerHTML = "<li>Loading…</li>";
  if (!categoryId) return;

  try {
    const q = query(
      collection(db, "subcategories"),
      where("categoryId", "==", categoryId)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      subList.innerHTML = `<li class="empty">No sub-categories</li>`;
      return;
    }

    subList.innerHTML = "";

    snap.forEach(docu => {
      const li = document.createElement("li");
      li.className = "subcat-item";
      li.innerHTML = `
        <span>${docu.data().name}</span>
        <button onclick="delSubCategory('${docu.id}', '${categoryId}')">❌</button>
      `;
      subList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load sub-categories");
  }
}

window.addSubCategory = async () => {
  const name = document.getElementById("subCatName").value.trim();
  const categoryId = parentSelect.value;

  if (!categoryId) return alert("Select category first");
  if (!name) return alert("Enter sub-category name");

  try {
    await addDoc(collection(db, "subcategories"), {
      name,
      categoryId,
      createdAt: Date.now()
    });

    document.getElementById("subCatName").value = "";
    loadSubCategories(categoryId);
  } catch (err) {
    console.error(err);
    alert("Failed to add sub-category");
  }
};

window.delSubCategory = async (id, categoryId) => {
  if (!confirm("Delete this sub-category?")) return;

  try {
    await deleteDoc(doc(db, "subcategories", id));
    loadSubCategories(categoryId);
  } catch (err) {
    console.error(err);
    alert("Failed to delete sub-category");
  }
};

/* =====================================================
   EVENTS
===================================================== */

parentSelect.addEventListener("change", () => {
  loadSubCategories(parentSelect.value);
});

/* =====================================================
   INIT
===================================================== */

loadCategories();