async function list() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDlz79Iwqd2zN6dy2M9mhc_YC6Ukb_IeiE");
  const json = await res.json();
  const names = json.models.map(m => m.name);
  console.log(names.filter(n => n.includes("gemini")));
}
list();
