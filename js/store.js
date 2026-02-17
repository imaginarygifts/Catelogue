import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const grid = document.getElementById("productGrid");
const categoryBar = document.getElementById("categoryBar");
const subCategoryBar = document.getElementById("subCategoryBar");
const tagRow = document.getElementById("tagFilterRow");

/* ================= STATE ================= */

let allProducts = [];
let allCategories = [];
let mainCategories = [];
let subCategories = [];

let activeCategory = "all";
let activeSubCategory = "all";
let activeTag = "all";

/* ================= LOAD DATA ================= */

async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadCategories() {
  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("order"))
  );

  allCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  mainCategories = allCategories.filter(c => !c.parentId);
  subCategories = allCategories.filter(c => c.parentId);
}

async function loadTags() {
  if (!tagRow) return;
  const snap = await getDocs(collection(db, "tags"));
  renderTags(snap.docs.map(d => d.data()));
}

/* ================= CATEGORY UI ================= */

function renderMainCategories() {
  if (!categoryBar) return;

  categoryBar.innerHTML = "";
  if (subCategoryBar) subCategoryBar.innerHTML = "";

  // All button
  categoryBar.appendChild(createMainBtn("All", "all"));

  mainCategories.forEach(cat => {
    categoryBar.appendChild(createMainBtn(cat.name, cat.id));
  });
}

function createMainBtn(label, id) {
  const div = document.createElement("div");
  div.className =
    "category-pill" + (activeCategory === id ? " active" : "");
  div.innerText = label;

  div.onclick = () => {
    activeCategory = id;
    activeSubCategory = "all";

    document
      .querySelectorAll(".category-pill")
      .forEach(p => p.classList.remove("active"));

    div.classList.add("active");

    renderSubCategories();
    renderProducts();
  };

  return div;
}

/* ================= SUB CATEGORIES ================= */

function renderSubCategories() {
  if (!subCategoryBar) return;

  subCategoryBar.innerHTML = "";

  if (activeCategory === "all") return;

  const subs = subCategories.filter(
    s => s.parentId === activeCategory
  );

  if (!subs.length) return;

  subCategoryBar.appendChild(createSubBtn("All", "all"));

  subs.forEach(sub => {
    subCategoryBar.appendChild(createSubBtn(sub.name, sub.id));
  });
}

function createSubBtn(label, id) {
  const div = document.createElement("div");
  div.className =
    "subcategory-pill" +
    (activeSubCategory === id ? " active" : "");
  div.innerText = label;

  div.onclick = () => {
    activeSubCategory = id;

    document
      .querySelectorAll(".subcategory-pill")
      .forEach(p => p.classList.remove("active"));

    div.classList.add("active");
    renderProducts();
  };

  return div;
}

/* ================= TAGS ================= */

function renderTags(tags) {
  if (!tagRow) return;

  tagRow.innerHTML = "";

  const allChip = document.createElement("div");
  allChip.className =
    "tag-chip" + (activeTag === "all" ? " active" : "");
  allChip.innerText = "All";
  allChip.onclick = () => {
    activeTag = "all";
    renderProducts();
  };
  tagRow.appendChild(allChip);

  tags.forEach(tag => {
    const chip = document.createElement("div");
    chip.className =
      "tag-chip" + (activeTag === tag.slug ? " active" : "");
    chip.innerText = tag.name;

    chip.onclick = () => {
      activeTag = tag.slug;
      renderProducts();
    };

    tagRow.appendChild(chip);
  });
}

/* ================= PRODUCT RENDER ================= */

function renderProducts() {
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = allProducts.filter(p => {
    if (activeCategory !== "all" && p.categoryId !== activeCategory)
      return false;



    if (activeSubCategory !== "all") {
  // Show product if:
  // 1. It matches subCategoryId OR
  // 2. It belongs to main category but has no subCategoryId yet
  if (
    p.subCategoryId !== activeSubCategory &&
    (!p.subCategoryId && p.categoryId !== activeCategory)
  ) {
    return false;
  }
}


    if (
      activeTag !== "all" &&
      (!Array.isArray(p.tags) || !p.tags.includes(activeTag))
    )
      return false;

    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p class="empty">No products found</p>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.images?.[0] || ""}">
      <h4>${p.name}</h4>
      <p>₹${p.basePrice}</p>
    `;
    card.onclick = () => {
      location.href = `product.html?id=${p.id}`;
    };
    grid.appendChild(card);
  });
}

/* ================= INIT ================= */

(async function init() {
  console.log("✅ store.js stable init");

  await loadProducts();
  await loadCategories();
  await loadTags();

  renderMainCategories();
  renderProducts(); // 🔥 always show products on load
})();