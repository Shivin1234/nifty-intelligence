import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

const API = "https://nifty-intelligence-api.onrender.com";

export default function CandlestickChart() {
  const chartRef  = useRef(null);
  const chartObj  = useRef(null);
  const seriesRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [stats,   setStats]   = useState(null);
  const [period,  setPeriod]  = useState("6mo");

  const periods = ["1mo", "3mo", "6mo", "1y"];

  const fetchAndRender = async (p) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API}/candles?period=${p}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (seriesRef.current && chartObj.current) {
        seriesRef.current.setData(data);
        chartObj.current.timeScale().fitContent();
      }

      const closes = data.map(d => d.close);
      const last   = closes[closes.length - 1];
      const prev   = closes[closes.length - 2];
      const change = ((last - prev) / prev * 100).toFixed(2);
      setStats({ last, change, high52: Math.max(...closes).toFixed(2), low52: Math.min(...closes).toFixed(2), candles: data.length });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout:    { background: { color: "transparent" }, textColor: "#666", fontFamily: "'DM Mono', monospace", fontSize: 11 },
      grid:      { vertLines: { color: "#ffffff06" }, horzLines: { color: "#ffffff06" } },
      crosshair: { mode: 1, vertLine: { color: "#ffffff22", width: 1, style: 3 }, horzLine: { color: "#ffffff22", width: 1, style: 3 } },
      rightPriceScale: { borderColor: "#ffffff0a" },
      timeScale: { borderColor: "#ffffff0a", timeVisible: true, secondsVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00ff87", downColor: "#ff4d6d",
      borderUpColor: "#00ff87", borderDownColor: "#ff4d6d",
      wickUpColor: "#00ff8766", wickDownColor: "#ff4d6d66",
    });

    chartObj.current  = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    fetchAndRender("6mo");

    return () => { window.removeEventListener("resize", handleResize); chart.remove(); };
  }, []);

  const handlePeriod = (p) => { setPeriod(p); fetchAndRender(p); };
  const changeColor  = stats ? (parseFloat(stats.change) >= 0 ? "#00ff87" : "#ff4d6d") : "#888";

  return (
    <div style={{ width: "100%" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        {stats && (
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[
              { label: "LAST",     value: `₹${Number(stats.last).toLocaleString("en-IN")}`,    color: "#fff"     },
              { label: "CHANGE",   value: `${stats.change >= 0 ? "+" : ""}${stats.change}%`,   color: changeColor },
              { label: "52W HIGH", value: `₹${Number(stats.high52).toLocaleString("en-IN")}`,  color: "#00ff87"  },
              { label: "52W LOW",  value: `₹${Number(stats.low52).toLocaleString("en-IN")}`,   color: "#ff4d6d"  },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#444", letterSpacing: "0.15em", marginBottom: "4px" }}>{label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "6px" }}>
          {periods.map(p => (
            <button key={p} onClick={() => handlePeriod(p)} style={{
              fontFamily: "'DM Mono', monospace", fontSize: "11px", padding: "5px 12px",
              borderRadius: "6px", border: `1px solid ${period === p ? "#00ff8766" : "#ffffff11"}`,
              background: period === p ? "#00ff8712" : "transparent",
              color: period === p ? "#00ff87" : "#555",
              cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.05em",
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#ff4d6d0d", border: "1px solid #ff4d6d33", borderRadius: "10px", padding: "16px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#ff4d6d", marginBottom: "16px" }}>
          ⚠ {error} — Add /candles endpoint to FastAPI
        </div>
      )}

      <div style={{ position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,5,16,0.7)", borderRadius: "12px", zIndex: 10 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#444", letterSpacing: "0.2em", animation: "pulse 1.5s ease infinite" }}>
              LOADING CANDLES...
            </div>
          </div>
        )}
        <div ref={chartRef} style={{ width: "100%", height: "380px", borderRadius: "8px", overflow: "hidden" }} />
      </div>

      <div style={{ marginTop: "10px", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#333", textAlign: "right", letterSpacing: "0.1em" }}>
        SOURCE: YFINANCE · ^NSEI · {stats?.candles} CANDLES
      </div>
    </div>
  );
}
