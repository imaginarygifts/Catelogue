import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
listAll,
getDownloadURL,
deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");
const breadcrumbs = document.getElementById("breadcrumbs");
const deleteBtn = document.getElementById("deleteBtn");
const selectAll = document.getElementById("selectAll");

let currentFolder = "";
let selected = [];


/* ================= LOAD GALLERY ================= */

async function loadGallery(folder=""){

currentFolder = folder;

selected = [];

deleteBtn.style.display = "none";

selectAll.checked = false;

grid.innerHTML = "";

updateBreadcrumbs();

const path = folder
? `product-images/${folder}`
: "product-images";

const folderRef = ref(storage, path);

const res = await listAll(folderRef);


/* ===== SHOW FOLDERS ===== */

res.prefixes.forEach(f=>{

const card = document.createElement("div");

card.className = "folderCard";

card.dataset.ref = f.fullPath;

card.dataset.type = "folder";

card.innerHTML = `
<input type="checkbox" class="itemCheck">
<div class="folderIcon">📁</div>
<div>${f.name}</div>
`;

const check = card.querySelector("input");

check.onchange = () => toggleSelect(card, check.checked);

card.onclick = (e)=>{

if(e.target.type==="checkbox") return;

const folderPath = f.fullPath.replace("product-images/","");

loadGallery(folderPath);

};

grid.appendChild(card);

});


/* ===== SHOW IMAGES ===== */

for(const file of res.items){

const url = await getDownloadURL(file);

const card = document.createElement("div");

card.className = "imageCard";

card.dataset.ref = file.fullPath;

card.dataset.type = "image";

card.innerHTML = `
<input type="checkbox" class="itemCheck">
<img src="${url}">
`;

const check = card.querySelector("input");

check.onchange = () => toggleSelect(card, check.checked);

card.querySelector("img").onclick = () => openViewer(url);

grid.appendChild(card);

}

}

loadGallery();



/* ================= SELECT ================= */

function toggleSelect(card, checked){

const refPath = card.dataset.ref;

const isFolder = card.dataset.type === "folder";

if(checked){

selected.push({path:refPath,isFolder});

}else{

selected = selected.filter(i => i.path !== refPath);

}

deleteBtn.style.display = selected.length ? "block" : "none";

}



/* ================= SELECT ALL ================= */

selectAll.onchange = ()=>{

selected = [];

document.querySelectorAll(".itemCheck").forEach((checkbox)=>{

checkbox.checked = selectAll.checked;

const card = checkbox.closest(".folderCard, .imageCard");

const path = card.dataset.ref;

const isFolder = card.dataset.type === "folder";

if(selectAll.checked){

selected.push({path,isFolder});

}

});

deleteBtn.style.display = selected.length ? "block" : "none";

};



/* ================= DELETE ================= */

window.deleteSelected = async ()=>{

if(!selected.length) return;

if(!confirm("Delete selected items?")) return;

for(const item of selected){

if(item.isFolder){

await deleteFolder(item.path);

}else{

await deleteObject(ref(storage,item.path));

}

}

selected = [];

loadGallery(currentFolder);

};



/* ================= DELETE FOLDER ================= */

async function deleteFolder(path){

const folderRef = ref(storage,path);

const res = await listAll(folderRef);

for(const file of res.items){

await deleteObject(file);

}

for(const sub of res.prefixes){

await deleteFolder(sub.fullPath);

}

}



/* ================= CREATE FOLDER ================= */

window.createFolder = async ()=>{

const name = prompt("Folder name");

if(!name) return;

const path = currentFolder
? `product-images/${currentFolder}/${name}/.keep`
: `product-images/${name}/.keep`;

await uploadBytes(ref(storage,path),new Blob(["folder"]));

loadGallery(currentFolder);

};



/* ================= UPLOAD IMAGES ================= */

document.getElementById("fileInput").addEventListener("change", async (e)=>{

const files = e.target.files;

for(const file of files){

const path = currentFolder
? `product-images/${currentFolder}/${file.name}`
: `product-images/${file.name}`;

await uploadBytes(ref(storage,path),file);

}

loadGallery(currentFolder);

});



/* ================= BREADCRUMBS ================= */

function updateBreadcrumbs(){

breadcrumbs.innerHTML = "";

const parts = currentFolder.split("/").filter(Boolean);

const root = document.createElement("span");

root.innerText = "Home";

root.style.cursor = "pointer";

root.onclick = ()=> loadGallery("");

breadcrumbs.appendChild(root);

parts.forEach((p,index)=>{

const span = document.createElement("span");

span.innerText = " / " + p;

span.style.cursor = "pointer";

const folderPath = parts.slice(0,index+1).join("/");

span.onclick = ()=> loadGallery(folderPath);

breadcrumbs.appendChild(span);

});

}



/* ================= IMAGE VIEWER ================= */

function openViewer(url){

document.getElementById("viewer").style.display="flex";

document.getElementById("viewerImg").src = url;

}

window.closeViewer = ()=>{

document.getElementById("viewer").style.display="none";

};