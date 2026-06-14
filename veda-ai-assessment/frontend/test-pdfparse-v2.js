const mod = require('pdf-parse');
console.log("Type of require('pdf-parse'):", typeof mod);
console.log("Keys:", Object.keys(mod));
if (mod.PDFParse) {
  const p = new mod.PDFParse();
  console.log("PDFParse instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(p)));
}
if (mod.default) {
  console.log("mod.default type:", typeof mod.default);
}
