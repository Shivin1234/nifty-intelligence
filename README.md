# 🧠 NIFTY Intelligence — AI-Powered Trading Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![XGBoost](https://img.shields.io/badge/XGBoost-FF6600?style=for-the-badge&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**A machine learning platform that predicts NIFTY 50 market direction, estimates volatility, and recommends options trading strategies in real time.**

[🚀 Live Demo](https://nifty-intelligence-kiaeac3r4-shivins-projects-f6ca8fd8.vercel.app) &nbsp;·&nbsp; [📡 API Docs](https://nifty-intelligence-api.onrender.com/docs) &nbsp; 

</div>

---

## ✨ Features

- 🔮 **Live Market Prediction** — Predicts tomorrow's NIFTY 50 direction (UP / DOWN / SIDEWAYS) using XGBoost
- 📊 **Volatility Estimation** — Classifies market volatility as Low / Medium / High
- 💡 **Strategy Recommendation** — Automatically suggests the best options strategy based on prediction
- 📈 **Live Price Feed** — Fetches real-time NIFTY data every minute via yfinance API
- 🕯️ **Candlestick Chart** — Interactive TradingView-style NIFTY price chart
- 📉 **P&L Payoff Simulator** — Interactive options strategy profit/loss calculator
- 📋 **Prediction History** — Tracks last 7 days of predictions vs actual market outcomes
- 🎯 **Model Confidence** — Visual probability breakdown of UP / DOWN / SIDEWAYS signals
- ⚡ **Auto Refresh** — Dashboard auto-updates every 60 seconds

---

## 🧠 Machine Learning

### Models

| Model | Algorithm | Accuracy | Output |
|-------|-----------|----------|--------|
| Direction Predictor | XGBoost Classifier | 76.8% | UP / DOWN / SIDEWAYS |
| Volatility Predictor | XGBoost Classifier | 81.3% | Low / Medium / High |

### Training Data

| Property | Value |
|----------|-------|
| Index | NIFTY 50 (^NSEI) |
| Period | 2000 — 2026 (25 years) |
| Samples | 6,200+ trading days |
| Backtest Accuracy | 74.2% (last 1 year) |

### Engineered Features (14 total)

| Category | Features |
|----------|----------|
| Price Action | Open, High, Low, Close, HL Range |
| Momentum | 5-Day Momentum, % Change, Prev Close Diff |
| Trend | MA5, MA20, MA50, Close/MA5 Ratio, Close/MA20 Ratio |
| Volatility | Rolling Volatility (5D) |

### Strategy Recommendation Map

| Direction | Volatility | Recommended Strategy |
|-----------|------------|---------------------|
| UP | Low | Bull Call Spread |
| UP | Medium | Long Call |
| UP | High | Long Call (Aggressive) |
| DOWN | Low | Bear Put Spread |
| DOWN | Medium | Long Put |
| DOWN | High | Long Put (Aggressive) |
| SIDEWAYS | Low | Iron Condor |
| SIDEWAYS | Medium | Short Strangle |
| SIDEWAYS | High | Short Straddle |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│         React Frontend              │
│      (Vercel · localhost:5173)      │
└────────────────┬────────────────────┘
                 │ REST API (fetch)
                 │ Auto-refresh every 60s
┌────────────────▼────────────────────┐
│         FastAPI Backend             │
│      (Render · localhost:8000)      │
│                                     │
│  GET /predict  → Live prediction    │
│  GET /history  → 7 days accuracy   │
│  GET /candles  → Chart OHLCV data  │
└──────────┬──────────────┬───────────┘
           │              │
┌──────────▼───┐  ┌───────▼──────────┐
│ yfinance API │  │  XGBoost Models  │
│ (Live NIFTY) │  │   (.pkl files)   │
└──────────────┘  └──────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|-----------|---------|
| Python 3.12 | Core language |
| FastAPI | REST API framework |
| XGBoost | ML model |
| Scikit-learn | Preprocessing & evaluation |
| Pandas / NumPy | Data processing |
| yfinance | Live NIFTY data |
| Joblib | Model serialization |

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Recharts | P&L payoff chart |
| lightweight-charts | Candlestick chart |
| DM Mono + Bebas Neue | Typography |

### Deployment

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| GitHub | Version control |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Shivin1234/nifty-intelligence.git
cd nifty-intelligence
```

### 2. Setup Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on → `http://localhost:8000`

### 3. Setup Frontend

```bash
cd frontend-app/frontend-v2
npm install
npm run dev
```

Frontend runs on → `http://localhost:5173`

### 4. Open Dashboard

```
http://localhost:5173
```

---

## 📡 API Reference

### `GET /predict`

Returns live NIFTY prediction with strategy recommendation.

```json
{
  "direction": "UP",
  "volatility": "Low",
  "strategy": "Bull Call Spread",
  "probabilities": {
    "UP": 0.7882,
    "DOWN": 0.1567,
    "SIDEWAYS": 0.0551
  },
  "latest_close": 22513.5,
  "latest_date": "2026-03-24"
}
```

### `GET /history`

Returns last 7 trading days predictions vs actual outcomes.

```json
[
  {
    "date": "2026-03-20",
    "predicted": "UP",
    "actual": "DOWN",
    "correct": false,
    "change": -2.74,
    "close": 23114.5
  }
]
```

### `GET /candles?period=6mo`

Returns OHLCV candlestick data for chart.

```json
[
  {
    "time": "2026-03-20",
    "open": 23200.5,
    "high": 23450.0,
    "low": 22980.0,
    "close": 23114.5
  }
]
```

---

## 📁 Project Structure

```
nifty-intelligence/
│
├── backend/
│   ├── models/
│   │   ├── direction_model.pkl
│   │   ├── volatility_model.pkl
│   │   ├── label_encoder_direction.pkl
│   │   ├── label_encoder_volatility.pkl
│   │   └── feature_list.pkl
│   ├── main.py
│   └── requirements.txt
│
├── frontend-app/
│   └── frontend-v2/
│       └── src/
│           ├── TradingDashboard.jsx
│           ├── CandlestickChart.jsx
│           ├── ChartSection.jsx
│           ├── PayoffGraph.jsx
│           └── main.jsx
│
├── nifty_ml_training.ipynb
└── README.md
```

---

## 🧪 Model Training

The models were trained using Google Colab. To retrain:

1. Open `nifty_ml_training.ipynb` in Google Colab
2. Upload `Consolidated_sheet_Nifty.xlsx`
3. Run all cells
4. Download the generated `.pkl` files
5. Replace files in `backend/models/`

---

## ⚠️ Disclaimer

This project is built for **educational purposes only**. The predictions made by this platform are based on historical data patterns and should **not** be used as financial advice. Always consult a qualified financial advisor before making investment decisions.

---
