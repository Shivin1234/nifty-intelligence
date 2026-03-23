import { useState, useEffect } from "react";
import ChartSection from "./ChartSection";

const API = "https://nifty-intelligence-api.onrender.com";

const strategyDetails = {
  "Bull Call Spread":       { risk: "Limited",  reward: "Limited",   sentiment: "Bullish", color: "#00ff87" },
  "Long Call":              { risk: "Premium",  reward: "Unlimited", sentiment: "Bullish", color: "#00ff87" },
  "Long Call (aggressive)": { risk: "Premium",  reward: "Unlimited", sentiment: "Bullish", color: "#00ff87" },
  "Bear Put Spread":        { risk: "Limited",  reward: "Limited",   sentiment: "Bearish", color: "#ff4d6d" },
  "Long Put":               { risk: "Premium",  reward: "High",      sentiment: "Bearish", color: "#ff4d6d" },
  "Long Put (aggressive)":  { risk: "Premium",  reward: "High",      sentiment: "Bearish", color: "#ff4d6d" },
  "Iron Condor":            { risk: "Limited",  reward: "Limited",   sentiment: "Neutral", color: "#ffd60a" },
  "Short Strangle":         { risk: "High",     reward: "Premium",   sentiment: "Neutral", color: "#ffd60a" },
  "Short Straddle":         { risk: "High",     reward: "Premium",   sentiment: "Neutral", color: "#ffd60a" },
  "No clear strategy":      { risk: "—",        reward: "—",         sentiment: "Unclear", color: "#888"    },
};

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", color: "#999", textTransform: "uppercase", marginBottom: "14px" }}>
      {children}
    </div>
  );
}

