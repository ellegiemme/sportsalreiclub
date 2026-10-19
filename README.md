# Sport Sal Rei Club — sito ufficiale

Sito statico (HTML + CSS + JS inline) del Sport Sal Rei Club, Boa Vista, Capo Verde.

## Struttura

```
index.html            Home
club.html             Il club
first-team.html       Prima squadra
season.html           Calendario e classifiche
news.html             Archivio news
news-*.html           Articoli
assets/img/           Immagini (logo, foto, partner, giocatori)
.claude/skills/       Skill di Claude Code usate nel progetto (taste-skill)
```

Online: https://sport-sal-rei-club.mgm-523.workers.dev/ (Cloudflare Workers, deploy automatico a ogni push su `main`).
I file elencati in `.assetsignore` (README, `.claude/`, ecc.) non vengono pubblicati.

Font: Google Fonts (Bebas Neue, Inter). Icone: Tabler Icons via jsDelivr.

## Sviluppo locale

Nessuna build: basta servire la cartella.

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## Da verificare

- `first-team.html`: alcune foto dei giocatori sono marcate `PHOTO UNCONFIRMED` — verificare che volto e nome corrispondano.
