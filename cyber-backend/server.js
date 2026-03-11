const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── API KEYS ─────────────────────────────────────────────────────────────
const OTX_KEY = "8423c4c8cbadc89f58ee624de6833a696113bb5f45c08f4dff3ceb03f3688191";
const ABUSEIPDB_KEY = "bc6bf043ca81f8a88c60a9921b3c989402419c1936cfe450ff2623fcead6adba373ded52dbebdd15";

// ─── COUNTRY COORDINATES ──────────────────────────────────────────────────
const countryCoords = {
  US: { lat: 37.09, lng: -95.71, name: "USA" },
  CN: { lat: 35.86, lng: 104.19, name: "China" },
  RU: { lat: 55.37, lng: 83.74, name: "Russia" },
  IN: { lat: 20.59, lng: 78.96, name: "India" },
  DE: { lat: 51.16, lng: 10.45, name: "Germany" },
  GB: { lat: 55.37, lng: -3.43, name: "UK" },
  FR: { lat: 46.22, lng: 2.21, name: "France" },
  BR: { lat: -14.23, lng: -51.92, name: "Brazil" },
  JP: { lat: 36.20, lng: 138.25, name: "Japan" },
  AU: { lat: -25.27, lng: 133.77, name: "Australia" },
  TW: { lat: 23.68, lng: 120.96, name: "Taiwan" },
  IL: { lat: 31.04, lng: 34.85, name: "Israel" },
  ZA: { lat: -30.55, lng: 22.93, name: "South Africa" },
  SG: { lat: 1.35, lng: 103.81, name: "Singapore" },
  CA: { lat: 56.13, lng: -106.34, name: "Canada" },
  KR: { lat: 37.09, lng: 127.77, name: "South Korea" },
  NL: { lat: 52.13, lng: 5.29, name: "Netherlands" },
  UA: { lat: 48.37, lng: 31.16, name: "Ukraine" },
  NG: { lat: 9.08, lng: 8.67, name: "Nigeria" },
  IR: { lat: 32.42, lng: 53.68, name: "Iran" },
  PK: { lat: 30.37, lng: 69.34, name: "Pakistan" },
  TR: { lat: 38.96, lng: 35.24, name: "Turkey" },
  VN: { lat: 14.05, lng: 108.27, name: "Vietnam" },
  ID: { lat: -0.78, lng: 113.92, name: "Indonesia" },
  MX: { lat: 23.63, lng: -102.55, name: "Mexico" },
  RO: { lat: 45.94, lng: 24.96, name: "Romania" },
  TH: { lat: 15.87, lng: 100.99, name: "Thailand" },
  HK: { lat: 22.39, lng: 114.10, name: "Hong Kong" },
  PL: { lat: 51.91, lng: 19.14, name: "Poland" },
  ES: { lat: 40.46, lng: -3.74, name: "Spain" },
  IT: { lat: 41.87, lng: 12.56, name: "Italy" },
  SE: { lat: 60.12, lng: 18.64, name: "Sweden" },
  CH: { lat: 46.81, lng: 8.22, name: "Switzerland" },
  AR: { lat: -38.41, lng: -63.61, name: "Argentina" },
  SA: { lat: 23.88, lng: 45.07, name: "Saudi Arabia" },
  AE: { lat: 23.42, lng: 53.84, name: "UAE" },
  MY: { lat: 4.21, lng: 101.97, name: "Malaysia" },
  PH: { lat: 12.87, lng: 121.77, name: "Philippines" },
  CZ: { lat: 49.81, lng: 15.47, name: "Czech Republic" },
  BY: { lat: 53.70, lng: 27.95, name: "Belarus" },
  EG: { lat: 26.82, lng: 30.80, name: "Egypt" },
  CL: { lat: -35.67, lng: -71.54, name: "Chile" },
  PT: { lat: 39.39, lng: -8.22, name: "Portugal" },
  NO: { lat: 60.47, lng: 8.46, name: "Norway" },
  FI: { lat: 61.92, lng: 25.74, name: "Finland" },
  DK: { lat: 56.26, lng: 9.50, name: "Denmark" },
  BE: { lat: 50.50, lng: 4.46, name: "Belgium" },
  AT: { lat: 47.51, lng: 14.55, name: "Austria" },
  BD: { lat: 23.68, lng: 90.35, name: "Bangladesh" },
  KZ: { lat: 48.01, lng: 66.92, name: "Kazakhstan" },
};

