# 🌍 GeoRush

> A real-time multiplayer and single-player geography guessing game built with React, TypeScript, Express, Socket.IO, and Google Maps Platform.

**Live Demo:** [Play GeoRush](https://georush-325537025683.asia-south1.run.app/)

---

## 📖 Overview

GeoRush is a geography guessing game where players explore 360° Street View panoramas and use visual clues such as architecture, road markings, language, scripts, and terrain to determine where they are.

The game supports both **single-player challenges** and **server-authoritative real-time multiplayer**, with multiple competitive game modes, interactive maps, round-based scoring, and player progression.

The application uses **Google Maps Platform** for real Street View and map functionality, with a mock/offline mode available for development and environments without Google Maps access.

---

## 🎮 Game Modes

### Singleplayer

| Mode | Description |
|---|---|
| **Classic** | Five-round global location guessing challenge with distance-based scoring. |
| **Country Streak** | Identify the country of each location and maintain your streak. |
| **Time Attack** | Fast-paced rounds where quicker guesses receive a higher score multiplier. |
| **Daily Challenge** | Deterministic daily challenge where locations are generated from the current date. |

### Multiplayer

GeoRush uses **Socket.IO** for real-time multiplayer communication.

| Mode | Description |
|---|---|
| **Classic Lobby** | Multiplayer match with configurable rounds where the highest cumulative score wins. |
| **1v1 Duels** | Head-to-head HP-based competition where players deal damage based on their round performance. |
| **Country Streak** | Multiplayer elimination mode where incorrect country guesses eliminate players. |
| **Time Attack** | Synchronized speed-based multiplayer rounds combining proximity and time-based scoring. |

---

## 🕹️ How It Works

```text
Player
   │
   ▼
Game Lobby
   │
   ├── Select Game Mode
   ├── Select Map
   └── Create / Join Match
   │
   ▼
Round Starts
   │
   ├── Server selects target
   ├── Street View panorama is loaded
   └── Countdown begins
   │
   ▼
Player Exploration
   │
   ├── Explore 360° panorama
   ├── Inspect geographical clues
   └── Place a map guess
   │
   ▼
Guess Submitted
   │
   ▼
Server Calculates Result
   │
   ├── Distance
   ├── Score
   └── Multiplayer effects
   │
   ▼
Round Results
   │
   ├── Target location
   ├── Player guesses
   ├── Distance
   └── Score
   │
   ▼
Next Round / Match Summary
```

---

## 🌐 Maps & Street View

GeoRush integrates **Google Maps Platform** for interactive geographic gameplay.

### Google Maps

The application uses Google Maps for:

- 360° Street View panoramas
- Interactive world maps
- Roadmap and Satellite/Hybrid views
- Guess placement
- Target and player result markers
- Geodesic lines between guesses and targets

### Mock / Fallback Mode

For development and environments where real Street View access is unavailable, GeoRush supports a mock panorama system.

Leaflet with OpenStreetMap tiles is also available as a fallback map renderer.

---

## 🧮 Scoring

GeoRush calculates geographic distance using the **Haversine formula**, which determines the great-circle distance between two latitude/longitude coordinates.

### Classic Scoring

Classic mode uses exponential distance-based scoring.

The system awards up to:

- **5,000 points per round**
- **25,000 points across five rounds**

Very close guesses receive significantly higher scores, while extremely distant guesses approach zero.

The implementation also includes a distance ceiling for maximum scoring and a maximum-distance boundary beyond which the score reaches zero.

### Time Attack

Time Attack adds a speed multiplier to the base geographic score.

The multiplier increases for faster guesses, reaching a maximum of **1.5×**, while the final score remains capped at the round maximum.

### 1v1 Duels

Duels use an HP-based combat system.

- Starting HP: **6,000 HP**
- Rounds 1–3: **1.0×**
- Rounds 4–6: **1.5×**
- Rounds 7–9: **2.0×**
- Round 10+: **2.5×**

The lower-performing player takes damage based on the difference between the players' round performance.

---

## 🏗️ Multiplayer Architecture

GeoRush uses a **server-authoritative multiplayer architecture** built with Node.js, Express, and Socket.IO.

### Server Responsibilities

The server manages:

- Room creation and joining
- Player state
- Game sessions
- Target selection
- Round lifecycle
- Timers
- Guess submissions
- Score calculation
- Multiplayer mode rules
- Round transitions
- Match completion

### Round State Machine

Multiplayer games move through controlled states:

```text
LOBBY
  ↓
STARTING
  ↓
ROUND_LOADING
  ↓
ROUND_ACTIVE
  ↓
ROUND_RESULTS
  ↓
GAME_FINISHED
```

### Target Protection

During an active round, the target location is controlled by the server rather than being selected by individual clients.

This allows the multiplayer game state and scoring to remain authoritative across connected players.

### Real-Time Synchronization

Socket.IO synchronizes important events such as:

- Room state
- Round start
- Timers
- Player guesses
- Round results
- Score updates
- Match progression

---

## 💻 Tech Stack

### Frontend

- React 19
- TypeScript
- Tailwind CSS
- Motion
- Lucide React
- Canvas Confetti

### Maps & Geolocation

- Google Maps JavaScript API
- Google Street View
- Leaflet
- OpenStreetMap

### Backend & Real-Time

- Node.js
- Express
- Socket.IO
- tsx
- esbuild

### Other

- Web Audio API
- Vite
- Jest / Node test tooling
- localStorage for local player progression

---

## 📁 Project Structure

```text
GeoRush/
├── server/
│   ├── baseSession.ts
│   ├── gameSession.ts
│   ├── duelsSession.ts
│   ├── streakSession.ts
│   ├── timeAttackSession.ts
│   ├── roomManager.ts
│   ├── socketHandlers.ts
│   └── serverStreetViewResolver.ts
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── game/
│   │   ├── map/
│   │   ├── multiplayer/
│   │   ├── panorama/
│   │   ├── profile/
│   │   └── settings/
│   │
│   ├── context/
│   ├── data/
│   ├── game/
│   ├── shared/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── server.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm
- Google Maps Platform API key for real Street View functionality

### Installation

Clone the repository:

```bash
git clone https://github.com/solankisammyag/GeoRush.git
cd GeoRush
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

Example:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_MOCK_STREETVIEW=false
```

> Never commit your real API keys or `.env` files to GitHub.

### Development

Start the development server:

```bash
npm run dev
```

---

## 📦 Production Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

## 🔒 Security

GeoRush uses several measures to protect the application and its API integrations.

### Google Maps API Keys

Browser-side Google Maps API keys are inherently visible to the client because they are required by the Maps JavaScript API.

To reduce unauthorized usage, the production web key is restricted by:

- HTTP referrer / website restriction
- Google Maps JavaScript API restriction

API keys and other sensitive credentials should never be committed to the repository.

### Multiplayer

Important multiplayer game state is maintained by the server, including target selection, round timing, scoring, and room state.

This prevents individual clients from being the sole authority over competitive game results.

### Repository Security

Environment files containing secrets should remain excluded through `.gitignore`.

---

## ☁️ Deployment

GeoRush is deployed using Google Cloud infrastructure.

```text
GitHub
   │
   ▼
Cloud Build
   │
   ▼
Artifact Registry
   │
   ▼
Cloud Run
   │
   ▼
GeoRush
```

The production application is hosted on **Google Cloud Run** and uses Google Maps Platform for real geographic gameplay.

---

## 📸 Screenshots

Suggested screenshots for the repository:

| Screenshot | Recommended Content |
|---|---|
| `home.png` | GeoRush home screen |
| `solo-gameplay.png` | Active Street View gameplay |
| `multiplayer-lobby.png` | Multiplayer room/lobby |
| `multiplayer-gameplay.png` | Active multiplayer round |
| `round-result.png` | Google Maps round result |
| `match-summary.png` | Final match standings |

Example structure:

```text
docs/
└── screenshots/
    ├── home.png
    ├── solo-gameplay.png
    ├── multiplayer-lobby.png
    ├── multiplayer-gameplay.png
    ├── round-result.png
    └── match-summary.png
```

---

## 🛣️ Future Improvements

Potential future improvements include:

- Persistent global leaderboards
- User authentication
- Custom map/playlist creation
- Expanded multiplayer features
- Additional gameplay modes
- Further mobile optimization

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
