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
let allTags = [];

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

/* ================= CATEGORY UI ================= */

function renderMainCategories() {
  categoryBar.innerHTML = "";
  subCategoryBar.innerHTML = "";

  categoryBar.appendChild(createMainCategoryBtn("All", "all", true));

  mainCategories.forEach(cat => {
    categoryBar.appendChild(createMainCategoryBtn(cat.name, cat.id));
  });
}

function createMainCategoryBtn(label, id, forceActive = false) {
  const div = document.createElement("div");
  div.className =
    "category-pill" +
    ((activeCategory === id || forceActive) ? " active" : "");

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
  subCategoryBar.innerHTML = "";

  if (activeCategory === "all") return;

  const subs = subCategories.filter(s => s.parentId === activeCategory);
  if (!subs.length) return;

  subCategoryBar.appendChild(createSubCategoryBtn("All", "all", true));

  subs.forEach(sub => {
    subCategoryBar.appendChild(createSubCategoryBtn(sub.name, sub.id));
  });
}

function createSubCategoryBtn(label, id, forceActive = false) {
  const div = document.createElement("div");
  div.className =
    "subcategory-pill" +
    ((activeSubCategory === id || forceActive) ? " active" : "");

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

async function loadFrontendTags() {
  if (!tagRow) return;

  const snap = await getDocs(collection(db, "tags"));
  allTags = snap.docs.map(d => d.data());

  renderTags();
}

function renderTags() {
  tagRow.innerHTML = "";
  tagRow.appendChild(createTagChip("All", "all", true));

  allTags.forEach(tag => {
    tagRow.appendChild(createTagChip(tag.name, tag.slug));
  });
}

function createTagChip(label, slug, forceActive = false) {
  const chip = document.createElement("div");
  chip.className =
    "tag-chip" +
    ((activeTag === slug || forceActive) ? " active" : "");

  chip.innerText = label;

  chip.onclick = () => {
    activeTag = slug;

    document
      .querySelectorAll(".tag-chip")
      .forEach(t => t.classList.remove("active"));

    chip.classList.add("active");
    renderProducts();
  };

  return chip;
}

/* ================= PRODUCT FILTER ================= */

function renderProducts() {
  grid.innerHTML = "";

  const filtered = allProducts.filter(p => {
    // CATEGORY LOGIC
    if (activeCategory !== "all") {
      if (p.categoryId !== activeCategory) return false;
    }

    // SUB CATEGORY LOGIC
    if (activeSubCategory !== "all") {
      if (p.subCategoryId !== activeSubCategory) return false;
    }

    // TAG LOGIC
    if (activeTag !== "all") {
      if (!Array.isArray(p.tags) || !p.tags.includes(activeTag)) return false;
    }

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
      <div class="img-wrap">
        ${p.tags?.includes("bestseller") ? `<span class="badge">🔥 Bestseller</span>` : ""}
        <img src="${p.images?.[0] || ""}">
      </div>
      <div class="info">
        <h4>${p.name}</h4>
        <p>₹${p.basePrice}</p>
      </div>
    `;

    card.onclick = () => {
      location.href = \`product.html?id=\${p.id}\`;
    };

    grid.appendChild(card);
  });
}

/* ================= INIT ================= */

(async function init() {
  await loadProducts();
  await loadCategories();
  await loadFrontendTags();

  renderMainCategories();   // 🔥 CRITICAL
  renderProducts();         // 🔥 SHOW PRODUCTS ON LOAD
})();