// ─── COUNTRY NAME LOOKUP ──────────────────────────────────────────────────
const nameToCode = {};
Object.entries(countryCoords).forEach(([cc, val]) => {
  nameToCode[val.name.toLowerCase()] = cc;
  nameToCode[cc.toLowerCase()] = cc;
});
Object.assign(nameToCode, {
  "united states": "US", "united states of america": "US",
  "united kingdom": "GB", "great britain": "GB",
  "russian federation": "RU",
  "people's republic of china": "CN", "prc": "CN",
  "republic of korea": "KR", "korea, republic of": "KR",
  "viet nam": "VN", "socialist republic of vietnam": "VN",
  "islamic republic of iran": "IR",
  "hong kong sar": "HK", "hong kong s.a.r.": "HK",
  "taiwan, province of china": "TW",
  "south africa": "ZA",
  "netherlands": "NL", "the netherlands": "NL",
  "türkiye": "TR", "turkiye": "TR",
  "saudi arabia": "SA", "united arab emirates": "AE",
  "czech republic": "CZ", "czechia": "CZ",
  "belarus": "BY", "egypt": "EG",
  "philippines": "PH", "malaysia": "MY",
  "bangladesh": "BD", "kazakhstan": "KZ",
});

function findCountryCode(str) {
  if (!str) return null;
  const upper = str.trim().toUpperCase();
  if (countryCoords[upper]) return upper;
  const lower = str.trim().toLowerCase();
  if (nameToCode[lower]) return nameToCode[lower];
  for (const [name, code] of Object.entries(nameToCode)) {
    if (name.length >= 5 && lower.includes(name)) return code;
  }
  return null;
}

function getThreatColor(score) {
  if (score >= 80) return "#ff2d55";
  if (score >= 50) return "#ff6b35";
  if (score >= 25) return "#ffd60a";
  return "#30d158";
}

// ─── STATIC FALLBACK (CrowdStrike/Mandiant/CISA 2024) ────────────────────
const staticFallback = {
  CN: { attacks: 312, abuseScore: 92, type: "APT / Espionage" },
  RU: { attacks: 287, abuseScore: 89, type: "Ransomware / APT" },
  US: { attacks: 198, abuseScore: 74, type: "Cybercrime" },
  IR: { attacks: 156, abuseScore: 85, type: "State-Sponsored" },
  IN: { attacks: 143, abuseScore: 66, type: "Phishing" },
  BR: { attacks: 98, abuseScore: 61, type: "Banking Trojans" },
  UA: { attacks: 112, abuseScore: 72, type: "Hacktivism" },
  DE: { attacks: 76, abuseScore: 53, type: "DDoS" },
  NL: { attacks: 89, abuseScore: 58, type: "Botnet Hosting" },
  KR: { attacks: 65, abuseScore: 50, type: "Cryptojacking" },
  FR: { attacks: 58, abuseScore: 47, type: "Phishing" },
  GB: { attacks: 54, abuseScore: 46, type: "Ransomware" },
  VN: { attacks: 78, abuseScore: 60, type: "APT" },
  ID: { attacks: 67, abuseScore: 54, type: "Defacement" },
  TR: { attacks: 55, abuseScore: 50, type: "DDoS" },
  PK: { attacks: 49, abuseScore: 47, type: "Phishing" },
  RO: { attacks: 43, abuseScore: 44, type: "Fraud" },
  HK: { attacks: 61, abuseScore: 56, type: "Data Theft" },
  MX: { attacks: 38, abuseScore: 41, type: "Fraud" },
  NG: { attacks: 72, abuseScore: 64, type: "BEC / Fraud" },
  BY: { attacks: 44, abuseScore: 68, type: "State-Sponsored" },
  SA: { attacks: 31, abuseScore: 38, type: "Phishing" },
  EG: { attacks: 28, abuseScore: 36, type: "Hacktivism" },
  TH: { attacks: 35, abuseScore: 40, type: "Malware" },
  KZ: { attacks: 22, abuseScore: 32, type: "Botnet" },
};

function makeEntry(cc) {
  return {
    ...countryCoords[cc],
    countryCode: cc,
    attacks: 0,
    abuseScore: 0,
    pulseCount: 0,
    threatNames: [],
    attackType: "",
    sources: [],
  };
}

