// summarize-report.js
import fs from "fs";

const file = process.argv[2] || "rapport.json";

if (!fs.existsSync(file)) {
  console.error("❌ Fichier introuvable :", file);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));
const { avg_score, status, pages_audited } = data.metadata || {};

console.log(`📊 Score RGAA : ${avg_score?.toFixed(1) || 0} / 100`);
console.log(`📄 Pages auditées : ${pages_audited || 0}`);
console.log(`📈 Statut : ${status || "Inconnu"}`);
console.log(`📁 Rapport : ${file}`);