function GlowCard({ children, accent = "#00ff87", style = {} }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${h ? accent + "55" : "#ffffff12"}`, borderRadius: "16px", padding: "20px", transition: "all 0.3s", transform: h ? "translateY(-2px)" : "translateY(0)", boxShadow: h ? `0 8px 32px ${accent}18` : "none", ...style }}>
      {children}
    </div>
  );
}

// ── PRICE HERO ──────────────────────────────────────────────────────────
function PriceHero({ data, directionColor }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!data?.latest_close) return;
    const price = data.latest_close;
    const dur = 1400, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(price * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [data?.latest_close]);

  const cfg = {
    UP:       { icon: "▲", color: "#00ff87", bg: "#00ff8715", label: "BULLISH"  },
    DOWN:     { icon: "▼", color: "#ff4d6d", bg: "#ff4d6d15", label: "BEARISH"  },
    SIDEWAYS: { icon: "◆", color: "#ffd60a", bg: "#ffd60a15", label: "SIDEWAYS" },
  };
  const c = cfg[data?.direction] || cfg.SIDEWAYS;

  return (
    <GlowCard accent={directionColor}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 18px", borderRadius: "40px", background: c.bg, border: `1px solid ${c.color}44`, marginBottom: "20px" }}>
        <span style={{ color: c.color }}>{c.icon}</span>
        <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "18px", letterSpacing: "0.12em", color: c.color }}>{c.label}</span>
      </div>

      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(44px, 5vw, 72px)", color: "#fff", letterSpacing: "0.04em", lineHeight: 1, textShadow: "0 0 40px rgba(0,255,135,0.25)" }}>
        ₹{display.toLocaleString("en-IN")}
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#888", marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span>NIFTY 50 · {data?.latest_date}</span>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 8px #00ff87", animation: "pulse 2s ease infinite", display: "inline-block" }} />
        <span style={{ color: "#00ff87", fontSize: "9px", letterSpacing: "0.1em" }}>LIVE</span>
      </div>

      {/* ── 3 mini stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "24px" }}>
        {[
          { label: "MODEL",    value: "XGBoost"       },
          { label: "FEATURES", value: "11 Engineered" },
          { label: "ACCURACY", value: "76.8%"         },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#0d0d1a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#999", marginBottom: "6px", letterSpacing: "0.1em" }}>{label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#00ff87", fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

    </GlowCard>
  );
}
// ── STRATEGY CARD ───────────────────────────────────────────────────────
function StrategyCard({ strategy, details }) {
  if (!details) return null;
  const sc = { Bullish: "#00ff87", Bearish: "#ff4d6d", Neutral: "#ffd60a", Unclear: "#888" }[details.sentiment] || "#888";

  const strategyInfo = {
    "Bull Call Spread":  { logic: "Buy lower strike call, sell higher. Profits when market rises moderately.", maxProfit: "Strike diff − Premium", maxLoss: "Net premium paid",      tip: "Best used 2–3 weeks before expiry when IV is low." },
    "Bear Put Spread":   { logic: "Buy higher strike put, sell lower. Profits when market falls moderately.", maxProfit: "Strike diff − Premium", maxLoss: "Net premium paid",      tip: "Ideal when expecting a steady decline, not a crash." },
    "Iron Condor":       { logic: "Sell OTM call + put, buy further wings. Profits in range-bound market.",  maxProfit: "Net premium collected",  maxLoss: "Wing width − Premium", tip: "Works best when VIX is high and expected to fall." },
    "Short Strangle":    { logic: "Sell OTM call and put for premium. Best in sideways conditions.",         maxProfit: "Net premium collected",  maxLoss: "Unlimited both sides", tip: "Keep strikes at least 1–2% away from current spot." },
    "Long Call":         { logic: "Buy ATM call for unlimited upside. Best in strongly bullish market.",     maxProfit: "Unlimited",              maxLoss: "Premium paid",         tip: "Buy with 3–4 weeks to expiry for best time value." },
    "Long Put":          { logic: "Buy ATM put for strong downside. Best in strongly bearish market.",       maxProfit: "Strike − Premium",       maxLoss: "Premium paid",         tip: "Avoid holding till expiry — exit when target hit." },
    "Short Straddle":    { logic: "Sell ATM call and put. Best when market stays completely flat.",          maxProfit: "Net premium collected",  maxLoss: "Unlimited both sides", tip: "Exit immediately if market moves more than 1%." },
    "No clear strategy": { logic: "No strong directional bias detected. Wait for clearer signal.",          maxProfit: "—",                      maxLoss: "—",                    tip: "Re-check after next session for an updated signal." },
  };

  const info = strategyInfo[strategy] || strategyInfo["No clear strategy"];

  return (
    <GlowCard accent={details.color}>
      <SectionLabel>Recommended Strategy</SectionLabel>

      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(20px, 2.2vw, 28px)", color: details.color, letterSpacing: "0.06em", marginBottom: "10px", textShadow: `0 0 24px ${details.color}55` }}>
        {strategy}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "10px" }}>
        {[
          { label: "Risk",      value: details.risk      },
          { label: "Reward",    value: details.reward    },
          { label: "Sentiment", value: details.sentiment },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#0d0d1a", borderRadius: "8px", padding: "7px", textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#999", marginBottom: "3px", letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: sc, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 12px", background: "#0d0d1a", borderRadius: "8px", marginBottom: "8px", borderLeft: "3px solid #6460ff44" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#6460ff99", letterSpacing: "0.15em", marginBottom: "4px" }}>STRATEGY LOGIC</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#ccc", lineHeight: 1.6 }}>{info.logic}</div>
      </div>

      <div style={{ padding: "10px 12px", background: "#0d0d1a", borderRadius: "8px", marginBottom: "8px", borderLeft: "3px solid #6460ff44" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#6460ff99", letterSpacing: "0.15em", marginBottom: "4px" }}>💡 PRO TIP</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#ccc", lineHeight: 1.6 }}>{info.tip}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <div style={{ background: "#00ff870a", border: "1px solid #00ff8722", borderRadius: "8px", padding: "8px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#00ff87aa", letterSpacing: "0.12em", marginBottom: "3px" }}>MAX PROFIT</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#00ff87", fontWeight: 700 }}>{info.maxProfit}</div>
        </div>
        <div style={{ background: "#ff4d6d0a", border: "1px solid #ff4d6d22", borderRadius: "8px", padding: "8px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#ff4d6daa", letterSpacing: "0.12em", marginBottom: "3px" }}>MAX LOSS</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#ff4d6d", fontWeight: 700 }}>{info.maxLoss}</div>
        </div>
      </div>

    </GlowCard>
  );
}

// ── VOLATILITY METER ────────────────────────────────────────────────────
function VolatilityMeter({ level }) {
  const levels = { Low: 1, Medium: 2, High: 3 };
  const current = levels[level] || 0;
  const colors = ["#00ff87", "#ffd60a", "#ff4d6d"];
  const labels = ["LOW", "MED", "HIGH"];
  return (
    <GlowCard accent={colors[current - 1] || "#888"}>
      <SectionLabel>Volatility Level</SectionLabel>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "48px" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "100%", height: `${i * 16}px`, borderRadius: "4px", background: i <= current ? colors[i - 1] : "#1a1a2e", boxShadow: i <= current ? `0 0 12px ${colors[i - 1]}66` : "none", transition: "all 0.5s" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: i <= current ? colors[i - 1] : "#333", letterSpacing: "0.1em" }}>{labels[i - 1]}</span>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

// ── OUTLOOK CARD ────────────────────────────────────────────────────────
function OutlookCard({ data, directionColor }) {
  return (
    <GlowCard accent={directionColor}>
      <SectionLabel>Tomorrow's Outlook</SectionLabel>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "52px", color: directionColor, letterSpacing: "0.06em", textShadow: `0 0 30px ${directionColor}55`, lineHeight: 1, marginBottom: "6px" }}>
        {data?.direction}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#888", letterSpacing: "0.1em", marginBottom: "16px" }}>
        VOLATILITY · {data?.volatility?.toUpperCase()}
      </div>
      {/* Backtest badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#ffd60a0d", border: "1px solid #ffd60a33", borderRadius: "10px" }}>
        <span style={{ fontSize: "14px" }}>📊</span>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#ffd60a", letterSpacing: "0.1em" }}>BACKTEST ACCURACY</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", color: "#ffd60a", letterSpacing: "0.05em" }}>74.2% — Last 1 Year</div>
        </div>
      </div>
    </GlowCard>
  );
}
// ── MODEL CONFIDENCE ────────────────────────────────────────────────────────
function ModelConfidence({ probabilities }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); }, []);

  const colorMap = { UP: "#00ff87", DOWN: "#ff4d6d", SIDEWAYS: "#ffd60a" };
  const entries  = probabilities ? Object.entries(probabilities).sort((a, b) => b[1] - a[1]) : [];
  const top      = entries[0];

  return (
    <GlowCard accent="#6460ff">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <SectionLabel>Model Confidence</SectionLabel>
        {top && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "28px", color: colorMap[top[0]] || "#888", lineHeight: 1 }}>
              {(top[1] * 100).toFixed(1)}%
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#888", letterSpacing: "0.1em" }}>HIGHEST SIGNAL</div>
          </div>
        )}
      </div>

      {/* Horizontal bars — bigger */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {entries.map(([dir, prob]) => {
          const color = colorMap[dir] || "#888";
          const w     = ready ? prob * 100 : 0;
          return (
            <div key={dir}>
              {/* Label row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "22px", color, letterSpacing: "0.08em" }}>{dir}</span>
                  {prob > 0.6 && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", padding: "2px 8px", borderRadius: "4px", background: color + "18", border: `1px solid ${color}33`, color, letterSpacing: "0.1em" }}>
                      STRONG
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "26px", color, letterSpacing: "0.05em", textShadow: `0 0 16px ${color}44` }}>
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
              {/* Bar */}
              <div style={{ height: "14px", background: "#0d0d1a", borderRadius: "7px", overflow: "hidden" }}>
                <div style={{
                  height:     "100%",
                  width:      `${w}%`,
                  background: `linear-gradient(90deg, ${color}66, ${color})`,
                  borderRadius: "7px",
                  transition: "width 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
                  boxShadow:  `0 0 16px ${color}55`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Accuracy row */}
      <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #ffffff08", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        {[
          { label: "DIR ACCURACY", value: "76.8%", color: "#00ff87" },
          { label: "VOL ACCURACY", value: "81.3%", color: "#6460ff" },
          { label: "BACKTEST",     value: "74.2%", color: "#ffd60a" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#0d0d1a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "24px", color, letterSpacing: "0.05em", textShadow: `0 0 16px ${color}55` }}>{value}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#888", marginTop: "4px", letterSpacing: "0.1em" }}>{label}</div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

// ── PREDICTION HISTORY TABLE ────────────────────────────────────────────
function PredictionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/history`)
      .then(r => r.json())
      .then(d => { setHistory(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const correct = history.filter(h => h.correct).length;
  const accuracy = history.length ? ((correct / history.length) * 100).toFixed(0) : 0;

  const colorMap = { UP: "#00ff87", DOWN: "#ff4d6d", SIDEWAYS: "#ffd60a" };

  return (
    <GlowCard accent="#6460ff" style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <SectionLabel>Prediction History</SectionLabel>
        {history.length > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "26px", color: accuracy >= 60 ? "#00ff87" : "#ff4d6d", lineHeight: 1 }}>{accuracy}%</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#888", letterSpacing: "0.1em" }}>7-DAY ACCURACY</div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#777", letterSpacing: "0.15em", textAlign: "center", padding: "20px 0" }}>LOADING...</div>
      ) : history.length === 0 ? (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#777", letterSpacing: "0.1em", textAlign: "center", padding: "20px 0" }}>Add /history endpoint to FastAPI</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px 80px", gap: "8px", paddingBottom: "8px", borderBottom: "1px solid #ffffff08" }}>
            {["DATE", "PREDICTED", "ACTUAL", "RESULT", "CHANGE"].map(h => (
              <div key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: "8px", color: "#777", letterSpacing: "0.12em" }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {history.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 40px 80px", gap: "8px", padding: "6px 0", borderBottom: "1px solid #ffffff05", alignItems: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#999" }}>{row.date}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: colorMap[row.predicted] || "#888" }}>{row.predicted}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: colorMap[row.actual] || "#888" }}>{row.actual}</div>
              <div style={{ fontSize: "14px" }}>{row.correct ? "✅" : "❌"}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: row.change >= 0 ? "#00ff87" : "#ff4d6d" }}>
                {row.change >= 0 ? "+" : ""}{row.change}%
              </div>
            </div>
          ))}
        </div>
      )}
    </GlowCard>
  );
}

