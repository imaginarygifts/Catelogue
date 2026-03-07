import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
listAll,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");
const statusBox = document.getElementById("uploadStatus");


/* ================= LOAD ROOT GALLERY ================= */

async function loadGallery(){

const rootRef = ref(storage,"product-images");

const res = await listAll(rootRef);

grid.innerHTML="";


/* SHOW IMAGES DIRECTLY IN ROOT */

for(const file of res.items){

const url = await getDownloadURL(file);

const card=document.createElement("div");
card.className="gallery-card";

card.innerHTML=`<img src="${url}">`;

grid.appendChild(card);

}


/* SHOW FOLDERS */

for(const folder of res.prefixes){

const folderBox=document.createElement("div");

folderBox.className="gallery-folder";

folderBox.innerHTML=`📁 ${folder.name}`;

folderBox.onclick=()=>openFolder(folder);

grid.appendChild(folderBox);

}

}


loadGallery();



/* ================= OPEN FOLDER ================= */

async function openFolder(folderRef){

grid.innerHTML="";

const res=await listAll(folderRef);


/* BACK BUTTON */

const back=document.createElement("div");

back.className="gallery-back";

back.innerHTML="← Back";

back.onclick=loadGallery;

grid.appendChild(back);


/* SHOW IMAGES */

for(const file of res.items){

const url=await getDownloadURL(file);

const card=document.createElement("div");

card.className="gallery-card";

card.innerHTML=`<img src="${url}">`;

grid.appendChild(card);

}


/* SHOW SUBFOLDERS */

for(const folder of res.prefixes){

const folderBox=document.createElement("div");

folderBox.className="gallery-folder";

folderBox.innerHTML=`📁 ${folder.name}`;

folderBox.onclick=()=>openFolder(folder);

grid.appendChild(folderBox);

}

}



/* ================= UPLOAD FILES ================= */

window.startUpload = async ()=>{

const files = document.getElementById("fileInput").files;
const folder = document.getElementById("folderPath").value.trim();

if(!files.length){
alert("Select files");
return;
}

for(const file of files){

if(file.name.endsWith(".zip")){

await handleZip(file,folder);

}

else{

const path = folder
? folder + "/" + file.name
: file.name;

await uploadImage(file,path);

}

}

statusBox.innerText="Upload complete";

loadGallery();

};



/* ================= ZIP UPLOAD ================= */

async function handleZip(zipFile,folder){

statusBox.innerText="Extracting ZIP...";

const zip = await JSZip.loadAsync(zipFile);

for(const fileName in zip.files){

const file = zip.files[fileName];

if(!file.dir){

const blob = await file.async("blob");

const path = folder
? folder + "/" + fileName
: fileName;

await uploadImage(blob,path);

}

}

}



/* ================= IMAGE UPLOAD ================= */

async function uploadImage(file,path){

statusBox.innerText="Uploading " + path;

const storageRef = ref(storage,"product-images/"+path);

await uploadBytes(storageRef,file);

}