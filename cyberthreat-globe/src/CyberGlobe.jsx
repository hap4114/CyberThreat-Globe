import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Globe from "react-globe.gl";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// This tells React: Use the live URL if built for production, otherwise use localhost
const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";


const FALLBACK_DATA = [
  { lat: 35.86, lng: 104.19, country: "China", countryCode: "CN", attacks: 312, abuseScore: 92, pulseCount: 8, color: "#ff2d55", sources: ["StaticIntel"], attackType: "APT / Espionage" },
  { lat: 55.37, lng: 83.74, country: "Russia", countryCode: "RU", attacks: 287, abuseScore: 89, pulseCount: 6, color: "#ff2d55", sources: ["StaticIntel"], attackType: "Ransomware / APT" },
  { lat: 37.09, lng: -95.71, country: "USA", countryCode: "US", attacks: 198, abuseScore: 74, pulseCount: 5, color: "#ff6b35", sources: ["StaticIntel"], attackType: "Cybercrime" },
  { lat: 32.42, lng: 53.68, country: "Iran", countryCode: "IR", attacks: 156, abuseScore: 85, pulseCount: 7, color: "#ff2d55", sources: ["StaticIntel"], attackType: "State-Sponsored" },
  { lat: 20.59, lng: 78.96, country: "India", countryCode: "IN", attacks: 143, abuseScore: 66, pulseCount: 4, color: "#ffd60a", sources: ["StaticIntel"], attackType: "Phishing" },
  { lat: 48.37, lng: 31.16, country: "Ukraine", countryCode: "UA", attacks: 112, abuseScore: 72, pulseCount: 3, color: "#ff6b35", sources: ["StaticIntel"], attackType: "Hacktivism" },
  { lat: 52.13, lng: 5.29, country: "Netherlands", countryCode: "NL", attacks: 89, abuseScore: 58, pulseCount: 2, color: "#ffd60a", sources: ["StaticIntel"], attackType: "Botnet Hosting" },
  { lat: -14.23, lng: -51.92, country: "Brazil", countryCode: "BR", attacks: 98, abuseScore: 61, pulseCount: 3, color: "#ffd60a", sources: ["StaticIntel"], attackType: "Banking Trojans" },
  { lat: 14.05, lng: 108.27, country: "Vietnam", countryCode: "VN", attacks: 78, abuseScore: 60, pulseCount: 2, color: "#ffd60a", sources: ["StaticIntel"], attackType: "APT" },
  { lat: 9.08, lng: 8.67, country: "Nigeria", countryCode: "NG", attacks: 72, abuseScore: 64, pulseCount: 2, color: "#ffd60a", sources: ["StaticIntel"], attackType: "BEC / Fraud" },
  { lat: 51.16, lng: 10.45, country: "Germany", countryCode: "DE", attacks: 76, abuseScore: 53, pulseCount: 2, color: "#ffd60a", sources: ["StaticIntel"], attackType: "DDoS" },
  { lat: 37.09, lng: 127.77, country: "South Korea", countryCode: "KR", attacks: 65, abuseScore: 50, pulseCount: 1, color: "#30d158", sources: ["StaticIntel"], attackType: "Cryptojacking" },
];

// Country lat/lng lookup for arc targets
const COUNTRY_COORDS = {
  "USA": { lat: 37.09, lng: -95.71 }, "Germany": { lat: 51.16, lng: 10.45 },
  "UK": { lat: 55.37, lng: -3.43 }, "France": { lat: 46.22, lng: 2.21 },
  "Japan": { lat: 36.20, lng: 138.25 }, "Australia": { lat: -25.27, lng: 133.77 },
  "Canada": { lat: 56.13, lng: -106.34 }, "South Korea": { lat: 37.09, lng: 127.77 },
  "Israel": { lat: 31.04, lng: 34.85 }, "Singapore": { lat: 1.35, lng: 103.81 },
  "Netherlands": { lat: 52.13, lng: 5.29 }, "India": { lat: 20.59, lng: 78.96 },
  "Brazil": { lat: -14.23, lng: -51.92 }, "Taiwan": { lat: 23.68, lng: 120.96 },
  "Ukraine": { lat: 48.37, lng: 31.16 },
};

const ATTACK_TYPE_MAP = {
  "APT / Espionage": ["APT", "Zero-Day", "Spear Phishing", "Supply Chain", "Credential Theft"],
  "Ransomware / APT": ["Ransomware", "APT", "Wiper Malware", "Lateral Movement", "Exploit Kit"],
  "Cybercrime": ["Phishing", "BEC Fraud", "Card Skimming", "Credential Stuffing", "Botnet"],
  "State-Sponsored": ["APT", "Zero-Day", "Infrastructure Attack", "Spear Phishing", "Wiretapping"],
  "Phishing": ["Phishing", "Spear Phishing", "Credential Theft", "Malicious Email", "QR Phishing"],
  "Hacktivism": ["DDoS", "Defacement", "Data Leak", "Doxxing", "Website Takeover"],
  "Botnet Hosting": ["Botnet", "DDoS", "Spam Campaign", "Cryptojacking", "Port Scanning"],
  "Banking Trojans": ["Banking Trojan", "Card Skimming", "Account Takeover", "Malware Drop", "Keylogger"],
  "BEC / Fraud": ["BEC Fraud", "Wire Fraud", "Invoice Scam", "CEO Impersonation", "Phishing"],
  "Cryptojacking": ["Cryptojacking", "Botnet", "Drive-by Mining", "Cloud Hijack", "Script Injection"],
  "DDoS": ["DDoS", "Amplification Attack", "Botnet", "Volumetric Flood", "SYN Flood"],
  "Data Theft": ["Data Exfil", "SQL Injection", "API Abuse", "Insider Threat", "Credential Theft"],
};
const DEFAULT_ATTACKS = ["Phishing", "DDoS", "Malware", "Ransomware", "Port Scan", "Brute Force", "SQL Injection"];

