# Chess.com‑Style Schach (Modern UI, Bots, Online, Analyse)

Ein komplettes Full‑Stack‑Projekt: modernes React‑Frontend, Express + Socket.IO‑Server, **Stockfish‑Bots (optional) + Fallback‑Engine**, Online‑Räume, **Premove**, **Legal‑Moves‑Dots**, **Move‑Highlights**, Anzeige „Weiß/Schwarz am Zug“, **Post‑Game‑Analyse** (Blunder/Mistake/Inaccuracy/Good/Best), **Echtzeit‑Eval‑Bar**, **Soundeffekte** (bewegung/Schachmatt = „Loser“-Ton via WebAudio).

> **Hinweis:** Das Projekt funktioniert **ohne Stockfish** (Fallback‑Engine). Wird `stockfish` automatisch per `npm install` gefunden, nutzt der Server Stockfish für starke Bots & Analyse (bis ≈2500 ELO).

## Features
- Full‑Size Board, dynamisch skaliert (Sidebar ein-/ausblendbar)
- Move‑Highlights (letzter Zug), Legal‑Moves‑Dots, Premove
- Anzeige am Zug (Weiß/Schwarz), Evaluationsbalken vs. Bot
- Spiel gegen Bots (ELO‑Stufen 800 → 2500)
- Online mit Freunden über Räume (Socket.IO)
- Post‑Game‑Analyse mit Klassifizierung (Blunder/Mistake/Inaccuracy/Good/Best, Missed Win/Mate)
- Failsafes: Server‑seitige Zugvalidierung, Engine‑Timeouts, Auto‑Fallback, Reconnect, Tests

## Schnellanleitung (macOS M1)

### 1) Voraussetzungen
- **Node.js 18+** (Apple Silicon):  
  ```bash
  brew install node
  node -v
  ```
- **Git** (für GitHub Push): `brew install git`

### 2) Projekt installieren
```bash
cd chesscom-style-chess/server
npm install
cd ../client
npm install
```

> Beim Server wird automatisch das npm‑Paket **stockfish** installiert. Ist die Installation erfolgreich, nutzt der Server Stockfish. Falls nicht, läuft die interne Fallback‑Engine.

### 3) Entwicklung lokal starten
In zwei Terminals:
```bash
# Terminal A – Server (Port 8080)
cd chesscom-style-chess/server
npm run dev

# Terminal B – Client (Port 5173, Vite Proxy -> 8080)
cd chesscom-style-chess/client
npm run dev
```
Öffne dann: http://localhost:5173

### 4) Produktion (ein Service, Render‑freundlich)
Build & Start über den Server, der den Client ausliefert:
```bash
# Build Client
cd chesscom-style-chess/client
npm run build

# Kopiere Build in den Server
cd ../server
npm run copy-client

# Start (prod)
npm run start
```
Der Server serviert `/dist` statisch und Socket.IO auf demselben Host/Port.

### 5) GitHub Upload
```bash
cd chesscom-style-chess
git init
git add .
git commit -m "Initial chess app"
git branch -M main
git remote add origin https://github.com/<DEIN_USER>/<DEIN_REPO>.git
git push -u origin main
```

### 6) Render Deployment (ein Service)
- **New > Web Service**
- **Repository:** Dein GitHub Repo
- **Root Directory:** `server`
- **Build Command:** `npm run build:all`
- **Start Command:** `npm run start`
- **Environment:** Node 18+
- **Ports:** automatisch
- **Auto‑Deploy:** an

> Der Build holt Dependencies für **server** & **client**, baut den Client und kopiert ihn in den Server. Der Service dient statische Dateien + Socket.IO.

### 7) Online spielen
- Im Menü **„Neues Online‑Spiel“** erstellen → Link teilen → Freund joint.  
- Oder **„Gegen Bot“** (ELO wählen).

### 8) Analyse
Nach Spielende **„Analyse“** klicken. Der Server bewertet jede Stellung (Tiefe/Time) via Stockfish (falls verfügbar) oder Fallback‑Engine und klassifiziert jeden Zug.

---

## Tests
```bash
cd server
npm test
```

## Anpassungen
- **Loser‑Sound**: Wird synthetisch via WebAudio erzeugt (abwärts gleitender Ton). Du kannst in `client/src/components/SoundManager.jsx` eigene Audiofiles hinterlegen.
- **ELO/Schwierigkeitsgrade**: `server/src/engine/bots.js`
- **Schwellen Analyse**: `server/src/analysis/analyzer.js`

## Lizenz
MIT. Beachte, dass `stockfish` (WASM‑Build) unter eigener Lizenz steht (GPLv3); es wird als **npm Abhängigkeit** bezogen. Du kannst jederzeit nur den Fallback nutzen.
