# 🌍 CyberThreat Globe

<div align="center">
  <h3><strong>Real-Time Global Cyber Threat Visualization</strong></h3>
  <p>An immersive, 3D interactive web application that maps out cyber attacks, threat intensities, and active campaigns across the world using data from major threat intelligence sources.</p>
  
  [![Website](https://img.shields.io/badge/Website-Live_Demo-00ff88?style=for-the-badge&logo=vercel)](https://cyber-threat-globe.vercel.app/)
  [![Backend](https://img.shields.io/badge/API-Render-ff6b35?style=for-the-badge&logo=render)](https://cyberthreat-globe.onrender.com)
</div>

---

## 📸 Screenshots

*(Add your screenshots here by replacing the placeholder links!)*

**🌍 Main 3D Globe View**
*(Shows the dark-themed planet with glowing arcs for live attacks)*
> ![Main Globe View](https://via.placeholder.com/800x450/020810/00ff88?text=Add+Main+Globe+Screenshot+Here)

**📊 Threat Intelligence Panel**
*(Shows the right-side summary, abuse scores, and incident trend graphs)*
> ![Threat Intel Panel](https://via.placeholder.com/800x450/020810/ff6b35?text=Add+Right+Panel+Dashboard+Screenshot)

**⚡ Live Threat Feed**
*(Shows the real-time event log and top 10 leaderboard)*
> ![Live Feed](https://via.placeholder.com/800x450/020810/ffd60a?text=Add+Live+Feed+Screenshot)

---

## ✨ Features

- **Interactive 3D Globe**: Built with `react-globe.gl` and `three.js`, dynamically mapping threat origins and animating live attack arcs between countries.
- **Real-Time Threat Feed**: Simulates a live feed of cyber events (APT, DDoS, Ransomware, Phishing, etc.) with severity indicators.
- **Live Leaderboard**: Displays the top 10 most active threat origin countries globally.
- **Detailed Threat Intelligence**: Click on any country to view full statistics—incident counts, OTX pulses, AbuseIPDB scores, and active threat campaigns.
- **12-Month Trend Analysis**: Interactive charts built with `recharts` to track threat activity and attack vectors over time.
- **Dynamic Data Filtering**: Easily filter the globe points to only show specific attacks like APT, Ransomware, DDoS, or Fraud.
- **Data Export & Reporting**: Generate beautifully formatted, printable PDF Threat Reports for any selected country directly from the dashboard.
- **Cinematic Boot Sequence**: Immersive "Connecting to Threat Network" loading animation upon startup.
- **Intelligent Fallbacks**: Automatically switches to highly-detailed static intel (CISA/Crowdstrike) if the primary APIs experience downtime or rate limitations.

---

## 🛠️ Technology Stack

**Frontend**
- **Framework**: React.js
- **3D Visualization**: `react-globe.gl`
- **Graphics**: `three.js`
- **Charting**: `recharts`
- **Deployment**: [Vercel](https://cyber-threat-globe.vercel.app/)

**Backend**
- **Runtime**: Node.js
- **Framework**: Express.js 
- **Network**: `axios`, `cors`
- **Threat Intel Sources**: OTX AlienVault, AbuseIPDB
- **Deployment**: [Render](https://cyberthreat-globe.onrender.com)

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js installed on your machine.
- Free API keys from [AlienVault OTX](https://otx.alienvault.com/) and [AbuseIPDB](https://www.abuseipdb.com/) (Optional: the app has built-in fallbacks if you don't have these).

### 1. Set up the Backend
Open a terminal, navigate to the `cyber-backend` folder, and start the server:
```bash
cd cyber-backend
npm install
node server.js
```
The server will run on `http://localhost:5000` and immediately begin polling data.

### 2. Set up the Frontend
Open a **new** terminal window, navigate to the `cyberthreat-globe` folder, and launch the React app:
```bash
cd cyberthreat-globe
npm install
npm start
```
The application will open in your browser at `http://localhost:3000`.

---

## 🌐 Environment Variables

If you are running the project locally or deploying your own version, you can utilize the following environment variables:

**Frontend (`cyberthreat-globe/.env`)**
- `REACT_APP_API_URL`: Points the frontend to the backend server. 
  *(Example: `https://cyberthreat-globe.onrender.com`)*

**Backend (`cyber-backend/.env`)**
- `OTX_KEY`: Your AlienVault OTX API key.
- `ABUSEIPDB_KEY`: Your AbuseIPDB API key.

---

## 📄 License
This project is open-source and available for educational and personal use.
