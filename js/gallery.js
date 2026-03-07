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


let currentFolder = "";

let selectedImages = [];


/* LOAD FOLDERS */

async function loadFolders(){

folderSelect.innerHTML = `<option value="">Root</option>`;

const rootRef = ref(storage,"product-images");

const res = await listAll(rootRef);

res.prefixes.forEach(f=>{

const opt=document.createElement("option");

opt.value=f.name;

opt.innerText=f.name;

folderSelect.appendChild(opt);

});

}

loadFolders();



/* LOAD GALLERY */

async function loadGallery(folder=""){

currentFolder=folder;

grid.innerHTML="";

const path=folder?`product-images/${folder}`:"product-images";

const folderRef=ref(storage,path);

const res=await listAll(folderRef);


/* SHOW FOLDERS */

res.prefixes.forEach(f=>{

const box=document.createElement("div");

box.className="folder";

box.innerText="📁 "+f.name;

box.onclick=()=>loadGallery(f.fullPath.replace("product-images/",""));

grid.appendChild(box);

});


/* SHOW IMAGES */

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

if(e.target.checked){

selectedImages.push(file);

}else{

selectedImages=selectedImages.filter(i=>i!==file);

}

};

grid.appendChild(card);

}

}

loadGallery();



/* UPLOAD */

window.uploadFiles = async()=>{

const files=document.getElementById("fileInput").files;

if(!files.length)return;

for(const file of files){

if(file.name.endsWith(".zip")){

await handleZip(file);

}else{

await uploadImage(file);

}

}

loadGallery(currentFolder);

};



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



/* DELETE */

window.deleteSelected=async()=>{

if(!selectedImages.length)return;

if(!confirm("Delete selected images?"))return;

for(const file of selectedImages){

await deleteObject(file);

}

selectedImages=[];

loadGallery(currentFolder);

};



/* MOVE */

window.moveSelected=async()=>{

const folder=prompt("Move to folder:");

if(!folder)return;

for(const file of selectedImages){

const url=await getDownloadURL(file);

const res=await fetch(url);

const blob=await res.blob();

const newRef=ref(storage,"product-images/"+folder+"/"+file.name);

await uploadBytes(newRef,blob);

await deleteObject(file);

}

selectedImages=[];

loadGallery();

};



/* COPY */

window.copyLink=async()=>{

if(!selectedImages.length)return;

const url=await getDownloadURL(selectedImages[0]);

navigator.clipboard.writeText(url);

alert("Link copied");

};



/* VIEWER */

function openViewer(url){

viewer.style.display="flex";

viewerImg.src=url;

}

window.closeViewer=()=>{

viewer.style.display="none";

};



/* CREATE FOLDER */

window.createFolder=()=>{

const name=prompt("Folder name");

if(!name)return;

const refPath=ref(storage,"product-images/"+name+"/.keep");

uploadBytes(refPath,new Blob());

loadFolders();

};



window.goBack=()=>history.back();