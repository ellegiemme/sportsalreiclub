# Sport Sal Rei Club — sito ufficiale

Sito del Sport Sal Rei Club (Boa Vista, Capo Verde), su **Cloudflare Workers** con database **D1**.
Inglese su `/`, portoghese su `/pt/`.

Online: https://sport-sal-rei-club.mgm-523.workers.dev/ (deploy automatico a ogni push su `main`).

## Struttura

```
src/index.js          router: pagine, lingue, redirect dei vecchi indirizzi .html
src/views/            modelli delle pagine (layout, home, season, team, club, news)
src/admin/            pannello di gestione /admin (login, notizie, partite, partner, account)
public/assets/admin/  CSS e JS del pannello
src/lib/              database, traduzioni (i18n-en.js / i18n-pt.js), classifica, sanitizer
src/data/squad.js     rosa e staff della prima squadra
migrations/           schema D1 e contenuti iniziali (notizie, partite, partner)
public/assets/        CSS, JS e immagini statiche
.claude/skills/       skill di Claude Code usate nel progetto (taste-skill)
```

Nel database: notizie (EN + PT, bozza/pubblicata), competizioni e partite, classifiche
(calcolate dai risultati), partner e posizioni degli sponsor. La stagione 2025/26 è archiviata
(`competitions.archived = 1`) e non compare sul sito.

## Pannello di gestione (`/admin`)

Login con email e password (account in D1, sessioni con cookie, blocco dopo 8 tentativi falliti).
Sezioni: Notizie (bozza, anteprima, pubblicazione solo con EN + PT, pulsante "Traduci" con AI,
foto caricate su R2), Partite (risultati per giornata, classifica automatica, spareggio manuale,
nuove partite), Partner (loghi, ordine, posizioni degli sponsor sul sito), Account.

Impostazioni sul Worker (Cloudflare → Impostazioni → Variabili e segreti):
- `SETUP_KEY` — chiave per creare il primo account su `/admin/primo-accesso`
- `ANTHROPIC_API_KEY` — per il pulsante "Traduci" (modello `claude-opus-5-5`)

Bucket R2 `sportsalreiclub-media` (binding `MEDIA`) per le immagini caricate, servite su `/media/...`.
In locale: `.dev.vars` con `SETUP_KEY=...` (e facoltativamente `ANTHROPIC_API_KEY=...`).

## Classifica

Punti 3/1/0. A parità: punti negli scontri diretti, differenza reti negli scontri diretti, gol fatti
negli scontri diretti (riapplicati al sottogruppo ancora in parità), differenza reti generale, gol fatti,
poi ordine manuale (`tie_order`, per sorteggio o spareggio). Base: FCF Regulamento Geral art. 93 e 95;
la ARFBV non ha pubblicato un regolamento proprio. Vedi `src/lib/standings.js`.

## Sviluppo locale

```bash
npm install
npm run db:local     # crea e popola il database locale
npm run dev          # http://localhost:8787
```

## Deploy

`npm run deploy` applica le migrazioni al database remoto e pubblica il Worker.

## Da verificare

- `src/data/squad.js`: le foto marcate `unconfirmed` vanno verificate (volto e nome).
