import { storage } from "./firebase.js";

import {
ref,
uploadBytes,
listAll,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const grid = document.getElementById("galleryGrid");
const breadcrumbs = document.getElementById("breadcrumbs");

let currentFolder = "";


/* LOAD GALLERY */

async function loadGallery(folder=""){

currentFolder = folder;

grid.innerHTML="";

updateBreadcrumbs();

const path = folder
? `product-images/${folder}`
: "product-images";

const folderRef = ref(storage,path);

const res = await listAll(folderRef);


/* SHOW FOLDERS */

res.prefixes.forEach(f=>{

const card = document.createElement("div");

card.className="folderCard";

card.innerHTML=`
<div class="folderIcon">📁</div>
<div>${f.name}</div>
`;

card.onclick=()=>{

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

card.innerHTML=`<img src="${url}">`;

card.onclick=()=>openViewer(url);

grid.appendChild(card);

}

}

loadGallery();



/* CREATE FOLDER */

window.createFolder = async ()=>{

const name = prompt("Folder name");

if(!name) return;

const path = currentFolder
? `product-images/${currentFolder}/${name}/.keep`
: `product-images/${name}/.keep`;

const folderRef = ref(storage,path);

await uploadBytes(folderRef,new Blob(["folder"]));

loadGallery(currentFolder);

};



/* IMAGE UPLOAD */

document.getElementById("fileInput").addEventListener("change",async e=>{

const files = e.target.files;

for(const file of files){

const path = currentFolder
? `product-images/${currentFolder}/${file.name}`
: `product-images/${file.name}`;

const fileRef = ref(storage,path);

await uploadBytes(fileRef,file);

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

const folderPath =
parts.slice(0,index+1).join("/");

span.onclick=()=>loadGallery(folderPath);

breadcrumbs.appendChild(span);

});

}



/* VIEWER */

function openViewer(url){

const viewer=document.getElementById("viewer");

viewer.style.display="flex";

document.getElementById("viewerImg").src=url;

}

window.closeViewer = ()=>{
document.getElementById("viewer").style.display="none";
};