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


/* LOAD GALLERY */

async function loadGallery(folder=""){

currentFolder = folder;
selected=[];

deleteBtn.style.display="none";

grid.innerHTML="";

updateBreadcrumbs();

const path = folder
? `product-images/${folder}`
: "product-images";

const folderRef = ref(storage,path);

const res = await listAll(folderRef);


/* SHOW FOLDERS */

res.prefixes.forEach(f=>{

const card=document.createElement("div");

card.className="folderCard";

card.innerHTML=`

<input type="checkbox" class="itemCheck">

<div class="folderIcon">📁</div>

<div>${f.name}</div>

`;

const check = card.querySelector("input");

check.onchange=()=>{
toggleSelect(f,true,check.checked);
};

card.onclick=e=>{

if(e.target.type==="checkbox") return;

const folderPath =
f.fullPath.replace("product-images/","");

loadGallery(folderPath);

};

grid.appendChild(card);

});


/* SHOW IMAGES */

for(const file of res.items){

const url = await getDownloadURL(file);

const card=document.createElement("div");

card.className="imageCard";

card.innerHTML=`

<input type="checkbox" class="itemCheck">

<img src="${url}">

`;

const check = card.querySelector("input");

check.onchange=()=>{
toggleSelect(file,false,check.checked);
};

card.querySelector("img").onclick=()=>openViewer(url);

grid.appendChild(card);

}

}

loadGallery();



/* SELECT LOGIC */

function toggleSelect(item,isFolder,checked){

if(checked){

selected.push({item,isFolder});

}else{

selected = selected.filter(i=>i.item!==item);

}

deleteBtn.style.display =
selected.length ? "block" : "none";

}



/* SELECT ALL */

selectAll.onchange=()=>{

document.querySelectorAll(".itemCheck")
.forEach(c=>{

c.checked=selectAll.checked;

});

};



/* DELETE */

window.deleteSelected = async ()=>{

if(!confirm("Delete selected items?")) return;

for(const obj of selected){

if(obj.isFolder){

await deleteFolder(obj.item.fullPath);

}else{

await deleteObject(obj.item);

}

}

loadGallery(currentFolder);

};



/* DELETE FOLDER RECURSIVE */

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



/* CREATE FOLDER */

window.createFolder = async ()=>{

const name = prompt("Folder name");

if(!name) return;

const path = currentFolder
? `product-images/${currentFolder}/${name}/.keep`
: `product-images/${name}/.keep`;

await uploadBytes(ref(storage,path),new Blob(["folder"]));

loadGallery(currentFolder);

};



/* UPLOAD */

document.getElementById("fileInput")
.addEventListener("change",async e=>{

for(const file of e.target.files){

const path = currentFolder
? `product-images/${currentFolder}/${file.name}`
: `product-images/${file.name}`;

await uploadBytes(ref(storage,path),file);

}

loadGallery(currentFolder);

});



/* BREADCRUMBS */

function updateBreadcrumbs(){

breadcrumbs.innerHTML="";

const parts=currentFolder.split("/").filter(Boolean);

const root=document.createElement("span");

root.innerText="Home";

root.onclick=()=>loadGallery("");

breadcrumbs.appendChild(root);

parts.forEach((p,index)=>{

const span=document.createElement("span");

span.innerText=" / "+p;

const path=parts.slice(0,index+1).join("/");

span.onclick=()=>loadGallery(path);

breadcrumbs.appendChild(span);

});

}



/* VIEWER */

function openViewer(url){

document.getElementById("viewer").style.display="flex";

document.getElementById("viewerImg").src=url;

}

window.closeViewer=()=>{
document.getElementById("viewer").style.display="none";
};