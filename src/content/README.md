# src/content/ — Inhalts-Vertrag

Diese Ordnerstruktur und die Frontmatter-Felder darin sind der **gemeinsame Vertrag**
zwischen drei Systemen:

1. **Sveltia CMS** (`/admin/`) schreibt hierher.
2. **Eleventy** liest hier und baut daraus `_site/`.
3. Eine spätere **n8n-Pipeline** würde ebenfalls hierher committen.

Deshalb: Feldnamen nicht ändern, ohne `admin/config.yml` und die Templates mitzuziehen.

## Regeln, die für alle Sammlungen gelten

- `draft: true` → der Eintrag wird **nicht** gebaut. So fängt man etwas an, ohne dass es live geht.
- Ein Eintrag ohne `title` ist ungültig und lässt den Build fehlschlagen — das ist Absicht.
- Datumsangaben immer `YYYY-MM-DD`.
- Bilder gehören nach `assets/img/uploads/` und werden mit Pfad ab `/assets/…` referenziert.
- Leere Sammlungen sind ein gültiger Zustand: Navigation und Rubrik blenden sich selbst aus.

## Sammlungen

| Ordner | Was | URL |
|---|---|---|
| `pages/` | Einzelseiten mit redaktionellem Text | `/vision/`, `/netzwerk/` |
| `events/` | Kommende und vergangene Meetups | `/events/<slug>/` |
| `articles/` | Fachartikel | `/impulse/artikel/<slug>/` |
| `resources/` | Ressourcen-Bibliothek (Links, PDFs, Methoden) | `/impulse/ressourcen/` |
| `recaps/` | Event-Recaps | `/impulse/recaps/<slug>/` |
| `team/` | Menschen hinter dem Netzwerk | `/netzwerk/` |

Die genauen Felder pro Sammlung stehen in `admin/config.yml` — dort sind sie
zugleich Formular-Definition und Dokumentation.
