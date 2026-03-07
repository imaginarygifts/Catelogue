import { storage } from "./firebase.js";

import {
ref,
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
const progressBar = document.getElementById("progressBar");


let currentFolder = "";
let selectedItems = [];


/* LOAD FOLDERS FOR DROPDOWN */

async function loadFolderDropdown(){

folderSelect.innerHTML=`<option value="">Select Folder</option>`;

const rootRef=ref(storage,"product-images");

const res=await listAll(rootRef);

res.prefixes.forEach(f=>{

const opt=document.createElement("option");

opt.value=f.name;
opt.innerText=f.name;

folderSelect.appendChild(opt);

});

}

loadFolderDropdown();


/* LOAD GALLERY */

async function loadGallery(folder=""){

currentFolder=folder;
selectedItems=[];
toolbar.style.display="none";

grid.innerHTML="";

updateBreadcrumbs();

const path=folder?`product-images/${folder}`:"product-images";

const folderRef=ref(storage,path);

const res=await listAll(folderRef);


/* FOLDERS */

res.prefixes.forEach(f=>{

const card=document.createElement("div");
card.className="folderCard";

card.innerHTML=`
<input type="checkbox">
<div class="folderIcon">📁</div>
<div>${f.name}</div>
`;

card.querySelector("input").onchange=e=>{

toggleSelect(f,e.target.checked,true);

};

card.onclick=(e)=>{

if(e.target.tagName!=="INPUT"){
loadGallery(f.fullPath.replace("product-images/",""));
}

};

grid.appendChild(card);

});


/* IMAGES */

for(const file of res.items){

const url=await getDownloadURL(file);

const card=document.createElement("div");

card.className="imageCard";

card.innerHTML=`
<input type="checkbox">
<img src="${url}">
`;

card.querySelector("img").onclick=()=>openViewer(url);

card.querySelector("input").onchange=e=>{

toggleSelect(file,e.target.checked,false);

};

grid.appendChild(card);

}

}

loadGallery();



/* SELECT */

function toggleSelect(item,checked,isFolder){

if(checked){

selectedItems.push({item,isFolder});

}else{

selectedItems=selectedItems.filter(i=>i.item!==item);

}

toolbar.style.display=selectedItems.length?"flex":"none";

}



/* DELETE */

window.deleteSelected=async()=>{

if(!confirm("Delete selected items?"))return;

for(const obj of selectedItems){

if(!obj.isFolder){

await deleteObject(obj.item);

}

}

selectedItems=[];
loadGallery(currentFolder);

};



/* MOVE */

window.moveSelected=async()=>{

const folder=prompt("Move to folder name");

if(!folder)return;

for(const obj of selectedItems){

if(!obj.isFolder){

const url=await getDownloadURL(obj.item);

const res=await fetch(url);

const blob=await res.blob();

const newRef=ref(storage,"product-images/"+folder+"/"+obj.item.name);

await uploadBytes(newRef,blob);

await deleteObject(obj.item);

}

}

selectedItems=[];
loadGallery();

};



/* UPLOAD */

window.uploadFiles=async()=>{

const files=document.getElementById("fileInput").files;

if(!files.length)return;

let count=0;

for(const file of files){

if(file.name.endsWith(".zip")){

await handleZip(file);

}else{

await uploadImage(file);

}

count++;

updateProgress(count/files.length*100);

}

setTimeout(()=>updateProgress(0),800);

loadGallery(currentFolder);

};



function updateProgress(val){

progressBar.style.width=val+"%";

}



/* IMAGE UPLOAD */

async function uploadImage(file){

const folder=folderSelect.value;

const path=folder?`${folder}/${file.name}`:file.name;

const storageRef=ref(storage,"product-images/"+path);

await uploadBytes(storageRef,file);

}



/* ZIP */

async function handleZip(zipFile){

const zip=await JSZip.loadAsync(zipFile);

for(const name in zip.files){

const file=zip.files[name];

if(!file.dir){

const blob=await file.async("blob");

await uploadImage(new File([blob],name));

}

}

}



/* VIEWER */

function openViewer(url){

viewer.style.display="flex";

viewerImg.src=url;

}

window.closeViewer=()=>viewer.style.display="none";



/* BREADCRUMBS */

function updateBreadcrumbs(){

breadcrumbs.innerHTML="";

const parts=currentFolder.split("/").filter(Boolean);

let path="";

const root=document.createElement("span");

root.innerText="Home";

root.onclick=()=>loadGallery("");

breadcrumbs.appendChild(root);

parts.forEach(p=>{

path+=p+"/";

const span=document.createElement("span");

span.innerText=" / "+p;

span.onclick=()=>loadGallery(path.slice(0,-1));

breadcrumbs.appendChild(span);

});

}



/* CREATE FOLDER */

window.createFolder=async()=>{

const name=prompt("Folder name");

if(!name)return;

const refPath=ref(storage,"product-images/"+name+"/.keep");

await uploadBytes(refPath,new Blob());

loadFolderDropdown();
loadGallery();

};



window.goBack=()=>history.back();