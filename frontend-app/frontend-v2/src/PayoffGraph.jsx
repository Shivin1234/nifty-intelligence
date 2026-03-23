import { useState, useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

const STRATEGIES = {
  "Bull Call Spread": {
    description: "Buy lower strike call, sell higher strike call", sentiment: "Bullish",
    legs: (spot, width, premium) => [
      { type: "long_call",  strike: spot - width / 2, premium: premium * 1.4 },
      { type: "short_call", strike: spot + width / 2, premium: premium * 0.6 },
    ],
  },
  "Bear Put Spread": {
    description: "Buy higher strike put, sell lower strike put", sentiment: "Bearish",
    legs: (spot, width, premium) => [
      { type: "long_put",  strike: spot + width / 2, premium: premium * 1.4 },
      { type: "short_put", strike: spot - width / 2, premium: premium * 0.6 },
    ],
  },
  "Iron Condor": {
    description: "Sell OTM call + put, buy further OTM call + put", sentiment: "Neutral",
    legs: (spot, width, premium) => [
      { type: "short_call", strike: spot + width * 0.5, premium: premium * 0.6 },
      { type: "long_call",  strike: spot + width,       premium: premium * 0.2 },
      { type: "short_put",  strike: spot - width * 0.5, premium: premium * 0.6 },
      { type: "long_put",   strike: spot - width,       premium: premium * 0.2 },
    ],
  },
  "Short Strangle": {
    description: "Sell OTM call + sell OTM put", sentiment: "Neutral",
    legs: (spot, width, premium) => [
      { type: "short_call", strike: spot + width * 0.5, premium: premium * 0.7 },
      { type: "short_put",  strike: spot - width * 0.5, premium: premium * 0.7 },
    ],
  },
  "Long Call": {
    description: "Buy ATM call option", sentiment: "Bullish",
    legs: (spot, width, premium) => [{ type: "long_call", strike: spot, premium }],
  },
  "Long Put": {
    description: "Buy ATM put option", sentiment: "Bearish",
    legs: (spot, width, premium) => [{ type: "long_put", strike: spot, premium }],
  },
  "Short Straddle": {
    description: "Sell ATM call + sell ATM put", sentiment: "Neutral",
    legs: (spot, width, premium) => [
      { type: "short_call", strike: spot, premium: premium * 0.8 },
      { type: "short_put",  strike: spot, premium: premium * 0.8 },
    ],
  },
};

function legPnL(leg, price) {
  const { type, strike, premium } = leg;
  switch (type) {
    case "long_call":  return Math.max(0, price - strike) - premium;
    case "short_call": return premium - Math.max(0, price - strike);
    case "long_put":   return Math.max(0, strike - price) - premium;
    case "short_put":  return premium - Math.max(0, strike - price);
    default:           return 0;
  }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const pnl   = payload[0]?.value;
  const color = pnl >= 0 ? "#00ff87" : "#ff4d6d";
  return (
    <div style={{ background: "#0d0d1a", border: `1px solid ${color}44`, borderRadius: "10px", padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#555", marginBottom: "6px" }}>NIFTY @ ₹{Number(label).toLocaleString("en-IN")}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color, fontWeight: 700 }}>
        {pnl >= 0 ? "PROFIT" : "LOSS"} ₹{Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
};

export default function PayoffGraph({ suggestedStrategy = "Iron Condor", currentSpot = 23000 }) {
  const [strategy, setStrategy] = useState(suggestedStrategy);
  const [spot,     setSpot]     = useState(currentSpot);
  const [width,    setWidth]    = useState(300);
  const [premium,  setPremium]  = useState(150);
  const [lots,     setLots]     = useState(1);
  const [lotSize,  setLotSize]  = useState(75);

  const stratDef = STRATEGIES[strategy] || STRATEGIES["Iron Condor"];
  const legs     = stratDef.legs(spot, width, premium);

  const chartData = useMemo(() => {
    const range = width * 4;
    const start = spot - range / 2;
    return Array.from({ length: 121 }, (_, i) => {
      const price = start + (i * range) / 120;
      const pnl   = legs.reduce((sum, leg) => sum + legPnL(leg, price), 0) * lots * lotSize;
      return { price: Math.round(price), pnl: Math.round(pnl) };
    });
  }, [legs, lots, lotSize, spot, width]);

  const maxProfit  = Math.max(...chartData.map(d => d.pnl));
  const maxLoss    = Math.min(...chartData.map(d => d.pnl));
  const breakevens = [];
  for (let i = 1; i < chartData.length; i++) {
    if ((chartData[i-1].pnl < 0 && chartData[i].pnl >= 0) || (chartData[i-1].pnl >= 0 && chartData[i].pnl < 0)) {
      breakevens.push(Math.round((chartData[i-1].price + chartData[i].price) / 2));
    }
  }

  const sentimentColor = { Bullish: "#00ff87", Bearish: "#ff4d6d", Neutral: "#ffd60a" }[stratDef.sentiment] || "#888";

  const InputRow = ({ label, value, onChange, min, max, step = 1 }) => (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#555", letterSpacing: "0.12em" }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#aaa", fontWeight: 600 }}>
          {value > 1000 ? `₹${value.toLocaleString("en-IN")}` : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#00ff87", cursor: "pointer", height: "3px" }}
      />
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {/* Strategy selector */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#444", letterSpacing: "0.18em", marginBottom: "10px" }}>SELECT STRATEGY</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.keys(STRATEGIES).map(s => (
            <button key={s} onClick={() => setStrategy(s)} style={{
              fontFamily: "'DM Mono', monospace", fontSize: "10px", padding: "6px 14px",
              borderRadius: "6px", border: `1px solid ${strategy === s ? sentimentColor + "66" : "#ffffff11"}`,
              background: strategy === s ? sentimentColor + "12" : "transparent",
              color: strategy === s ? sentimentColor : "#444",
              cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.05em",
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px" }}>
        {/* Controls */}
        <div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #ffffff0a", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#444", letterSpacing: "0.18em", marginBottom: "18px" }}>PARAMETERS</div>
            <InputRow label="SPOT PRICE"   value={spot}    onChange={setSpot}    min={15000} max={35000} step={50}  />
            <InputRow label="STRIKE WIDTH" value={width}   onChange={setWidth}   min={100}   max={1000}  step={50}  />
            <InputRow label="PREMIUM (₹)"  value={premium} onChange={setPremium} min={10}    max={500}   step={5}   />
            <InputRow label="LOTS"         value={lots}    onChange={setLots}    min={1}     max={20}    step={1}   />
            <InputRow label="LOT SIZE"     value={lotSize} onChange={setLotSize} min={25}    max={250}   step={25}  />
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #ffffff0a", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#444", letterSpacing: "0.18em", marginBottom: "16px" }}>STRATEGY METRICS</div>
            {[
              { label: "MAX PROFIT", value: `₹${maxProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#00ff87" },
              { label: "MAX LOSS",   value: `₹${Math.abs(maxLoss).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#ff4d6d" },
              { label: "SENTIMENT",  value: stratDef.sentiment, color: sentimentColor },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: "14px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "0.12em", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
            {breakevens.length > 0 && (
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "0.12em", marginBottom: "6px" }}>BREAKEVEN{breakevens.length > 1 ? "S" : ""}</div>
                {breakevens.map((be, i) => (
                  <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#ffd60a", fontWeight: 600, marginBottom: "4px" }}>₹{be.toLocaleString("en-IN")}</div>
                ))}
              </div>
            )}
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #ffffff08" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#333", letterSpacing: "0.1em", lineHeight: 1.6 }}>{stratDef.description}</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#444", letterSpacing: "0.18em", marginBottom: "16px" }}>PROFIT / LOSS AT EXPIRY</div>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff87" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00ff87" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%"  stopColor="#ff4d6d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="price" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "#444" }} axisLine={{ stroke: "#ffffff0a" }} tickLine={false} />
              <YAxis tickFormatter={v => v >= 0 ? `+${(v/1000).toFixed(0)}k` : `${(v/1000).toFixed(0)}k`} tick={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "#444" }} axisLine={{ stroke: "#ffffff0a" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#ffffff22" strokeWidth={1} strokeDasharray="4 4" />
              <ReferenceLine x={spot} stroke="#ffd60a66" strokeWidth={1} strokeDasharray="4 4"
                label={{ value: "SPOT", position: "top", fill: "#ffd60a", fontSize: 9, fontFamily: "'DM Mono', monospace" }} />
              {breakevens.map((be, i) => (
                <ReferenceLine key={i} x={be} stroke="#ffffff22" strokeWidth={1} strokeDasharray="2 4"
                  label={{ value: "BE", position: "top", fill: "#ffffff44", fontSize: 9, fontFamily: "'DM Mono', monospace" }} />
              ))}
              <Area type="monotone" dataKey={d => d.pnl >= 0 ? d.pnl : 0} fill="url(#profitGrad)" stroke="none" />
              <Area type="monotone" dataKey={d => d.pnl < 0  ? d.pnl : 0} fill="url(#lossGrad)"   stroke="none" />
              <Line type="monotone" dataKey="pnl" stroke="#6460ff" strokeWidth={2.5} dot={false} animationDuration={800} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "20px", marginTop: "12px", justifyContent: "flex-end" }}>
            {[
              { color: "#00ff87",   label: "Profit Zone"    },
              { color: "#ff4d6d",   label: "Loss Zone"      },
              { color: "#ffd60a",   label: "Current Spot"   },
              { color: "#ffffff44", label: "Breakeven"      },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "20px", height: "2px", background: color, borderRadius: "1px" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "0.1em" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}