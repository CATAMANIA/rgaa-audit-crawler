# Audit RGAA Automatisé

## Description
Cette commande permet de lancer un audit RGAA automatique (axe-core + pa11y) sur une application publique sans accès au code source.

## Usage
Tapez dans Copilot Chat :

```
@workspace audit RGAA <url> profondeur <niveau>
```

Exemple :
```
@workspace audit RGAA https://monapp.com profondeur 2
```

## Actions effectuées
- Exécute la commande Node suivante :
  ```bash
  node crawler.js --url=<url> --depth=<niveau> --out=rapport.json
  ```
- Analyse le fichier `rapport.json` et affiche :
  - le nombre de pages auditées
  - le score RGAA moyen
  - le statut de conformité (Conforme / Partiellement conforme / Non conforme)

## Exemple de sortie
```
📊 Score RGAA : 78.6 / 100
📄 Pages auditées : 12
📈 Statut : Partiellement conforme
📁 Rapport : rapport.json
```

## Intégration VS Code

Vous pouvez également utiliser la tâche VS Code configurée :
1. Ouvrir la palette de commandes (`Ctrl+Shift+P`)
2. Sélectionner `Tasks: Run Task`
3. Choisir `Audit RGAA`
4. Saisir l'URL et la profondeur

## Critères RGAA

L'outil mappe automatiquement les issues détectées vers les critères RGAA 4.1 :
- Critères d'accessibilité WCAG 2.1 niveau AA
- Mapping personnalisé vers les référentiels RGAA français
- Score pondéré basé sur la gravité des non-conformités

## Limitations

- Score indicatif uniquement
- Revue humaine complémentaire recommandée pour conformité officielle
- Certains critères RGAA nécessitent une évaluation manuelle