const TARGET_POOL = [
  ...Array(6).fill("USA"), ...Array(4).fill("Germany"), ...Array(4).fill("UK"),
  ...Array(3).fill("France"), ...Array(3).fill("Japan"), ...Array(2).fill("Australia"),
  ...Array(2).fill("Canada"), ...Array(2).fill("South Korea"),
  "Israel", "Singapore", "Netherlands", "India", "Brazil", "Taiwan", "Ukraine",
];

function getSeverity(score) {
  const s = score || 50;
  if (s >= 80) return Math.random() < 0.65 ? { label: "CRITICAL", color: "#ff2d55" } : { label: "HIGH", color: "#ff6b35" };
  if (s >= 50) return Math.random() < 0.55 ? { label: "HIGH", color: "#ff6b35" } : { label: "MEDIUM", color: "#ffd60a" };
  return Math.random() < 0.4 ? { label: "MEDIUM", color: "#ffd60a" } : { label: "LOW", color: "#30d158" };
}

function weightedRandom(data) {
  const total = data.reduce((s, d) => s + (d.attacks || 1), 0);
  let r = Math.random() * total;
  for (const d of data) { r -= (d.attacks || 1); if (r <= 0) return d; }
  return data[0];
}

function generateFeedEvent(globeData, id) {
  const src = weightedRandom(globeData);
  const targets = TARGET_POOL.filter(t => t !== src.country);
  const tgt = targets[Math.floor(Math.random() * targets.length)];
  const tgtCoords = COUNTRY_COORDS[tgt];
  const types = ATTACK_TYPE_MAP[src.attackType] || DEFAULT_ATTACKS;
  const type = types[Math.floor(Math.random() * types.length)];
  const sev = getSeverity(src.abuseScore);
  const campaign = src.threatNames?.length && Math.random() < 0.35
    ? src.threatNames[Math.floor(Math.random() * src.threatNames.length)] : null;
  return {
    id, src: src.country, srcCode: src.countryCode,
    srcLat: src.lat, srcLng: src.lng,
    tgt, tgtLat: tgtCoords?.lat, tgtLng: tgtCoords?.lng,
    type, sev, campaign, abuseScore: src.abuseScore || 0, ts: new Date(),
  };
}

function generateTrend(baseAttacks, baseScore, seed) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let val = baseAttacks * 0.4, score = baseScore * 0.5;
  return months.map((month, i) => {
    const noise = (Math.sin(seed * 7 + i * 1.3) + 1) * 0.35, trend = 1 + (i / 11) * 0.6;
    val = Math.round(Math.max(5, val * (0.85 + noise * 0.35) * trend));
    score = Math.round(Math.min(100, Math.max(10, score * (0.9 + noise * 0.2) * (1 + i * 0.01))));
    return { month, attacks: val, score, pulses: Math.round(Math.max(1, (baseAttacks / 50) * (0.5 + noise))) };
  });
}

const SEEDS = { CN: 1.2, RU: 2.4, US: 0.8, IR: 3.1, IN: 1.7, UA: 2.9, NL: 0.5, BR: 1.4, VN: 2.2, NG: 3.5, DE: 0.6, GB: 1.1, KR: 2.7, TR: 1.9, PK: 3.3, RO: 0.9, HK: 2.0, MX: 1.6, BY: 3.8 };
function getSeed(cc) { return SEEDS[cc] || (cc.charCodeAt(0) * 0.01 + cc.charCodeAt(1) * 0.03); }

