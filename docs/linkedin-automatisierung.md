# Neue Impulsbeiträge automatisch auf LinkedIn teilen

**Für:** Julia (schreibt) und Peter (richtet einmalig ein).
**Prinzip:** Erst Website, dann LinkedIn. Ein Beitrag wird im CMS geschrieben,
geht live — und eine Automatisierung teilt ihn kurz danach auf LinkedIn.

```
CMS (impactalyst.de/admin)  →  Website + RSS-Feed  →  Make / n8n  →  LinkedIn-Post
```

Warum nicht andersherum (LinkedIn → Website)? LinkedIn gibt Beiträge persönlicher
Profile über seine Schnittstelle nicht an Dritte heraus, und automatisches Auslesen
der Seite verstößt gegen die Nutzungsbedingungen. Posten auf das eigene Profil ist
dagegen offiziell erlaubt.

---

## Der Feed

**Adresse:** `https://impactalyst.de/feed.xml`

Pro Beitrag stehen darin:

| Feld im Feed | Inhalt | Gut für |
|---|---|---|
| `title` | Titel | erste Zeile des Posts |
| `description` | Teaser (1–2 Sätze) | kurzer Post-Text |
| `link` | Adresse des Beitrags | Link im Post |
| `content:encoded` | voller Text (HTML) | Variante „ganzer Text auf LinkedIn" |
| `enclosure` | Beitragsbild | Bild im Post |
| `category` | Themen | Hashtags |

Neue Beiträge erscheinen im Feed, sobald sie im CMS gespeichert und live sind
(ca. 1 Minute).

---

## Variante A: Make (empfohlen — ohne Technik, Server in der EU wählbar)

**Einmalig einrichten (Peter oder Julia, ca. 20 Minuten):**

1. Konto anlegen auf [make.com](https://www.make.com). Beim Anlegen die
   EU-Region wählen. Der kostenlose Einstiegstarif reicht für ein paar Beiträge
   im Monat.
2. **Neues Szenario** anlegen.
3. Erstes Modul: **RSS → „Watch RSS feed items"**
   - URL: `https://impactalyst.de/feed.xml`
   - Bei der Frage, ab wann gelesen werden soll: **„From now on"** wählen.
     Sonst werden alle bisherigen Beiträge erneut gepostet — die stehen ja
     schon auf LinkedIn.
4. Zweites Modul: **LinkedIn → „Create a User Image Post"** (mit Bild) oder
   **„Create a User Article Post"** (Link-Vorschau mit Bild).
   Die genauen Bezeichnungen können sich bei Make leicht ändern.
   - LinkedIn-Konto von Julia verbinden (einmalige Anmeldung bei LinkedIn).
   - Text zusammensetzen, z. B.:
     ```
     {{Title}}

     {{Description}}

     Den ganzen Beitrag gibt es auf impactalyst.de: {{URL}}
     ```
   - Bild: das Feld der Bild-URL aus dem RSS-Modul (Enclosure / „URL" des Bildes).
5. Szenario **einschalten**. Make schaut dann regelmäßig in den Feed
   (im kostenlosen Tarif etwa alle 15 Minuten).

**Testen:** Einen Beitrag im CMS als Entwurf anlegen, Entwurf-Haken entfernen,
speichern — nach spätestens einer halben Stunde sollte er auf LinkedIn stehen.

## Variante B: n8n (für Peter, falls ihr n8n ohnehin betreibt)

1. Node **„RSS Feed Trigger"** mit `https://impactalyst.de/feed.xml`.
   Er meldet nur Beiträge, die nach dem Aktivieren neu dazukommen.
2. Node **„LinkedIn"** → Operation *Create (Post)* → *Post As: Person*.
   - Text wie oben, aus `title`, `contentSnippet`/`description` und `link`.
   - Share Media Category *Article* (Link-Vorschau) oder *Image*.
3. Workflow aktivieren.

---

## Ganzer Text statt Teaser auf LinkedIn?

Geht auch: statt `description` das Feld `content:encoded` nehmen und vorher die
HTML-Tags entfernen (Make: Funktion `stripHTML()`, n8n: Node „Markdown" →
HTML to Markdown oder ein Code-Node). Achtung: LinkedIn erlaubt höchstens
3.000 Zeichen pro Beitrag — lange Texte vorher kürzen.

Empfehlung: Teaser + Link. Der volle Text liegt dann auf eurer Website — dort
bringt er Besucher und Sichtbarkeit bei Google.

---

## Der Ablauf für Julia, sobald alles eingerichtet ist

1. `impactalyst.de/admin/` öffnen → **Impulsbeiträge** → **Neu**.
2. Titel, Datum, **Teaser** (wird zum LinkedIn-Text!), Themen, Bild,
   Bildbeschreibung, Text.
3. Noch nicht fertig? Haken bei **„Entwurf"** setzen — dann passiert nichts.
4. Fertig? Entwurf-Haken raus, **Speichern**. Website und LinkedIn
   erledigen den Rest.

**Wichtig:** Diesen Beitrag dann **nicht zusätzlich von Hand** auf LinkedIn
posten — sonst steht er doppelt da.

## Wenn etwas nicht klappt

| Problem | Ursache / Lösung |
|---|---|
| Alter Beitrag wurde erneut gepostet | Beim RSS-Modul nicht „From now on" gewählt. Post auf LinkedIn löschen, Modul neu einstellen. |
| Nichts passiert | Ist der Beitrag live (kein Entwurf)? Steht er unter `impactalyst.de/feed.xml`? Ist das Szenario eingeschaltet? |
| LinkedIn-Verbindung abgelaufen | LinkedIn verlangt gelegentlich eine erneute Anmeldung — in Make/n8n die Verbindung neu autorisieren. |
| Bild fehlt im Post | Beitrag hat kein Bild im CMS-Feld „Bild" (Bilder im Fließtext zählen nicht). |
