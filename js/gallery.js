import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
listAll,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");
const statusBox = document.getElementById("uploadStatus");


/* ================= LOAD GALLERY ================= */

async function loadGallery(){

const folderRef = ref(storage,"product-images");

const res = await listAll(folderRef);

grid.innerHTML="";

for(const folder of res.prefixes){

const subRes = await listAll(folder);

for(const item of subRes.items){

const url = await getDownloadURL(item);

const card = document.createElement("div");

card.className="gallery-card";

card.innerHTML=`<img src="${url}">`;

grid.appendChild(card);

}

}

}

loadGallery();



/* ================= START UPLOAD ================= */

window.startUpload = async ()=>{

const files = document.getElementById("fileInput").files;
const folder = document.getElementById("folderPath").value.trim();

if(!files.length){
alert("Select files");
return;
}

statusBox.innerText="Preparing files...";

for(const file of files){

/* ZIP FILE */

if(file.name.endsWith(".zip")){

await handleZip(file,folder);

}

/* NORMAL IMAGE */

else{

await uploadImage(file,folder+"/"+file.name);

}

}

statusBox.innerText="Upload complete";

loadGallery();

};



/* ================= ZIP HANDLER ================= */

async function handleZip(zipFile,folder){

statusBox.innerText="Extracting ZIP...";

const zip = await JSZip.loadAsync(zipFile);

for(const fileName in zip.files){

const file = zip.files[fileName];

if(!file.dir){

const blob = await file.async("blob");

const path = folder + "/" + fileName;

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