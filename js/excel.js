import { db } from "./firebase.js";
import {
collection,
getDocs,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const fileInput = document.getElementById("excelUpload");

/* ================= DOWNLOAD TEMPLATE ================= */

window.downloadTemplate = () => {

const data = [
{
name:"",
description:"",
basePrice:"",
categoryId:"",
subCategoryId:"",
images:"",
tags:"",
colors:"",
sizes:"",
customOptions:"",
bestseller:"false"
}
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb, ws, "products");

XLSX.writeFile(wb,"product-template.xlsx");

};

/* ================= EXPORT PRODUCTS ================= */

window.exportProducts = async () => {

const snap = await getDocs(collection(db,"products"));

const rows = [];

snap.forEach(doc=>{

const p = doc.data();

rows.push({

name:p.name,
description:p.description,
basePrice:p.basePrice,
categoryId:p.categoryId || "",
subCategoryId:p.subCategoryId || "",
images:(p.images || []).join(","),
tags:(p.tags || []).join(","),

colors:(p.variants?.colors || [])
.map(c=>`${c.name}|${c.price}|${c.required}`)
.join(";"),

sizes:(p.variants?.sizes || [])
.map(s=>`${s.name}|${s.price}|${s.required}`)
.join(";"),

customOptions:(p.customOptions || [])
.map(o=>`${o.type}|${o.label}|${o.price}|${o.required}`)
.join(";"),

bestseller:p.bestseller || false

});

});

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"products");

XLSX.writeFile(wb,"products-export.xlsx");

};

/* ================= UPLOAD EXCEL ================= */

fileInput.addEventListener("change", async (e)=>{

const file = e.target.files[0];

const reader = new FileReader();

reader.onload = async (evt)=>{

const data = new Uint8Array(evt.target.result);

const workbook = XLSX.read(data,{type:"array"});

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(sheet);

for(const r of rows){

/* images */

const images = r.images ? r.images.split(",") : [];

/* tags */

const tags = r.tags ? r.tags.split(",") : [];

/* colors */

const colors = r.colors
? r.colors.split(";").map(c=>{
const [name,price,required] = c.split("|");
return {
name,
price:Number(price),
required:required==="true"
};
})
: [];

/* sizes */

const sizes = r.sizes
? r.sizes.split(";").map(s=>{
const [name,price,required] = s.split("|");
return {
name,
price:Number(price),
required:required==="true"
};
})
: [];

/* custom options */

const customOptions = r.customOptions
? r.customOptions.split(";").map(o=>{
const [type,label,price,required] = o.split("|");
return {
type,
label,
price:Number(price),
required:required==="true"
};
})
: [];

await addDoc(collection(db,"products"),{

name:r.name,
description:r.description,
basePrice:Number(r.basePrice),

categoryId:r.categoryId || null,
subCategoryId:r.subCategoryId || null,

images,

tags,

variants:{
colors,
sizes
},

customOptions,

bestseller:r.bestseller==="true",

createdAt:Date.now()

});

}

alert("Products Imported Successfully");

};

reader.readAsArrayBuffer(file);

});