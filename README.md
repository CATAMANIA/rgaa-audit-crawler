# RGAA Audit Crawler PoC

Audit multi-pages d'une application web publique sans accès au code.

## 🚀 Installation

```bash
cd rgaa-audit-crawler
npm install
```

## 🔎 Utilisation

```bash
node crawler.js --url=https://exemple.com --depth=2 --out=rapport.json
```

- Recherche un **sitemap.xml**, sinon crawle les liens internes jusqu'à `--depth`.
- Exécute **axe-core** + **Pa11y** sur chaque page.
- Mappe les issues aux **critères RGAA** via `rgaa-mapping.json`.
- Calcule un **score RGAA pondéré**.

## 📊 Sortie

```json
{
  "metadata": {
    "startUrl": "https://exemple.com",
    "pages_audited": 10,
    "avg_score": 72.5,
    "status": "Partiellement conforme"
  },
  "pages": [
    { "url": "...", "score": 80, "issues": [ ... ] }
  ]
}
```

## ⚠️ Notes

- Le score RGAA est **indicatif** : il mesure la densité et la gravité des non-conformités détectées.
- Pour une **conformité officielle RGAA**, prévoir une **revue humaine complémentaire**.

## 📋 Fonctionnalités

- ✅ Découverte automatique des pages (sitemap.xml ou crawling)
- ✅ Tests d'accessibilité avec axe-core et pa11y
- ✅ Mapping vers les critères RGAA 4.1
- ✅ Calcul de score pondéré
- ✅ Rapport JSON détaillé
- ✅ Intégration VS Code avec tasks

## 🛠️ Développement

Pour utiliser avec VS Code :
1. Ouvrir la palette de commandes (`Ctrl+Shift+P`)
2. Sélectionner `Tasks: Run Task`
3. Choisir `Audit RGAA`
4. Saisir l'URL et la profondeur

## 📝 Licence

MIT License - Développé par CATAMANIA