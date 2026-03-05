import { db } from "./firebase.js";
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const list = document.getElementById("productList");
const categoryBar = document.getElementById("categoryBar");
const subCategoryBar = document.getElementById("subCategoryBar");

let allProducts = [];
let categories = [];

let mainCategories = [];
let subCategories = [];

let activeCategory = "all";
let activeSubCategory = "all";

/* ================= LOAD CATEGORIES ================= */

async function loadCategories() {

  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("order"))
  );

  categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  mainCategories = categories.filter(c => !c.parentId);
  subCategories = categories.filter(c => c.parentId);

  renderCategoryBar();
}

/* ================= MAIN CATEGORY BAR ================= */

function renderCategoryBar() {

  categoryBar.innerHTML = "";

  categoryBar.appendChild(createCategoryBtn("All", "all"));

  mainCategories.forEach(cat => {
    categoryBar.appendChild(createCategoryBtn(cat.name, cat.id));
  });
}

function createCategoryBtn(label, id) {

  const btn = document.createElement("div");

  btn.className =
    "category-pill" + (activeCategory === id ? " active" : "");

  btn.innerText = label;

  btn.onclick = () => {

    activeCategory = id;
    activeSubCategory = "all";

    document
      .querySelectorAll("#categoryBar .category-pill")
      .forEach(p => p.classList.remove("active"));

    btn.classList.add("active");

    renderSubCategories();
    renderProducts();
  };

  return btn;
}

/* ================= SUB CATEGORY BAR ================= */

function renderSubCategories() {

  subCategoryBar.innerHTML = "";

  if (activeCategory === "all") return;

  const subs = subCategories.filter(s => s.parentId === activeCategory);

  if (!subs.length) return;

  subCategoryBar.appendChild(createSubBtn("All", "all"));

  subs.forEach(sub => {
    subCategoryBar.appendChild(createSubBtn(sub.name, sub.id));
  });
}

function createSubBtn(label, id) {

  const btn = document.createElement("div");

  btn.className =
    "subcategory-pill" + (activeSubCategory === id ? " active" : "");

  btn.innerText = label;

  btn.onclick = () => {

    activeSubCategory = id;

    document
      .querySelectorAll(".subcategory-pill")
      .forEach(p => p.classList.remove("active"));

    btn.classList.add("active");

    renderProducts();
  };

  return btn;
}

/* ================= LOAD PRODUCTS ================= */

async function loadProducts() {

  const snap = await getDocs(collection(db, "products"));

  allProducts = snap.docs.map(p => ({
    id: p.id,
    ...p.data()
  }));

  renderProducts();
}

/* ================= RENDER PRODUCTS ================= */

function renderProducts() {

  list.innerHTML = "";

  const filtered = allProducts.filter(p => {

    if (activeCategory !== "all" && p.categoryId !== activeCategory)
      return false;

    if (activeSubCategory !== "all" && p.subCategoryId !== activeSubCategory)
      return false;

    return true;
  });

  filtered.forEach(p => {

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="card-content">
        <h3>${p.name}</h3>
        <p>₹${p.basePrice}</p>

        <div style="display:flex;gap:10px">
          <button class="btn-outline" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn-outline" onclick="duplicateProduct('${p.id}')">Duplicate</button>
          <button class="btn-outline" onclick="deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>

      <img src="${p.images?.[0] || ''}">
    `;

    list.appendChild(div);
  });
}

/* ================= ACTIONS ================= */

window.editProduct = (id) => {
  location.href = `edit-product.html?id=${id}`;
};

window.deleteProduct = async (id) => {

  if (!confirm("Delete this product?")) return;

  await deleteDoc(doc(db, "products", id));

  loadProducts();
};

/* ================= DUPLICATE PRODUCT ================= */

window.duplicateProduct = async (id) => {

  if (!confirm("Duplicate this product?")) return;

  try {

    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const copy = { ...product };

    delete copy.id;

    copy.name = product.name + " (Copy)";
    copy.createdAt = Date.now();

    const newDoc = await addDoc(collection(db, "products"), copy);

    // Open edit page of duplicated product
    location.href = `edit-product.html?id=${newDoc.id}`;

  } catch (err) {

    console.error(err);
    alert("Duplicate failed");

  }
};

/* ================= INIT ================= */

loadCategories();
loadProducts();