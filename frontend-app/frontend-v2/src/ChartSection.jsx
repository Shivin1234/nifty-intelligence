import { useState } from "react";
import CandlestickChart from "./CandlestickChart";
import PayoffGraph from "./PayoffGraph";

export default function ChartSection({ prediction }) {
  const [activeTab, setActiveTab] = useState("candlestick");

  const tabs = [
    { id: "candlestick", label: "CANDLESTICK", icon: "▦", desc: "Live NIFTY price chart"       },
    { id: "payoff",      label: "P&L PAYOFF",  icon: "◈", desc: "Options strategy simulator"   },
  ];

  return (
    <div style={{ marginTop: "16px" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: "0px", borderBottom: "1px solid #ffffff0a", marginBottom: "28px" }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.15em",
              padding: "14px 28px", border: "none",
              borderBottom: active ? "2px solid #00ff87" : "2px solid transparent",
              background: "transparent", color: active ? "#00ff87" : "#444",
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px", marginBottom: "-1px",
            }}>
              <span style={{ fontSize: "14px" }}>{tab.icon}</span>
              {tab.label}
              {active && (
                <span style={{ background: "#00ff8722", color: "#00ff8799", fontSize: "9px", padding: "2px 7px", borderRadius: "10px", letterSpacing: "0.1em" }}>
                  LIVE
                </span>
              )}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: "4px" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#333", letterSpacing: "0.1em" }}>
            {tabs.find(t => t.id === activeTab)?.desc}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #ffffff0a", borderRadius: "16px", padding: "28px", minHeight: "500px", position: "relative" }}>
        {activeTab === "candlestick" && <CandlestickChart />}
        {activeTab === "payoff"      && <PayoffGraph suggestedStrategy={prediction?.strategy || "Iron Condor"} currentSpot={prediction?.latest_close || 23000} />}
      </div>
    </div>
  );
}