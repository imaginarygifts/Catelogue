import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const grid = document.getElementById("productGrid");
const categoryBar = document.getElementById("categoryBar");
const tagRow = document.getElementById("tagFilterRow");
const subCategoryBar = document.getElementById("subCategoryBar"); // 🔥 ADD THIS IN HTML

let allProducts = [];
let allCategories = [];
let mainCategories = [];
let subCategories = [];

let activeCategory = "all";     // main category
let activeSubCategory = "all";  // sub category
let activeTag = "all";

/* ================= PRODUCTS ================= */

async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ================= CATEGORIES ================= */

async function loadCategories() {
  const snap = await getDocs(
    query(collection(db, "categories"), orderBy("order"))
  );

  allCategories = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  mainCategories = allCategories.filter(c => !c.parentId);
  subCategories = allCategories.filter(c => c.parentId);

  renderMainCategories();
}

/* ================= MAIN CATEGORY BAR ================= */

function renderMainCategories() {
  categoryBar.innerHTML = "";
  subCategoryBar.innerHTML = "";

  categoryBar.appendChild(createMainCategoryBtn("All", "all"));

  mainCategories.forEach(cat => {
    categoryBar.appendChild(createMainCategoryBtn(cat.name, cat.id));
  });
}

function createMainCategoryBtn(label, id) {
  const div = document.createElement("div");
  div.className = "category-pill" + (activeCategory === id ? " active" : "");
  div.innerText = label;

  div.onclick = () => {
    activeCategory = id;
    activeSubCategory = "all";

    document
      .querySelectorAll("#categoryBar .category-pill")
      .forEach(p => p.classList.remove("active"));

    div.classList.add("active");

    renderSubCategories();
    renderProducts();
  };

  return div;
}

/* ================= SUB CATEGORY BAR ================= */

function renderSubCategories() {
  subCategoryBar.innerHTML = "";

  if (activeCategory === "all") return;

  const subs = subCategories.filter(s => s.parentId === activeCategory);
  if (!subs.length) return;

  subCategoryBar.appendChild(createSubCategoryBtn("All", "all"));

  subs.forEach(sub => {
    subCategoryBar.appendChild(createSubCategoryBtn(sub.name, sub.id));
  });
}

function createSubCategoryBtn(label, id) {
  const div = document.createElement("div");
  div.className =
    "subcategory-pill" + (activeSubCategory === id ? " active" : "");
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

  allProducts.forEach(p => {
    if (!Array.isArray(p.tags)) p.tags = [];
  });

  allTags = snap.docs.map(d => d.data());
  renderTags();
}

function renderTags() {
  tagRow.innerHTML = "";
  tagRow.appendChild(createTagChip("All", "all"));

  allTags.forEach(tag => {
    tagRow.appendChild(createTagChip(tag.name, tag.slug));
  });
}

function createTagChip(label, slug) {
  const chip = document.createElement("div");
  chip.className = "tag-chip" + (activeTag === slug ? " active" : "");
  chip.innerText = label;

  chip.onclick = () => {
    activeTag = activeTag === slug ? "all" : slug;
    updateTagUI();
    renderProducts();
  };

  return chip;
}

function updateTagUI() {
  document.querySelectorAll(".tag-chip").forEach(chip => {
    chip.classList.remove("active");
    if (
      (activeTag === "all" && chip.innerText === "All") ||
      chip.innerText.toLowerCase() === activeTag
    ) {
      chip.classList.add("active");
    }
  });
}

/* ================= RENDER PRODUCTS ================= */

function renderProducts() {
  grid.innerHTML = "";

  const filtered = allProducts.filter(p => {
    const mainMatch =
      activeCategory === "all" || p.categoryId === activeCategory;

    const subMatch =
  activeSubCategory === "all" ||
  p.subCategoryId === activeSubCategory ||
  (!p.subCategoryId && p.categoryId === activeCategory);

    const tagMatch =
      activeTag === "all" ||
      (Array.isArray(p.tags) && p.tags.includes(activeTag));

    return mainMatch && subMatch && tagMatch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p class="empty">No products found</p>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const isBestseller = p.tags?.includes("bestseller");

    card.innerHTML = `
      <div class="img-wrap">
        ${isBestseller ? `<span class="badge">🔥 Bestseller</span>` : ""}
        <img src="${p.images?.[0] || ""}">
      </div>
      <div class="info">
        <h4>${p.name}</h4>
        <p>₹${p.basePrice}</p>
      </div>
    `;

    card.onclick = () => {
      location.href = `product.html?id=${p.id}`;
    };

    grid.appendChild(card);
  });
}

/* ================= INIT ================= */

(async function init() {
  await loadProducts();
  await loadCategories();
  await loadFrontendTags();
  renderProducts();
})();