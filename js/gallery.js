import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
listAll,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");


async function loadGallery(){

const folderRef = ref(storage,"product-images");

const res = await listAll(folderRef);

grid.innerHTML="";

for(const folder of res.prefixes){

const folderRes = await listAll(folder);

for(const item of folderRes.items){

const url = await getDownloadURL(item);

const card = document.createElement("div");
card.className="gallery-card";

card.innerHTML=`<img src="${url}">`;

grid.appendChild(card);

}

}

}

loadGallery();



window.uploadGalleryImages = async ()=>{

const files = document.getElementById("galleryUpload").files;
const folder = document.getElementById("folderName").value;

if(!folder){
alert("Enter folder name");
return;
}

for(const file of files){

const fileRef = ref(storage,`product-images/${folder}/${file.name}`);

await uploadBytes(fileRef,file);

}

alert("Uploaded");

loadGallery();

};