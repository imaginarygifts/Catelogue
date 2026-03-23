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
let searchQuery = ""; // ✅ NEW





window.toggleSidebar = function () {
  document.getElementById("sidebar")?.classList.toggle("active");
  document.getElementById("overlay")?.classList.toggle("active");
};





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
  const tags = snap.docs.map(d => d.data());

  renderTags(tags);
}

/* ================= CATEGORY UI ================= */

function renderMainCategories() {

  if (!categoryBar) return;

  categoryBar.innerHTML = "";
  if (subCategoryBar) subCategoryBar.innerHTML = "";

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
  allChip.dataset.slug = "all";

  allChip.onclick = () => {
    activeTag = "all";
    updateTagUI();
    renderProducts();
  };

  tagRow.appendChild(allChip);

  tags.forEach(tag => {

    const chip = document.createElement("div");

    chip.className =
      "tag-chip" + (activeTag === tag.slug ? " active" : "");

    chip.innerText = tag.name;
    chip.dataset.slug = tag.slug;

    chip.onclick = () => {
      activeTag = tag.slug;
      updateTagUI();
      renderProducts();
    };

    tagRow.appendChild(chip);

  });

}

function updateTagUI() {

  document.querySelectorAll(".tag-chip").forEach(chip => {

    chip.classList.remove("active");

    if (chip.dataset.slug === activeTag) {
      chip.classList.add("active");
    }

  });

}

/* ================= PRODUCT RENDER ================= */

function renderProducts() {

  if (!grid) return;

  grid.innerHTML = "";

  const filtered = allProducts.filter(p => {

    if (
      activeCategory !== "all" &&
      p.categoryId !== activeCategory
    ) return false;

    if (activeSubCategory !== "all") {
      if (p.subCategoryId !== activeSubCategory) return false;
    }

    if (
      activeTag !== "all" &&
      (!Array.isArray(p.tags) || !p.tags.includes(activeTag))
    ) return false;

    // ✅ SEARCH FILTER
    if (
      searchQuery &&
      !(
        p.name.toLowerCase().includes(searchQuery) ||
        p.description?.toLowerCase().includes(searchQuery)
      )
    ) return false;

    return true;

  });

  if (!filtered.length) {
    grid.innerHTML = `<p class="empty">No products found</p>`;
    return;
  }

  filtered.forEach(p => {

    const card = document.createElement("div");
    card.className = "product-card";

    /* ===== BADGES ===== */

    const isBestseller =
      p.isBestseller === true ||
      p.isBestseller === "true" ||
      (Array.isArray(p.tags) && p.tags.includes("bestseller"));

    const outOfStock = p.inStock === false;

    let discount = 0;

    if (p.salePrice && p.basePrice && p.salePrice < p.basePrice) {
      discount = Math.round(
        ((p.basePrice - p.salePrice) / p.basePrice) * 100
      );
    }

    let badges = "";

    if (isBestseller) {
      badges += `<span class="badge bestseller">🔥 Bestseller</span>`;
    }

    if (discount > 0) {
      badges += `<span class="badge discount">-${discount}%</span>`;
    }

    if (outOfStock) {
      badges += `<span class="badge stock">Out of Stock</span>`;
    }

    /* ===== CARD HTML ===== */

    card.innerHTML = `
      <div class="img-wrap">
        ${badges}
        <img loading="lazy" src="${p.images?.[0] || ""}">
      </div>

      <h4>${p.name}</h4>

      <div class="price-wrap">
        ${
          p.salePrice && p.salePrice < p.basePrice
          ? `<span class="sale">₹${p.salePrice}</span>
             <span class="old">₹${p.basePrice}</span>`
          : `<span class="sale">₹${p.basePrice}</span>`
        }
      </div>
    `;

    card.onclick = () => {
      location.href = `product?id=${p.id}`;
    };

    grid.appendChild(card);

  });

}

/* ================= INIT ================= */

(async function init() {

  console.log("✅ store.js updated with search");

  await loadProducts();
  await loadCategories();
  await loadTags();

  renderMainCategories();
  renderProducts();

  // ✅ SEARCH LISTENER
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchQuery = this.value.toLowerCase();
      renderProducts();
    });
  }

})();