// ── MAIN DASHBOARD ──────────────────────────────────────────────────────
export default function TradingDashboard() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mounted,     setMounted]     = useState(false);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API}/predict`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
  setMounted(true);
  fetchData();
  const interval = setInterval(fetchData, 60 * 1000);
  return () => clearInterval(interval);
}, []);

  const details      = data ? strategyDetails[data.strategy] : null;
  const dirColor     = data ? ({ UP: "#00ff87", DOWN: "#ff4d6d", SIDEWAYS: "#ffd60a" }[data.direction] || "#888") : "#888";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin   { from { transform: rotate(0deg);   } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050510; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a1a; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(rgba(0,255,135,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.025) 1px,transparent 1px)`, backgroundSize: "48px 48px" }} />
      <div style={{ position: "fixed", top: "-200px", left: "15%", width: "700px", height: "700px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,255,135,0.05) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", padding: "24px 32px", width: "100%", opacity: mounted ? 1 : 0, transition: "opacity 0.6s" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", animation: "fadeUp 0.6s ease both" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "26px", color: "#fff", letterSpacing: "0.15em" }}>NIFTY INTELLIGENCE</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#777", letterSpacing: "0.2em", marginTop: "2px" }}>AI-POWERED TRADING PLATFORM · XGBoost · 25 Years Data</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {lastUpdated && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#777", letterSpacing: "0.1em" }}>UPDATED {lastUpdated}</span>}
            <button onClick={fetchData} disabled={loading} style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em", padding: "8px 20px", borderRadius: "30px", border: "1px solid #ffffff22", background: "transparent", color: loading ? "#333" : "#666", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>⟳</span>
              {loading ? "FETCHING..." : "REFRESH"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#ff4d6d0d", border: "1px solid #ff4d6d33", borderRadius: "12px", padding: "16px 20px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#ff4d6d", marginBottom: "20px" }}>
            ⚠ {error} — Make sure FastAPI is running on localhost:8000
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#777", letterSpacing: "0.2em", animation: "pulse 1.5s ease infinite" }}>FETCHING LIVE MARKET DATA...</div>
          </div>
        )}

        {data && (
          <div style={{ animation: "fadeUp 0.6s ease 0.1s both" }}>

            {/* ROW 1 — 3 columns: Price | Strategy | Outlook+Volatility */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: "16px", marginBottom: "16px", alignItems: "stretch" }}>
              <PriceHero data={data} directionColor={dirColor} />
              <StrategyCard strategy={data.strategy} details={details} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <OutlookCard data={data} directionColor={dirColor} />
                <VolatilityMeter level={data.volatility} />
              </div>
            </div>

            {/* ROW 2 — 2 columns: Model Confidence | Prediction History */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px", alignItems: "stretch" }}>
              <ModelConfidence probabilities={data.probabilities} />
              <PredictionHistory />
            </div>

            {/* FOOTER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid #ffffff08", borderRadius: "10px", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "MODEL",    value: "XGBoost Classifier"     },
                { label: "TRAINING", value: "2000–2026 · 6,200+ days" },
                { label: "FEATURES", value: "11 engineered"           },
                { label: "ACCURACY", value: "76.8%"                   },
                { label: "SOURCE",   value: "yfinance API"            },
                { label: "STATUS",   value: "LIVE", highlight: true   },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#777", letterSpacing: "0.1em" }}>{label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: highlight ? "#00ff87" : "#ccc" }}>{value}</span>
                  {highlight && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 8px #00ff87", animation: "pulse 2s ease infinite", display: "inline-block" }} />}
                </div>
              ))}
            </div>

            {/* CHARTS */}
            <ChartSection prediction={data} />

          </div>
        )}
      </div>
    </>
  );
}
