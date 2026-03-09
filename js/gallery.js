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

const fileInput = document.getElementById("fileInput");
const folderInput = document.getElementById("folderInput");

const processPopup = document.getElementById("processPopup");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const processTitle = document.getElementById("processTitle");

const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewerImg");

let currentFolder = "";
let selected = [];


/* ================= PROCESS POPUP ================= */

function showProcess(title){
processTitle.innerText = title;
progressFill.style.width = "0%";
progressText.innerText = "0%";
processPopup.classList.remove("hidden");
}

function updateProgress(percent){
progressFill.style.width = percent+"%";
progressText.innerText = Math.round(percent)+"%";
}

function hideProcess(){
processPopup.classList.add("hidden");
}


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

const folderRef = ref(storage,path);
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
<div>${decodeURIComponent(f.name)}</div>
`;

const check = card.querySelector("input");

check.onchange = ()=> toggleSelect(card,check.checked);

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

check.onchange = ()=> toggleSelect(card,check.checked);

card.querySelector("img").onclick = ()=> openViewer(url);

grid.appendChild(card);

}

}

loadGallery();


/* ================= SELECT ================= */

function toggleSelect(card,checked){

const refPath = card.dataset.ref;
const isFolder = card.dataset.type === "folder";

if(checked){
selected.push({path:refPath,isFolder});
}else{
selected = selected.filter(i=>i.path!==refPath);
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

showProcess("Deleting Files");

let count = 0;

for(const item of selected){

if(item.isFolder){
await deleteFolder(item.path);
}else{
await deleteObject(ref(storage,item.path));
}

count++;
updateProgress((count/selected.length)*100);

}

hideProcess();
selected=[];
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

const cleanName = name.replace(/[^\w\-]/g,"_");

const path = currentFolder
? `product-images/${currentFolder}/${cleanName}/.keep`
: `product-images/${cleanName}/.keep`;

await uploadBytes(ref(storage,path),new Blob(["folder"]));

loadGallery(currentFolder);

};


/* ================= UPLOAD IMAGES ================= */

fileInput.addEventListener("change", async (e)=>{

const files = Array.from(e.target.files);
if(!files.length) return;

showProcess("Uploading Images");

let count = 0;

for(const file of files){

const path = currentFolder
? `product-images/${currentFolder}/${file.name}`
: `product-images/${file.name}`;

await uploadBytes(ref(storage,path),file);

count++;
updateProgress((count/files.length)*100);

}

hideProcess();
loadGallery(currentFolder);

});


/* ================= UPLOAD FOLDER (FIXED) ================= */

folderInput.addEventListener("change", async (e)=>{

const files = Array.from(e.target.files);
if(!files.length) return;

showProcess("Uploading Folder");

let count = 0;

/* detect selected top folder */
const rootFolder = files[0].webkitRelativePath.split("/")[0];

for(const file of files){

let relativePath = file.webkitRelativePath;

/* remove unwanted parent folders */
if(relativePath.includes(rootFolder)){
relativePath = relativePath.substring(relativePath.indexOf(rootFolder));
}

/* sanitize */
relativePath = relativePath.replace(/[^\w\-\/\.]/g,"_");

const path = currentFolder
? `product-images/${currentFolder}/${relativePath}`
: `product-images/${relativePath}`;

await uploadBytes(ref(storage,path),file);

count++;
updateProgress((count/files.length)*100);

}

hideProcess();
loadGallery(currentFolder);

});


/* ================= BREADCRUMBS ================= */

function updateBreadcrumbs(){

breadcrumbs.innerHTML="";

const parts = currentFolder.split("/").filter(Boolean);

const root = document.createElement("span");
root.innerText = "Home";
root.style.cursor="pointer";
root.onclick = ()=> loadGallery("");

breadcrumbs.appendChild(root);

parts.forEach((p,index)=>{

const span = document.createElement("span");

span.innerText = " / " + decodeURIComponent(p);
span.style.cursor="pointer";

const folderPath = parts.slice(0,index+1).join("/");

span.onclick = ()=> loadGallery(folderPath);

breadcrumbs.appendChild(span);

});

}


/* ================= IMAGE VIEWER ================= */

function openViewer(url){
viewer.style.display="flex";
viewerImg.src = url;
}

window.closeViewer = ()=>{
viewer.style.display="none";
};