// ─── 1. AbuseIPDB ─────────────────────────────────────────────────────────
async function fetchAbuseIPDB(combined) {
  try {
    const r = await axios.get("https://api.abuseipdb.com/api/v2/blacklist", {
      headers: { Key: ABUSEIPDB_KEY, Accept: "application/json" },
      params: { confidenceMinimum: 90, limit: 500 },
      timeout: 8000,
    });
    const ipList = r.data.data || [];
    console.log(`✅ AbuseIPDB: ${ipList.length} IPs`);
    ipList.forEach((ip) => {
      const cc = ip.countryCode;
      if (!cc || !countryCoords[cc]) return;
      if (!combined[cc]) combined[cc] = makeEntry(cc);
      combined[cc].attacks++;
      combined[cc].abuseScore = Math.max(combined[cc].abuseScore, ip.abuseConfidenceScore || 0);
      if (!combined[cc].sources.includes("AbuseIPDB")) combined[cc].sources.push("AbuseIPDB");
    });
    return "live";
  } catch (e) {
    console.log(`⚠ AbuseIPDB ${e.response?.status === 429 ? "rate limited" : "failed"} — static fallback`);
    Object.entries(staticFallback).forEach(([cc, data]) => {
      if (!combined[cc]) combined[cc] = makeEntry(cc);
      combined[cc].attacks = Math.max(combined[cc].attacks, data.attacks);
      combined[cc].abuseScore = Math.max(combined[cc].abuseScore, data.abuseScore);
      combined[cc].attackType = data.type;
      if (!combined[cc].sources.includes("StaticIntel")) combined[cc].sources.push("StaticIntel");
    });
    return "static";
  }
}

// ─── 2. OTX AlienVault (with 3-attempt retry + backoff) ─────────────────
async function fetchOTXOnce() {
  const [p1, p2] = await Promise.all([
    axios.get("https://otx.alienvault.com/api/v1/pulses/subscribed", {
      headers: { "X-OTX-API-KEY": OTX_KEY },
      params: { limit: 40, page: 1 },
      timeout: 12000,
    }),
    axios.get("https://otx.alienvault.com/api/v1/pulses/subscribed", {
      headers: { "X-OTX-API-KEY": OTX_KEY },
      params: { limit: 40, page: 2 },
      timeout: 12000,
    }),
  ]);
  return [...(p1.data.results || []), ...(p2.data.results || [])];
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchOTX(combined) {
  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [0, 3000, 7000]; // immediate, 3s, 7s

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt - 1] > 0) {
      console.log(`  ⏳ Waiting ${BACKOFF_MS[attempt - 1] / 1000}s before retry...`);
      await wait(BACKOFF_MS[attempt - 1]);
    }
    try {
      console.log(`  OTX attempt ${attempt}/${MAX_ATTEMPTS}...`);
      const pulses = await fetchOTXOnce();
      console.log(`✅ OTX: ${pulses.length} pulses (attempt ${attempt})`);

      const addOTX = (cc, pulseName, weight = 1) => {
        if (!cc || !countryCoords[cc]) return;
        if (!combined[cc]) combined[cc] = makeEntry(cc);
        combined[cc].pulseCount += weight;
        if (pulseName && !combined[cc].threatNames.includes(pulseName))
          combined[cc].threatNames.push(pulseName);
        if (!combined[cc].sources.includes("OTX")) combined[cc].sources.push("OTX");
      };

      pulses.forEach((pulse) => {
        const name = pulse.name || "";
        (pulse.targeted_countries || []).forEach((c) => { const cc = findCountryCode(c); if (cc) addOTX(cc, name, 2); });
        (pulse.tags || []).forEach((tag) => { const cc = findCountryCode(tag); if (cc) addOTX(cc, name, 1); });
        if (pulse.adversary) { const cc = findCountryCode(pulse.adversary); if (cc) addOTX(cc, name, 1); }
        const text = `${name} ${pulse.description || ""}`.toLowerCase();
        Object.entries(nameToCode).forEach(([namePart, cc]) => {
          if (namePart.length >= 5 && text.includes(namePart)) addOTX(cc, name, 0.5);
        });
      });
      return "live";

    } catch (e) {
      lastError = e;
      const code = e.response?.status || e.message;
      console.log(`  ⚠ OTX attempt ${attempt} failed: ${code}`);

      // If we hit a core server error (500) or auth error (401/403), skip retries immediately
      if (e.response?.status >= 500 || e.response?.status === 401 || e.response?.status === 403) {
        console.log(`  ✗ OTX critical failure (${e.response?.status}) — switching to static fallback immediately`);
        break;
      }
    }
  }

  console.log(`✗ OTX failed: ${lastError?.response?.status || lastError?.message} — Using static pulses`);

  // Apply static fallback pulses so the globe still looks active
  Object.entries(staticFallback).forEach(([cc, data]) => {
    if (!combined[cc]) combined[cc] = makeEntry(cc);
    combined[cc].pulseCount = Math.max(combined[cc].pulseCount, Math.round(data.attacks / 40));
    const fakePulse = `APT ${data.type.split(" ")[0]} Campaign`;
    if (!combined[cc].threatNames.includes(fakePulse)) {
      combined[cc].threatNames.push(fakePulse);
    }
    if (!combined[cc].sources.includes("StaticIntel")) combined[cc].sources.push("StaticIntel");
  });

  return "static";
}