function getHeatColor(ratio) {
  if (ratio > 0.75) return `rgba(255,${Math.round(30 + (1 - ratio) * 80)},30,0.95)`;
  if (ratio > 0.5) return `rgba(255,${Math.round(100 + (0.75 - ratio) * 300)},30,0.9)`;
  if (ratio > 0.25) return `rgba(255,${Math.round(190 + (0.5 - ratio) * 100)},30,0.85)`;
  return `rgba(50,${Math.round(180 + ratio * 200)},80,0.8)`;
}
function timeAgo(ts) { const s = Math.floor((Date.now() - ts.getTime()) / 1000); return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`; }

// ── PDF EXPORT ────────────────────────────────────────────────────────────
function exportPDF(country, trendData) {
  // Build HTML report and print to PDF using browser's print dialog
  const scoreColor = country.abuseScore >= 80 ? "#ff2d55" : country.abuseScore >= 50 ? "#ff6b35" : "#ffd60a";
  const maxT = Math.max(...trendData.map(d => d.attacks), 1);
  const bars = trendData.map(d => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <div style="width:32px;font-size:10px;color:#888">${d.month}</div>
      <div style="flex:1;background:#111;height:14px;border-radius:2px;overflow:hidden">
        <div style="width:${Math.round((d.attacks / maxT) * 100)}%;height:100%;background:${scoreColor};opacity:0.8"></div>
      </div>
      <div style="width:30px;font-size:10px;color:#ccc;text-align:right">${d.attacks}</div>
    </div>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Threat Report — ${country.country}</title>
  <style>
    body{margin:0;padding:30px;background:#020810;color:#fff;font-family:monospace}
    h1{color:#00ff88;font-size:22px;letter-spacing:4px;border-bottom:1px solid #00ff8833;padding-bottom:12px}
    h2{color:#00ff88;font-size:12px;letter-spacing:3px;margin-top:24px;margin-bottom:8px}
    .badge{display:inline-block;padding:4px 12px;border-radius:2px;font-size:11px;letter-spacing:2px;margin-right:8px}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:12px 0}
    .stat{background:#0a1020;border:1px solid #1a2a40;padding:14px;border-radius:4px}
    .stat-num{font-size:26px;font-weight:bold;margin-bottom:4px}
    .stat-lbl{font-size:10px;color:#888;letter-spacing:2px}
    .campaign{background:#ff2d5510;border-left:3px solid #ff2d5540;padding:7px 10px;margin-bottom:5px;font-size:11px;color:#ccc}
    .footer{margin-top:30px;padding-top:12px;border-top:1px solid #1a2a40;font-size:10px;color:#444;display:flex;justify-content:space-between}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
    <div style="font-size:11px;color:#00ff8866;letter-spacing:3px">CYBERTHREAT GLOBE — THREAT INTELLIGENCE REPORT</div>
    <div style="font-size:10px;color:#444">${new Date().toUTCString()}</div>
  </div>
  <h1>${country.country} <span style="font-size:14px;color:#888">[${country.countryCode}]</span></h1>
  <div>
    <span class="badge" style="background:${scoreColor}22;border:1px solid ${scoreColor}44;color:${scoreColor}">${country.attackType || "Unknown"}</span>
    ${(country.sources || []).map(s => `<span class="badge" style="background:#ffffff08;border:1px solid #ffffff15;color:#888">${s}</span>`).join("")}
  </div>
  <div class="grid" style="margin-top:16px">
    <div class="stat"><div class="stat-num" style="color:#ff2d55">${(country.attacks || 0).toLocaleString()}</div><div class="stat-lbl">TOTAL INCIDENTS</div></div>
    <div class="stat"><div class="stat-num" style="color:#ff6b35">${country.abuseScore || 0}</div><div class="stat-lbl">ABUSE SCORE / 100</div></div>
    <div class="stat"><div class="stat-num" style="color:#ffd60a">${country.pulseCount || 0}</div><div class="stat-lbl">OTX PULSES</div></div>
  </div>
  <h2>12-MONTH INCIDENT TREND</h2>
  <div style="background:#0a1020;border:1px solid #1a2a40;padding:16px;border-radius:4px">${bars}</div>
  ${country.threatNames?.length ? `<h2>ACTIVE THREAT CAMPAIGNS</h2>${country.threatNames.map(n => `<div class="campaign">${n}</div>`).join("")}` : ""}
  <h2>ATTACK VECTOR BREAKDOWN</h2>
  <div style="background:#0a1020;border:1px solid #1a2a40;padding:16px;border-radius:4px">
    ${[["PHISHING", 38], ["MALWARE", 27], ["RANSOMWARE", 19], ["DDOS", 11], ["OTHER", 5]].map(([l, p]) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="width:80px;font-size:10px;color:#888">${l}</div>
      <div style="flex:1;background:#111;height:10px;border-radius:2px;overflow:hidden">
        <div style="width:${p}%;height:100%;background:${scoreColor};opacity:0.7"></div>
      </div>
      <div style="width:28px;font-size:10px;color:#888">${p}%</div>
    </div>`).join("")}
  </div>
  <div class="footer">
    <span>Generated by CyberThreat Globe · OTX + AbuseIPDB</span>
    <span>Data as of ${new Date().toLocaleDateString()}</span>
  </div>
  </body></html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}

// ── THREAT SCORE HISTORY (localStorage) ──────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem("cg_score_history") || "{}"); } catch { return {}; }
}
function saveHistory(globeData) {
  try {
    const h = {};
    globeData.forEach(d => { h[d.countryCode] = { score: d.abuseScore || 0, attacks: d.attacks || 0, ts: Date.now() }; });
    localStorage.setItem("cg_score_history", JSON.stringify(h));
  } catch { }
}
function getDelta(cc, current, history) {
  const prev = history[cc];
  if (!prev) return null;
  const d = (current || 0) - (prev.score || 0);
  return d === 0 ? null : d;
}

// ── FILTER TYPES ──────────────────────────────────────────────────────────
const FILTER_TYPES = [
  { key: "all", label: "ALL", color: "#00ff88" },
  { key: "apt", label: "APT", color: "#ff2d55" },
  { key: "ransom", label: "RANSOMWARE", color: "#ff6b35" },
  { key: "phishing", label: "PHISHING", color: "#ffd60a" },
  { key: "ddos", label: "DDoS", color: "#00bfff" },
  { key: "fraud", label: "FRAUD", color: "#bf5fff" },
];
function matchesFilter(d, key) {
  if (key === "all") return true;
  const t = (d.attackType || "").toLowerCase();
  if (key === "apt") return t.includes("apt") || t.includes("espionage") || t.includes("state");
  if (key === "ransom") return t.includes("ransom");
  if (key === "phishing") return t.includes("phish");
  if (key === "ddos") return t.includes("ddos") || t.includes("hacktivism");
  if (key === "fraud") return t.includes("fraud") || t.includes("banking") || t.includes("crypto");
  return true;
}

const ChartTooltip = ({ active, payload, label, color }) => {
  if (!active || !payload?.length) return null;
  return <div style={{ background: "rgba(2,8,16,0.97)", border: `1px solid ${color}44`, padding: "7px 11px", fontSize: 9, fontFamily: "Share Tech Mono,monospace" }}>
    <div style={{ color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 3 }}>{label}</div>
    {payload.map(p => <div key={p.name} style={{ color: p.color || color, letterSpacing: 1 }}>{p.name.toUpperCase()}: <b>{p.value}</b></div>)}
  </div>;
};

