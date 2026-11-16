# Engagement-Wall

Web-App für eine Videoinstallation: zeigt in Dauerschleife und zufälliger Reihenfolge jeweils 8 der 503 für den Deutschen Engagementpreis 2026 nominierten Projekte.

**Status: Entwurf.** Die Kurztexte zu den Projekten sind KI-Zusammenfassungen und noch nicht redaktionell geprüft.

## Ansehen

Im Browser öffnen und mit F11 in den Vollbildmodus schalten. Gedacht für 16:9, Full HD.

## Variante hochkant (9:16)

`hochkant.html` (bzw. `start-hochkant.bat`) für einen hochkant gedrehten Bildschirm, 1080 × 1920. Zwei Spalten, nur zwei Kachelgrößen (groß über die volle Breite, klein halbe Breite), kleine Schrift etwas größer als in der Querversion. Parameter wie unten.

## Parameter

An die Adresse anhängen, z. B. `?n=6&dauer=60`:

- `n` – Anzahl Kacheln (5–10, Standard 8)
- `dauer` – Sekunden, die eine Kachel steht (Standard 40)
- `seed` – feste Reihenfolge, z. B. `seed=7`

## Lokal

`index.html` doppelklicken oder `start.bat` für den Kiosk-Modus (Chrome/Edge, beenden mit Alt+F4).

## Hinweise

- Projektdaten: Engagiertenfinder auf deutscher-engagementpreis.de, abgerufen am 13.11.2026.
- Schrift: Lato, SIL Open Font License (`assets/fonts/OFL.txt`).
- Logo und Gestaltungselemente: Deutscher Engagementpreis / Deutsche Stiftung für Engagement und Ehrenamt.
