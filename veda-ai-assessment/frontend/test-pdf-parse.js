const fs = require('fs');
const pdfParse = require('pdf-parse');

console.log("pdfParse =", pdfParse);
console.log("typeof pdfParse =", typeof pdfParse);
console.log("keys =", Object.keys(pdfParse || {}));