function ThreatRing({ label, value, max, color, delta }) {
  const pct = Math.min((value / max) * 100, 100), r = 26, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
    <svg width="66" height="66" viewBox="0 0 66 66">
      <circle cx="33" cy="33" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx="33" cy="33" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 33 33)" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x="33" y="37" textAnchor="middle" fill={color} style={{ fontSize: "12px", fontFamily: "Orbitron,monospace", fontWeight: 700 }}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </text>
    </svg>
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <div style={{ fontSize: 7, letterSpacing: 2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>{label}</div>
      {delta != null && <div style={{ fontSize: 8, color: delta > 0 ? "#ff2d55" : "#30d158", fontWeight: "bold" }}>{delta > 0 ? `↑+${delta}` : `↓${delta}`}</div>}
    </div>
  </div>;
}

function TabBtn({ active, onClick, children }) {
  return <button onClick={onClick} style={{ padding: "4px 10px", fontSize: 8, letterSpacing: 2, cursor: "pointer", fontFamily: "Share Tech Mono,monospace", background: active ? "rgba(0,255,136,0.1)" : "transparent", border: active ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.07)", color: active ? "#00ff88" : "rgba(255,255,255,0.3)", transition: "all 0.2s" }}>{children}</button>;
}

// ── LEFT PANEL ────────────────────────────────────────────────────────────
function LeftPanel({ feedEvents, globeData, onCountryClick, activeTab, setActiveTab }) {
  const sorted = useMemo(() => [...globeData].sort((a, b) => (b.attacks || 0) - (a.attacks || 0)).slice(0, 10), [globeData]);
  const maxA = sorted[0]?.attacks || 1;
  return <div style={{ position: "fixed", left: 0, top: 56, bottom: 50, width: 270, zIndex: 50, background: "rgba(2,8,16,0.96)", borderRight: "1px solid rgba(0,255,136,0.1)", display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", borderBottom: "1px solid rgba(0,255,136,0.08)" }}>
      {[["feed", "⚡ LIVE FEED"], ["board", "🏆 TOP 10"]].map(([t, label]) => (
        <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: "10px 0", fontSize: 8, letterSpacing: 2, cursor: "pointer", fontFamily: "Share Tech Mono,monospace", background: activeTab === t ? "rgba(0,255,136,0.07)" : "transparent", border: "none", borderBottom: activeTab === t ? "2px solid #00ff88" : "2px solid transparent", color: activeTab === t ? "#00ff88" : "rgba(255,255,255,0.28)", transition: "all 0.2s" }}>{label}</button>
      ))}
    </div>
    {activeTab === "feed" && <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
      <div style={{ padding: "4px 12px 8px", fontSize: 7, letterSpacing: 3, color: "rgba(0,255,136,0.35)" }}>▸ REAL-TIME THREAT EVENTS</div>
      {feedEvents.map((ev, i) => (
        <div key={ev.id} style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: i === 0 ? `${ev.sev.color}08` : "transparent", animation: i === 0 ? "slideIn 0.35s ease" : "none", borderLeft: `2px solid ${ev.sev.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: ev.sev.color, boxShadow: `0 0 4px ${ev.sev.color}` }} />
              <span style={{ fontSize: 8, color: ev.sev.color, letterSpacing: 1.5, fontWeight: "bold" }}>{ev.sev.label}</span>
            </div>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>{timeAgo(ev.ts)}</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 0.3, marginBottom: 3 }}>
            <span style={{ color: "#ff6b35", fontWeight: "bold" }}>{ev.srcCode}</span>
            <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 6px", fontSize: 9 }}>──▶</span>
            <span style={{ color: "#00ff88" }}>{ev.tgt}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.04)", padding: "2px 6px" }}>{ev.type}</span>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>score:{ev.abuseScore}</span>
          </div>
          {ev.campaign && <div style={{ marginTop: 3, fontSize: 7, color: "rgba(255,214,10,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>◈ {ev.campaign}</div>}
        </div>
      ))}
    </div>}
    {activeTab === "board" && <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
      <div style={{ padding: "4px 12px 8px", fontSize: 7, letterSpacing: 3, color: "rgba(0,255,136,0.35)" }}>▸ MOST ACTIVE THREAT ORIGINS</div>
      {sorted.map((d, i) => {
        const pct = ((d.attacks || 0) / maxA) * 100;
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        const rankColor = i === 0 ? "#ffd60a" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "rgba(255,255,255,0.3)";
        return <div key={d.countryCode} onClick={() => onCountryClick(d)}
          style={{ padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,255,136,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ fontFamily: "Orbitron,monospace", fontSize: 11, fontWeight: 700, color: rankColor, minWidth: 20 }}>{medal || `#${i + 1}`}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#fff" }}>{d.country}</span>
                <span style={{ fontFamily: "Orbitron,monospace", fontSize: 10, fontWeight: 700, color: d.heatColor || "#ff2d55" }}>{(d.attacks || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
                <span style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>{d.attackType || "Unknown"}</span>
                <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>score:{d.abuseScore || 0}</span>
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", height: 3, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: d.heatColor || "#ff2d55", borderRadius: 2, boxShadow: `0 0 4px ${d.heatColor || "#ff2d55"}` }} />
          </div>
        </div>;
      })}
    </div>}
  </div>;
}

// ── SEARCH BAR ────────────────────────────────────────────────────────────
function SearchBar({ globeData, onSelect }) {
  const [query, setQuery] = useState(""), [open, setOpen] = useState(false), [focused, setFocused] = useState(false);
  const ref = useRef();
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return globeData.filter(d => d.country.toLowerCase().includes(q) || d.countryCode.toLowerCase().includes(q)).slice(0, 6);
  }, [query, globeData]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return <div ref={ref} style={{ position: "relative", width: 210 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(2,8,16,0.9)", border: `1px solid ${focused ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)"}`, transition: "border 0.2s" }}>
      <span style={{ fontSize: 11, color: "rgba(0,255,136,0.5)" }}>⌕</span>
      <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => { setFocused(true); setOpen(true); }} onBlur={() => setFocused(false)}
        placeholder="Search country..." style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: 9, letterSpacing: 2, color: "#fff", fontFamily: "Share Tech Mono,monospace" }} />
      {query && <span onClick={() => { setQuery(""); setOpen(false); }} style={{ cursor: "pointer", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>✕</span>}
    </div>
    {open && results.length > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: "rgba(2,8,16,0.98)", border: "1px solid rgba(0,255,136,0.15)", borderTop: "none", maxHeight: 220, overflowY: "auto" }}>
      {results.map(d => (
        <div key={d.countryCode} onClick={() => { onSelect(d); setQuery(""); setOpen(false); }}
          style={{ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,255,136,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div style={{ width: 28, height: 18, background: `${d.heatColor || "#ff2d55"}22`, border: `1px solid ${d.heatColor || "#ff2d55"}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, color: d.heatColor || "#ff2d55", fontWeight: "bold", letterSpacing: 1 }}>{d.countryCode}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#fff" }}>{d.country}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,0.28)", marginTop: 1, letterSpacing: 1 }}>{(d.attacks || 0).toLocaleString()} incidents · {d.attackType || "Unknown"}</div>
          </div>
          <div style={{ fontFamily: "Orbitron,monospace", fontSize: 9, color: d.heatColor || "#ff2d55" }}>{d.abuseScore || 0}</div>
        </div>
      ))}
    </div>}
  </div>;
}