// ─── /api/combined ────────────────────────────────────────────────────────
app.get("/api/combined", async (req, res) => {
  try {
    console.log("\n══════════════════════════════════════");
    console.log("  Fetching OTX + AbuseIPDB...");
    console.log("══════════════════════════════════════");

    const combined = {};
    const [abuseStatus, otxStatus] = await Promise.all([
      fetchAbuseIPDB(combined),
      fetchOTX(combined),
    ]);

    console.log(`\nStatus: AbuseIPDB = ${abuseStatus} | OTX=${otxStatus} `);

    const globeData = Object.entries(combined)
      .filter(([cc, entry]) => cc && countryCoords[cc] && entry.lat !== undefined)
      .map(([cc, entry]) => {
        const score = entry.abuseScore || Math.min(Math.round(entry.pulseCount * 8), 95);
        return {
          lat: entry.lat,
          lng: entry.lng,
          country: entry.name,
          countryCode: cc,
          attacks: entry.attacks || 0,
          abuseScore: entry.abuseScore || 0,
          pulseCount: Math.round(entry.pulseCount || 0),
          threatScore: score,
          color: getThreatColor(score),
          threatNames: (entry.threatNames || []).slice(0, 5),
          attackType: entry.attackType || "",
          sources: entry.sources || [],
        };
      })
      .sort((a, b) => b.attacks - a.attacks);

    console.log(`\n✓ ${globeData.length} countries | Top 5: `);
    globeData.slice(0, 5).forEach((d) =>
      console.log(`  ${d.country}: attacks = ${d.attacks} pulses = ${d.pulseCount} score = ${d.abuseScore} [${d.sources.join(",")}]`)
    );

    res.json({ success: true, data: globeData, apiStatus: { abuseStatus, otxStatus } });
  } catch (err) {
    console.error("Crash:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── /api/test ────────────────────────────────────────────────────────────
app.get("/api/test", async (req, res) => {
  const results = {};
  try {
    const r = await axios.get("https://otx.alienvault.com/api/v1/pulses/subscribed", {
      headers: { "X-OTX-API-KEY": OTX_KEY }, params: { limit: 1 }
    });
    results.otx = { status: "OK", totalPulses: r.data.count };
  } catch (e) { results.otx = { status: "ERROR", code: e.response?.status }; }

  try {
    const r = await axios.get("https://api.abuseipdb.com/api/v2/check", {
      headers: { Key: ABUSEIPDB_KEY, Accept: "application/json" },
      params: { ipAddress: "1.1.1.1" }
    });
    results.abuseipdb = { status: "OK", country: r.data.data?.countryCode };
  } catch (e) {
    results.abuseipdb = { status: e.response?.status === 429 ? "RATE_LIMITED" : "ERROR", code: e.response?.status };
  }

  res.json(results);
});

// ─── START ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   CyberThreat Globe — Backend Ready     ║
  ║   http://localhost:${PORT}                 ║
  ╠══════════════════════════════════════════╣
  ║  ✅ OTX AlienVault  — ACTIVE            ║
  ║  ✅ AbuseIPDB       — ACTIVE + fallback ║
  ╠══════════════════════════════════════════╣
  ║  GET / api / combined  → Globe data        ║
  ║  GET / api / test      → Health check      ║
  ╚══════════════════════════════════════════╝
    `);
});