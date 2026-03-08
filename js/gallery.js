import { storage } from "./firebase.js";

import {
ref,
uploadBytesResumable,
uploadBytes,
listAll,
getDownloadURL,
deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");
const viewer = document.getElementById("viewer");
const viewerImg = document.getElementById("viewerImg");

const folderSelect = document.getElementById("folderSelect");
const breadcrumbs = document.getElementById("breadcrumbs");
const toolbar = document.getElementById("toolbar");

const uploadPopup = document.getElementById("uploadPopup");
const progressBar = document.getElementById("uploadProgressBar");
const progressText = document.getElementById("uploadPercent");

let currentFolder = "";
let selectedItems = [];


/* ================= LOAD ROOT FOLDERS ================= */

async function loadFolderDropdown(){

folderSelect.innerHTML = `<option value="">Select Folder</option>`;

const rootRef = ref(storage,"product-images");

const res = await listAll(rootRef);

res.prefixes.forEach(f=>{

const opt=document.createElement("option");

opt.value=f.name;
opt.innerText=f.name;

folderSelect.appendChild(opt);

});

}

loadFolderDropdown();



/* ================= LOAD GALLERY ================= */

async function loadGallery(folder=""){

currentFolder = folder;

selectedItems = [];

toolbar.style.display="none";

grid.innerHTML="";

updateBreadcrumbs();

const path = folder ? `product-images/${folder}` : "product-images";

const folderRef = ref(storage,path);

const res = await listAll(folderRef);


/* ===== SHOW SUB FOLDERS ===== */

res.prefixes.forEach(f=>{

const card = document.createElement("div");

card.className="folderCard";

card.innerHTML = `
<input type="checkbox">
<div class="folderIcon">📁</div>
<div>${f.name}</div>
`;

card.querySelector("input").onchange = e=>{
toggleSelect(f,e.target.checked,true);
};

card.onclick = e=>{

if(e.target.tagName==="INPUT") return;

const folderPath = f.fullPath.replace("product-images/","");

loadGallery(folderPath);

};

grid.appendChild(card);

});


/* ===== SHOW IMAGES ===== */

for(const file of res.items){

const url = await getDownloadURL(file);

const card = document.createElement("div");

card.className="imageCard";

card.innerHTML = `
<input type="checkbox">
<img src="${url}">
`;

card.querySelector("img").onclick = ()=>openViewer(url);

card.querySelector("input").onchange = e=>{
toggleSelect(file,e.target.checked,false);
};

grid.appendChild(card);

}

}

loadGallery();



/* ================= SELECT ================= */

function toggleSelect(item,checked,isFolder){

if(checked){

selectedItems.push({item,isFolder});

}else{

selectedItems = selectedItems.filter(i=>i.item!==item);

}

toolbar.style.display = selectedItems.length ? "flex" : "none";

}



/* ================= DELETE ================= */

window.deleteSelected = async ()=>{

if(!confirm("Delete selected items?")) return;

for(const obj of selectedItems){

if(obj.isFolder){

await deleteFolderRecursive(obj.item.fullPath);

}else{

await deleteObject(obj.item);

}

}

selectedItems=[];

loadGallery(currentFolder);

};



/* ================= DELETE FOLDER RECURSIVE ================= */

async function deleteFolderRecursive(path){

const folderRef = ref(storage,path);

const res = await listAll(folderRef);

for(const file of res.items){

await deleteObject(file);

}

for(const sub of res.prefixes){

await deleteFolderRecursive(sub.fullPath);

}

}



/* ================= UPLOAD ================= */

window.uploadFiles = async ()=>{

const files=document.getElementById("fileInput").files;

if(!files.length) return;

uploadPopup.style.display="flex";

for(const file of files){

if(file.name.endsWith(".zip")){

await handleZip(file);

}else{

await uploadImage(file);

}

}

uploadPopup.style.display="none";

loadGallery(currentFolder);

};



/* ================= IMAGE UPLOAD ================= */

async function uploadImage(file){

const path = currentFolder
? `product-images/${currentFolder}/${file.name}`
: `product-images/${file.name}`;

const storageRef = ref(storage,path);

const uploadTask = uploadBytesResumable(storageRef,file);

return new Promise((resolve,reject)=>{

uploadTask.on(

"state_changed",

snapshot=>{

const progress = (snapshot.bytesTransferred/snapshot.totalBytes)*100;

progressBar.style.width = progress+"%";

progressText.innerText = Math.round(progress)+"%";

},

reject,

resolve

);

});

}



/* ================= ZIP UPLOAD ================= */

async function handleZip(zipFile){

const zip = await JSZip.loadAsync(zipFile);

for(const name in zip.files){

const file = zip.files[name];

if(!file.dir){

const blob = await file.async("blob");

await uploadImage(new File([blob],name));

}

}

}



/* ================= VIEW IMAGE ================= */

function openViewer(url){

viewer.style.display="flex";

viewerImg.src=url;

}

window.closeViewer = ()=> viewer.style.display="none";



/* ================= BREADCRUMBS ================= */

function updateBreadcrumbs(){

breadcrumbs.innerHTML="";

const parts = currentFolder.split("/").filter(Boolean);

const root=document.createElement("span");

root.innerText="Home";

root.className="crumb";

root.onclick=()=>loadGallery("");

breadcrumbs.appendChild(root);

parts.forEach((p,index)=>{

const span=document.createElement("span");

span.className="crumb";

span.innerText=" / "+p;

const folderPath=parts.slice(0,index+1).join("/");

span.onclick=()=>loadGallery(folderPath);

breadcrumbs.appendChild(span);

});

}



/* ================= CREATE FOLDER ================= */

window.createFolder = async ()=>{

const name = prompt("Folder name");

if(!name) return;

const path = currentFolder
? `product-images/${currentFolder}/${name}/.keep`
: `product-images/${name}/.keep`;

const refPath = ref(storage,path);

await uploadBytes(refPath,new Blob(["folder"]));

loadGallery(currentFolder);

loadFolderDropdown();

};



window.goBack = ()=>history.back();