// ── CINEMATIC INTRO ───────────────────────────────────────────────────────
function CinematicIntro({ onDone }) {
  const [phase, setPhase] = useState(0);
  const phases = ["CONNECTING TO THREAT NETWORK...", "LOADING ALIENVAULT OTX FEED...", "PROCESSING ABUSEIPDB DATA...", "CALIBRATING GLOBE COORDINATES...", "SYSTEM ONLINE"];
  useEffect(() => {
    const timers = [];
    phases.forEach((_, i) => timers.push(setTimeout(() => setPhase(i), i * 700)));
    timers.push(setTimeout(onDone, phases.length * 700 + 600));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#020810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
    {/* Animated grid */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,136,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", animation: "gridFade 1s ease forwards" }} />
    {/* Center content */}
    <div style={{ position: "relative", textAlign: "center" }}>
      <div style={{ fontFamily: "Orbitron,monospace", fontSize: 32, fontWeight: 900, letterSpacing: 8, color: "#00ff88", textShadow: "0 0 40px rgba(0,255,136,0.6)", marginBottom: 8 }}>
        CYBER<span style={{ color: "#ff2d55" }}>THREAT</span>
      </div>
      <div style={{ fontFamily: "Orbitron,monospace", fontSize: 14, letterSpacing: 12, color: "rgba(0,255,136,0.5)", marginBottom: 40 }}>GLOBE</div>
      {/* Progress lines */}
      <div style={{ width: 320, textAlign: "left" }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: i <= phase ? 1 : 0.1, transition: "opacity 0.4s" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < phase ? "#00ff88" : i === phase ? "#ffd60a" : "rgba(255,255,255,0.1)", boxShadow: i === phase ? "0 0 8px #ffd60a" : "none", flexShrink: 0, transition: "all 0.3s" }} />
            <div style={{ fontSize: 9, letterSpacing: 2, color: i < phase ? "#00ff88" : i === phase ? "#ffd60a" : "rgba(255,255,255,0.2)", transition: "color 0.3s" }}>{p}</div>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{ width: 320, height: 2, background: "rgba(255,255,255,0.05)", marginTop: 16, borderRadius: 1, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right,#00ff88,#ffd60a)", width: `${((phase + 1) / phases.length) * 100}%`, transition: "width 0.7s ease", boxShadow: "0 0 8px #00ff88" }} />
      </div>
    </div>
  </div>;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function CyberGlobe() {
  const globeEl = useRef();
  const [globeData, setGlobeData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [apiStatus, setApiStatus] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tick, setTick] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [chartTab, setChartTab] = useState("attacks");
  const [leftTab, setLeftTab] = useState("feed");
  const [feedEvents, setFeedEvents] = useState([]);
  const [liveArcs, setLiveArcs] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [scoreHistory, setScoreHistory] = useState({});
  const feedIdRef = useRef(1000);
  const arcIdRef = useRef(0);

  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i); }, []);

  useEffect(() => {
    if (globeEl.current && !loading) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
      globeEl.current.pointOfView({ altitude: 2.2 });
    }
  }, [loading]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/combined`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        const prev = loadHistory();
        setScoreHistory(prev);
        saveHistory(json.data);
        setGlobeData(json.data);
        setApiStatus(json.apiStatus || {});
        setUsingFallback(false);
      } else throw new Error("empty");
    } catch {
      setGlobeData(FALLBACK_DATA);
      setApiStatus({});
      setUsingFallback(true);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => { fetchData(); const ri = setInterval(fetchData, 5 * 60 * 1000); return () => clearInterval(ri); }, [fetchData]);

  // Feed + live arcs
  useEffect(() => {
    if (!globeData.length) return;
    const initial = Array.from({ length: 12 }, (_, i) => {
      const ev = generateFeedEvent(globeData, feedIdRef.current++);
      ev.ts = new Date(Date.now() - (12 - i) * 8000); return ev;
    });
    setFeedEvents(initial);
    const interval = setInterval(() => {
      const ev = generateFeedEvent(globeData, feedIdRef.current++);
      setFeedEvents(prev => [ev, ...prev].slice(0, 40));
      // Add live arc if coords exist
      if (ev.tgtLat && ev.tgtLng) {
        const arcId = arcIdRef.current++;
        const newArc = {
          id: arcId, startLat: ev.srcLat, startLng: ev.srcLng,
          endLat: ev.tgtLat, endLng: ev.tgtLng,
          color: [ev.sev.color, `${ev.sev.color}00`],
        };
        setLiveArcs(prev => [...prev, newArc]);
        // Remove arc after 4 seconds
        setTimeout(() => setLiveArcs(prev => prev.filter(a => a.id !== arcId)), 4000);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [globeData]);

  const maxAttacks = Math.max(...globeData.map(d => d.attacks || 1), 1);
  const maxPulses = Math.max(...globeData.map(d => d.pulseCount || 1), 1);
  const totalAttacks = globeData.reduce((s, d) => s + (d.attacks || 0), 0);
  const totalPulses = globeData.reduce((s, d) => s + (d.pulseCount || 0), 0);
  const topCountry = [...globeData].sort((a, b) => (b.attacks || 0) - (a.attacks || 0))[0];
  const liveCount = totalAttacks + tick * 2;

  const coloredData = globeData.map(d => ({
    ...d,
    heatColor: getHeatColor((d.attacks || 0) / maxAttacks),
    size: 0.3 + ((d.attacks || 0) / maxAttacks) * 0.8,
  }));

  // Filtered data for globe
  const filteredData = useMemo(() =>
    coloredData.map(d => ({ ...d, dimmed: !matchesFilter(d, activeFilter) }))
    , [coloredData, activeFilter]);

  const trendData = useMemo(() => {
    if (!selected) return [];
    return generateTrend(selected.attacks || 50, selected.abuseScore || 40, getSeed(selected.countryCode || "US"));
  }, [selected]);

  const abuseOK = apiStatus.abuseStatus === "live";
  const otxOK = apiStatus.otxStatus === "live";
  const accentColor = selected?.heatColor || "#00ff88";
  const scoreDelta = selected ? getDelta(selected.countryCode, selected.abuseScore, scoreHistory) : null;

  const chartConfig = {
    attacks: { key: "attacks", label: "Incidents", color: "#ff2d55", gradId: "grad-a" },
    score: { key: "score", label: "Abuse Score", color: "#ff6b35", gradId: "grad-s" },
    pulses: { key: "pulses", label: "OTX Pulses", color: "#ffd60a", gradId: "grad-p" },
  };
  const cfg = chartConfig[chartTab];

  const jumpToCountry = useCallback((d) => {
    setSelected(d); setChartTab("attacks");
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      globeEl.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 900);
    }
  }, []);

  return <div style={{ width: "100vw", height: "100vh", background: "#020810", fontFamily: "'Share Tech Mono',monospace", overflow: "hidden", position: "relative" }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:2px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(0,255,136,0.15);border-radius:2px}
      .scan{position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,0.009) 2px,rgba(0,255,136,0.009) 4px);pointer-events:none;z-index:100}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
      @keyframes fadeIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
      @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes gridFade{from{opacity:0}to{opacity:1}}
      .blink{animation:blink 1.2s ease infinite}
      .corner{position:fixed;width:18px;height:18px;border-color:rgba(0,255,136,0.1);z-index:50}
      .tl{top:4px;left:4px;border-top:1px solid;border-left:1px solid}
      .tr{top:4px;right:4px;border-top:1px solid;border-right:1px solid}
      .bl{bottom:4px;left:4px;border-bottom:1px solid;border-left:1px solid}
      .br{bottom:4px;right:4px;border-bottom:1px solid;border-right:1px solid}
      .rpanel{position:fixed;right:0;top:56px;bottom:50px;width:310px;z-index:50;background:rgba(2,8,16,0.97);border-left:1px solid rgba(0,255,136,0.1);overflow-y:auto;animation:fadeIn 0.25s ease;padding:16px 15px}
      .sec{font-size:7px;letter-spacing:3px;color:rgba(0,255,136,0.38);text-transform:uppercase;margin-bottom:8px}
      .div{height:1px;background:rgba(255,255,255,0.05);margin:13px 0}
    `}</style>

    <div className="scan" />
    <div className="corner tl" /><div className="corner tr" />
    <div className="corner bl" /><div className="corner br" />

    {/* CINEMATIC INTRO */}
    {showIntro && <CinematicIntro onDone={() => setShowIntro(false)} />}

    {usingFallback && !loading && !showIntro && (
      <div style={{ position: "fixed", top: 58, left: "50%", transform: "translateX(-50%)", zIndex: 60, padding: "5px 16px", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", fontSize: 8, letterSpacing: 2, color: "#ff6b35", whiteSpace: "nowrap" }}>
        ⚠ BACKEND OFFLINE — CACHED INTEL
      </div>
    )}

    {/* HEADER */}
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "0 22px", height: 56, background: "rgba(2,8,16,0.98)", borderBottom: "1px solid rgba(0,255,136,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div style={{ fontFamily: "Orbitron,monospace", fontSize: 15, fontWeight: 900, letterSpacing: 4, color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.35)", whiteSpace: "nowrap" }}>
        CYBER<span style={{ color: "#ff2d55" }}>THREAT</span> GLOBE
      </div>
      {!loading && <SearchBar globeData={coloredData} onSelect={jumpToCountry} />}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {[{ label: "ABUSEIPDB", ok: abuseOK, fallback: apiStatus.abuseStatus === "static" }, { label: "OTX", ok: otxOK, fallback: false }].map(({ label, ok, fallback }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", border: "1px solid rgba(255,255,255,0.06)", fontSize: 8, letterSpacing: 1.5 }}>
            <div className="blink" style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#00ff88" : fallback ? "#ffd60a" : "#ff2d55", boxShadow: `0 0 5px ${ok ? "#00ff88" : fallback ? "#ffd60a" : "#ff2d55"}` }} />
            <span style={{ color: ok ? "#00ff88" : fallback ? "#ffd60a" : "#ff2d55" }}>{label} {ok ? "LIVE" : fallback ? "CACHED" : "OFF"}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, letterSpacing: 2, color: "#ff2d55" }}>
          <div className="blink" style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff2d55", boxShadow: "0 0 8px #ff2d55" }} />LIVE
        </div>
      </div>
    </div>

    {/* FILTER BAR */}
    {!loading && !showIntro && (
      <div style={{ position: "fixed", top: 56, left: 270, right: selected ? 310 : 0, zIndex: 49, padding: "6px 16px", background: "rgba(2,8,16,0.9)", borderBottom: "1px solid rgba(0,255,136,0.06)", display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ fontSize: 7, letterSpacing: 3, color: "rgba(0,255,136,0.3)", marginRight: 4 }}>FILTER:</div>
        {FILTER_TYPES.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
            padding: "3px 10px", fontSize: 8, letterSpacing: 1.5, cursor: "pointer", fontFamily: "Share Tech Mono,monospace",
            background: activeFilter === f.key ? `${f.color}18` : "transparent",
            border: `1px solid ${activeFilter === f.key ? f.color : "rgba(255,255,255,0.08)"}`,
            color: activeFilter === f.key ? f.color : "rgba(255,255,255,0.3)", transition: "all 0.2s",
          }}>{f.label}</button>
        ))}
      </div>
    )}

    {/* LEFT PANEL */}
    {!loading && !showIntro && (
      <LeftPanel feedEvents={feedEvents} globeData={coloredData} onCountryClick={jumpToCountry} activeTab={leftTab} setActiveTab={setLeftTab} />
    )}

    {/* GLOBE */}
    {!loading && (
      <Globe ref={globeEl}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        atmosphereColor="rgba(0,200,100,0.08)" atmosphereAltitude={0.12}
        ringsData={filteredData}
        ringLat="lat" ringLng="lng"
        ringMaxRadius={d => 3 + d.size * 4} ringPropagationSpeed={1.5}
        ringRepeatPeriod={d => 1200 + (1 - d.size) * 800}
        ringColor={d => () => d.dimmed ? "rgba(255,255,255,0.06)" : d.heatColor}
        ringAltitude={0.001}
        pointsData={filteredData}
        pointLat="lat" pointLng="lng" pointAltitude={0.001}
        pointRadius={d => hovered?.country === d.country ? d.size * 1.6 + 0.5 : d.size * 1.2 + 0.3}
        pointColor={d => selected?.country === d.country ? "#ffffff" : d.dimmed ? "rgba(255,255,255,0.08)" : d.heatColor}
        pointLabel={d => d.dimmed ? "" :
          `<div style="font-family:Share Tech Mono,monospace;background:rgba(2,8,16,0.97);border:1px solid ${d.heatColor};padding:9px 13px;min-width:150px">
            <div style="font-size:14px;font-weight:bold;color:${d.heatColor}">${d.country}</div>
            <div style="color:#ff2d55;font-size:15px;font-weight:bold;margin:3px 0">${(d.attacks || 0).toLocaleString()} incidents</div>
            ${d.attackType ? `<div style="color:rgba(255,255,255,0.35);font-size:8px;letter-spacing:2px">${d.attackType}</div>` : ""}
          </div>`
        }
        onPointClick={d => { if (!d.dimmed) jumpToCountry(d); }}
        onPointHover={setHovered}
        arcsData={liveArcs}
        arcStartLat="startLat" arcStartLng="startLng"
        arcEndLat="endLat" arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.3} arcDashGap={0.1} arcDashAnimateTime={1200}
        arcStroke={0.5} arcAltitude={0.2}
        width={typeof window !== "undefined" ? window.innerWidth : 1280}
        height={typeof window !== "undefined" ? window.innerHeight : 720}
      />
    )}

    {/* LEGEND */}
    {!loading && !showIntro && (
      <div style={{ position: "fixed", left: 280, bottom: 58, zIndex: 50 }}>
        <div style={{ fontSize: 7, letterSpacing: 3, color: "rgba(0,255,136,0.38)", marginBottom: 6 }}>▸ THREAT INTENSITY</div>
        <div style={{ width: 120, height: 6, borderRadius: 3, background: "linear-gradient(to right,rgba(50,210,80,0.9),rgba(255,220,10,0.9),rgba(255,107,53,0.9),rgba(255,30,50,0.95))", border: "1px solid rgba(255,255,255,0.07)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 7, color: "rgba(255,255,255,0.22)" }}>
          <span>LOW</span><span>MED</span><span>HIGH</span><span>CRIT</span>
        </div>
      </div>
    )}

    {/* RIGHT PANEL */}
    {selected && (
      <div className="rpanel">
        <div style={{ height: 2, borderRadius: 2, background: accentColor, boxShadow: `0 0 10px ${accentColor}`, marginBottom: 14 }} />
        <div className="sec">▸ THREAT INTELLIGENCE</div>
        <div style={{ fontFamily: "Orbitron,monospace", fontSize: 19, fontWeight: 900, color: "#fff" }}>{selected.country}</div>
        <div style={{ fontSize: 8, letterSpacing: 3, color: "rgba(255,255,255,0.18)", marginTop: 2 }}>{selected.countryCode}</div>
        {selected.attackType && <div style={{ display: "inline-block", marginTop: 9, padding: "4px 11px", background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.22)", color: "#ff6b35", fontSize: 8, letterSpacing: 2 }}>{selected.attackType}</div>}

        {/* Score delta banner */}
        {scoreDelta != null && (
          <div style={{ marginTop: 8, padding: "6px 10px", background: scoreDelta > 0 ? "rgba(255,45,85,0.08)" : "rgba(48,209,88,0.08)", border: `1px solid ${scoreDelta > 0 ? "rgba(255,45,85,0.2)" : "rgba(48,209,88,0.2)"}`, fontSize: 9, color: scoreDelta > 0 ? "#ff2d55" : "#30d158", letterSpacing: 1.5 }}>
            {scoreDelta > 0 ? `↑ Threat increased by +${scoreDelta} since last visit` : `↓ Threat decreased by ${scoreDelta} since last visit`}
          </div>
        )}

        {/* Rings */}
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <ThreatRing label="Incidents" value={selected.attacks || 0} max={maxAttacks} color="#ff2d55" delta={null} />
          <ThreatRing label="OTX Pulses" value={selected.pulseCount || 0} max={maxPulses} color="#ffd60a" delta={null} />
          <ThreatRing label="Abuse Score" value={selected.abuseScore || 0} max={100} color="#ff6b35" delta={scoreDelta} />
        </div>

        {/* Trend */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="sec" style={{ margin: 0 }}>▸ 12-MONTH TREND</div>
            <div style={{ display: "flex", gap: 4 }}>
              <TabBtn active={chartTab === "attacks"} onClick={() => setChartTab("attacks")}>INC</TabBtn>
              <TabBtn active={chartTab === "score"} onClick={() => setChartTab("score")}>SCORE</TabBtn>
              <TabBtn active={chartTab === "pulses"} onClick={() => setChartTab("pulses")}>OTX</TabBtn>
            </div>
          </div>
          <div key={chartTab} style={{ animation: "slideUp 0.25s ease" }}>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id={cfg.gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cfg.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 7, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 7, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip color={cfg.color} />} />
                <Area type="monotone" dataKey={cfg.key} name={cfg.label} stroke={cfg.color} strokeWidth={1.5} fill={`url(#${cfg.gradId})`} dot={false} activeDot={{ r: 3, fill: cfg.color, stroke: "none" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginTop: 8 }}>
            {[
              { label: "PEAK", value: Math.max(...trendData.map(d => d[cfg.key])), color: cfg.color },
              { label: "AVG", value: Math.round(trendData.reduce((s, d) => s + d[cfg.key], 0) / Math.max(trendData.length, 1)), color: "rgba(255,255,255,0.45)" },
              { label: "LATEST", value: trendData[trendData.length - 1]?.[cfg.key] || 0, color: "#00ff88" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: "7px 5px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                <div style={{ fontFamily: "Orbitron,monospace", fontSize: 13, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 7, letterSpacing: 2, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly bar */}
        <div className="div" />
        <div className="sec">▸ MONTHLY BREAKDOWN</div>
        <ResponsiveContainer width="100%" height={70}>
          <BarChart data={trendData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 6, fontFamily: "Share Tech Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip color={accentColor} />} />
            <Bar dataKey="attacks" name="Incidents" fill={accentColor} opacity={0.7} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Sources */}
        <div className="div" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {(selected.sources || []).map(s => {
            const c = s === "AbuseIPDB" ? "#ff2d55" : s === "OTX" ? "#ffd60a" : "#666";
            return <span key={s} style={{ padding: "3px 9px", border: `1px solid ${c}44`, background: `${c}11`, color: c, fontSize: 8, letterSpacing: 1.5 }}>{s}</span>;
          })}
        </div>

        {/* Campaigns */}
        {selected.threatNames?.length > 0 && <div style={{ marginTop: 13 }}>
          <div className="sec">▸ ACTIVE CAMPAIGNS</div>
          {selected.threatNames.map((name, i) => (
            <div key={i} style={{ padding: "6px 9px", marginBottom: 4, background: "rgba(255,45,85,0.04)", borderLeft: "2px solid rgba(255,45,85,0.28)", fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{name}</div>
          ))}
        </div>}

        {/* Attack vectors */}
        <div style={{ marginTop: 13 }}>
          <div className="sec">▸ ATTACK VECTORS</div>
          {[["PHISHING", 38, "#ffd60a"], ["MALWARE", 27, "#ff6b35"], ["RANSOMWARE", 19, "#ff2d55"], ["DDOS", 11, "#00ff88"], ["OTHER", 5, "rgba(255,255,255,0.18)"]].map(([l, p, c]) => (
            <div key={l} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <div style={{ fontSize: 7, letterSpacing: 2, color: "rgba(255,255,255,0.28)" }}>{l}</div>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.28)" }}>{p}%</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", height: 3, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${p}%`, background: c, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {lastUpdated && <div style={{ marginTop: 12, fontSize: 7, letterSpacing: 2, color: "rgba(0,255,136,0.18)" }}>SYNCED: {lastUpdated.toLocaleTimeString()}</div>}

        {/* Export PDF */}
        <button onClick={() => exportPDF(selected, trendData)}
          style={{ width: "100%", padding: "9px", marginTop: 12, background: "rgba(255,214,10,0.06)", border: "1px solid rgba(255,214,10,0.25)", color: "#ffd60a", fontFamily: "Share Tech Mono,monospace", fontSize: 9, letterSpacing: 3, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.target.style.background = "rgba(255,214,10,0.12)"; }}
          onMouseLeave={e => { e.target.style.background = "rgba(255,214,10,0.06)"; }}>
          ⬇ EXPORT THREAT REPORT PDF
        </button>
        <button onClick={fetchData}
          style={{ width: "100%", padding: "8px", marginTop: 6, background: "transparent", border: "1px solid rgba(0,255,136,0.18)", color: "rgba(0,255,136,0.5)", fontFamily: "Share Tech Mono,monospace", fontSize: 9, letterSpacing: 3, cursor: "pointer" }}
          onMouseEnter={e => e.target.style.background = "rgba(0,255,136,0.05)"}
          onMouseLeave={e => e.target.style.background = "transparent"}>↻ REFRESH DATA</button>
        <button onClick={() => { setSelected(null); if (globeEl.current) { globeEl.current.controls().autoRotate = true; globeEl.current.pointOfView({ altitude: 2.2 }, 900); } }}
          style={{ width: "100%", padding: "8px", marginTop: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.22)", fontFamily: "Share Tech Mono,monospace", fontSize: 9, letterSpacing: 3, cursor: "pointer" }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.03)"}
          onMouseLeave={e => e.target.style.background = "transparent"}>◂ BACK TO GLOBE</button>
      </div>
    )}

    {/* STATS BAR */}
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, padding: "9px 22px 9px 280px", background: "linear-gradient(0deg,rgba(2,8,16,0.98) 0%,transparent 100%)", borderTop: "1px solid rgba(0,255,136,0.07)", display: "flex", gap: 28, alignItems: "center" }}>
      {[
        { label: "INCIDENTS (LIVE)", value: liveCount.toLocaleString(), color: "#ff2d55" },
        { label: "OTX PULSES", value: totalPulses.toLocaleString(), color: "#ffd60a" },
        { label: "TOP THREAT", value: topCountry?.country || "—", color: "#00ff88" },
        { label: "COUNTRIES", value: globeData.length, color: "#00ff88" },
        { label: "LIVE ARCS", value: liveArcs.length, color: "#ff6b35" },
        { label: "FILTER", value: activeFilter.toUpperCase(), color: "rgba(255,255,255,0.4)" },
        ...(lastUpdated ? [{ label: "LAST SYNC", value: lastUpdated.toLocaleTimeString(), color: "rgba(255,255,255,0.25)" }] : []),
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 7, letterSpacing: 3, color: "rgba(0,255,136,0.3)", textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontFamily: "Orbitron,monospace", fontSize: 12, fontWeight: 700, color }}>{value}</div>
        </div>
      ))}
    </div>
  </div>;
}