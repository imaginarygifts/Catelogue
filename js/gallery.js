import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
listAll,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");


/* LOAD GALLERY */

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



/* ZIP UPLOAD */

window.uploadZipImages = async ()=>{

const zipFile = document.getElementById("zipUpload").files[0];

if(!zipFile){
alert("Please select ZIP file");
return;
}

const zip = await JSZip.loadAsync(zipFile);

for(const fileName in zip.files){

const file = zip.files[fileName];

if(!file.dir){

const blob = await file.async("blob");

/* upload path */

const storageRef = ref(storage,"product-images/"+fileName);

await uploadBytes(storageRef,blob);

}

}

alert("Images uploaded successfully");

loadGallery();

};