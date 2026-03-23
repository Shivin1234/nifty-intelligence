from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd
import yfinance as yf

app = FastAPI()

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models once at startup
dir_model  = joblib.load("models/direction_model.pkl")
vol_model  = joblib.load("models/volatility_model.pkl")
le_dir     = joblib.load("models/label_encoder_direction.pkl")
le_vol     = joblib.load("models/label_encoder_volatility.pkl")
FEATURES   = joblib.load("models/feature_list.pkl")

# Strategy recommendation logic
STRATEGY_MAP = {
    ("UP",       "Low"):    "Bull Call Spread",
    ("UP",       "Medium"): "Long Call",
    ("UP",       "High"):   "Long Call (aggressive)",
    ("DOWN",     "Low"):    "Bear Put Spread",
    ("DOWN",     "Medium"): "Long Put",
    ("DOWN",     "High"):   "Long Put (aggressive)",
    ("SIDEWAYS", "Low"):    "Iron Condor",
    ("SIDEWAYS", "Medium"): "Short Strangle",
    ("SIDEWAYS", "High"):   "Short Straddle",
}

def fetch_live_features():
    """Fetch live NIFTY data and compute features"""
    import datetime
    end   = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    start = (datetime.date.today() - datetime.timedelta(days=120)).strftime("%Y-%m-%d")
    df = yf.download("^NSEI", start=start, end=end, interval="1d", progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)
    df = df.rename(columns={
        "Open": "Open", "High": "High",
        "Low": "Low",   "Close": "Close"
    })
    df["HL_Range"]         = df["High"] - df["Low"]
    df["Prev_Diff"]        = df["Close"].diff()
    df["Pct_Change"]       = df["Close"].pct_change() * 100
    df["MA5"]              = df["Close"].rolling(5).mean()
    df["MA20"]             = df["Close"].rolling(20).mean()
    df["MA50"]             = df["Close"].rolling(50).mean()
    df["Momentum"]         = df["Close"] - df["Close"].shift(5)
    df["Close_MA5_Ratio"]  = df["Close"] / df["MA5"]
    df["Close_MA20_Ratio"] = df["Close"] / df["MA20"]
    df["Rolling_Vol"]      = df["HL_Range"].rolling(5).mean()
    df = df.fillna(method="bfill").fillna(method="ffill")
    return df

@app.get("/predict")
def predict():
    df = fetch_live_features()
    latest = df[FEATURES].iloc[[-1]]  # most recent day

    dir_pred   = le_dir.inverse_transform(dir_model.predict(latest))[0]
    vol_pred   = le_vol.inverse_transform(vol_model.predict(latest))[0]
    dir_proba  = dir_model.predict_proba(latest)[0]
    strategy   = STRATEGY_MAP.get((dir_pred, vol_pred), "No clear strategy")

    return {
        "direction":  dir_pred,
        "volatility": vol_pred,
        "strategy":   strategy,
        "probabilities": {
            cls: round(float(prob), 4)
            for cls, prob in zip(le_dir.classes_, dir_proba)
        },
        "latest_close": round(float(df["Close"].iloc[-1]), 2),
        "latest_date":  str(df.index[-1].date())
    }

@app.get("/health")
def health():
    return {"status": "running"}

@app.get("/candles")
def candles(period: str = "6mo"):
    df = yf.download("^NSEI", period=period, interval="1d", progress=False)
    df.columns = df.columns.droplevel(1)
    df = df.dropna()
    return [
        {
            "time":  date.strftime("%Y-%m-%d"),
            "open":  round(float(row["Open"]),  2),
            "high":  round(float(row["High"]),  2),
            "low":   round(float(row["Low"]),   2),
            "close": round(float(row["Close"]), 2),
        }
        for date, row in df.iterrows()
    ]

@app.get("/history")
def history():
    df = yf.download("^NSEI", period="30d", interval="1d", progress=False)

    # ✅ FIX 1: safe droplevel
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)

    df["HL_Range"]         = df["High"] - df["Low"]
    df["Prev_Diff"]        = df["Close"].diff()
    df["Pct_Change"]       = df["Close"].pct_change() * 100
    df["MA5"]              = df["Close"].rolling(5).mean()
    df["MA20"]             = df["Close"].rolling(20).mean()
    df["MA50"]             = df["Close"].rolling(50).mean()
    df["Momentum"]         = df["Close"] - df["Close"].shift(5)
    df["Close_MA5_Ratio"]  = df["Close"] / df["MA5"]
    df["Close_MA20_Ratio"] = df["Close"] / df["MA20"]
    df["Rolling_Vol"]      = df["HL_Range"].rolling(5).mean()

    # ✅ FIX 2: replace dropna
    df = df.fillna(method="bfill").fillna(method="ffill")

    # ✅ FIX 3: safety check
    if len(df) < 2:
        return []

    FEATURES = joblib.load("models/feature_list.pkl")
    le_dir   = joblib.load("models/label_encoder_direction.pkl")

    results = []
    for i in range(len(df) - 1):
        row        = df[FEATURES].iloc[[i]]
        predicted  = le_dir.inverse_transform(dir_model.predict(row))[0]
        next_close = float(df["Close"].iloc[i + 1])
        curr_close = float(df["Close"].iloc[i])
        change     = (next_close - curr_close) / curr_close * 100

        if change > 0.3:
            actual = "UP"
        elif change < -0.3:
            actual = "DOWN"
        else:
            actual = "SIDEWAYS"

        results.append({
            "date":      str(df.index[i].date()),
            "predicted": predicted,
            "actual":    actual,
            "correct":   predicted == actual,
            "change":    round(change, 2),
            "close":     round(curr_close, 2),
        })

    return list(reversed(results[-7:]))
