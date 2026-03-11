# CyberThreat Globe

CyberThreat Globe is an interactive, 3D web application designed to visualize global cybersecurity threats in real-time. It maps out cyber attacks, threat intensities, and active campaigns across the world using data gathered from major threat intelligence sources.

## Features

- **Interactive 3D Globe**: Built with `react-globe.gl` and `three.js`, the globe dynamically maps threat origins and animates live attack arcs between countries.
- **Real-Time Threat Feed**: Simulates a live feed of threat events (APT, DDoS, Ransomware, etc.) with associated severity and campaign data.
- **Top 10 Leaderboard**: Displays the most active threat origins, ranked by incident volume and abuse score.
- **Threat Intelligence Panel**: Detailed country-level statistics including incident counts, OTX pulses, and abuse scores.
- **12-Month Trend Analysis**: Visualized using `recharts`, allowing users to track threat activity over time (Incidents, Scores, OTX).
- **Interactive Filtering**: Filter the globe view by attack vector (e.g., APT, Ransomware, Phishing, DDoS, Fraud).
- **PDF Report Export**: Generate and download beautifully formatted PDF Threat Reports for any selected country directly from the app.
- **Cinematic System Init**: An immersive boot-up sequence that simulates connecting to global threat networks.
- **Graceful Fallbacks**: Intelligent fallback to cached static intelligence data if primary APIs face rate-limits or downtime.

## Tech Stack

This project is split into a **Frontend (React)** and a **Backend (Node.js/Express)**.

### Frontend (`cyberthreat-globe`)
- **Framework**: React.js
- **3D Visualization**: `react-globe.gl`, `three`
- **Charting**: `recharts`
- **Styling**: Inline CSS / Custom CSS

### Backend (`cyber-backend`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Network**: `axios`, `cors`
- **APIs Integrated**:
  - **OTX AlienVault** (Live threat pulses and campaign data)
  - **AbuseIPDB** (IP abuse classification and scoring)

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Running Locally

The application runs in two parts: the backend server and the frontend React app.

#### 1. Start the Backend Server
Open a terminal and navigate to the `cyber-backend` directory:
```bash
cd cyber-backend
npm install
node server.js
```
The server will start on `http://localhost:5000` and immediately begin polling data from OTX AlienVault and AbuseIPDB.

#### 2. Start the Frontend App
Open a *new* terminal window and navigate to the `cyberthreat-globe` directory:
```bash
cd cyberthreat-globe
npm install
npm start
```
The application will launch in your browser, running on `http://localhost:3000`.

---

## Environment Configuration

If you have specific API keys you wish to use (instead of the provided ones or the static fallback), you can configure them in `cyber-backend/server.js`:
- `OTX_KEY`: Your AlienVault OTX API key.
- `ABUSEIPDB_KEY`: Your AbuseIPDB API key.

To point the frontend to a production backend, configure the environment variable:
- `REACT_APP_API_URL` (Defaults to `http://localhost:5000` if not set).

## Deployment

To deploy this project:
1. **Backend**: Host the `cyber-backend` directory on any Node.js compatible platform (like Render, Heroku, or a VPS).
2. **Frontend**: Host the `cyberthreat-globe` directory on a static site host (like Vercel, Netlify, or GitHub Pages). Set the `REACT_APP_API_URL` environment variable during the build process to point to your live backend URL.
