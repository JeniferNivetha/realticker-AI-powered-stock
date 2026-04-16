"""
RealTicker – Backend API
========================
FastAPI backend for the SORIM.Ai Hackathon project.

Endpoints:
  GET  /api/stocks/top10            → top 10 stocks by volume
  GET  /api/stocks/{ticker}/history → 6-month OHLCV history
  POST /api/stocks/{ticker}/analyze → HuggingFace LLM analysis

Author : SORIM.Ai Team
Python : 3.11+
"""

import os
import random
import logging
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN", "")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("realticker")

# TODO: move this to a config file later
TOP_10 = [
    {"ticker": "AAPL",  "company": "Apple Inc."},
    {"ticker": "MSFT",  "company": "Microsoft Corp."},
    {"ticker": "GOOGL", "company": "Alphabet Inc."},
    {"ticker": "AMZN",  "company": "Amazon.com Inc."},
    {"ticker": "NVDA",  "company": "NVIDIA Corp."},
    {"ticker": "META",  "company": "Meta Platforms"},
    {"ticker": "TSLA",  "company": "Tesla Inc."},
    {"ticker": "BRK-B", "company": "Berkshire Hathaway"},
    {"ticker": "JPM",   "company": "JPMorgan Chase"},
    {"ticker": "V",     "company": "Visa Inc."},
]

VALID_TICKERS = {t["ticker"] for t in TOP_10}

# Base prices for mock fallback (roughly end-of-2024 values)
_MOCK_BASE = {
    "AAPL": 185.40, "MSFT": 412.30, "GOOGL": 175.10,
    "AMZN": 193.50, "NVDA": 875.60, "META":  530.20,
    "TSLA": 177.90, "BRK-B": 415.00,"JPM":   205.80, "V": 278.40,
}

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="RealTicker API",
    description="AI-powered stock insights backend",
    version="1.0.0",
)

# Allow both local dev URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mock_stock(ticker: str) -> dict:
    """Generate realistic-looking mock data when yfinance fails."""
    base = _MOCK_BASE.get(ticker, 100.0)
    chg  = round(random.uniform(-3.5, 3.5), 2)
    price = round(base * (1 + chg / 100), 2)
    vol   = random.randint(8_000_000, 120_000_000)
    company = next((t["company"] for t in TOP_10 if t["ticker"] == ticker), ticker)
    return {
        "ticker":    ticker,
        "company":   company,
        "price":     price,
        "change":    chg,
        "volume":    vol,
        "marketCap": 0,
        "sector":    "Technology",
        "currency":  "USD",
    }


def get_stock_info(ticker: str) -> dict:
    """
    Fetch live stock info from yfinance.
    Falls back to mock data if the request times out or fails.
    """
    try:
        tk   = yf.Ticker(ticker)
        info = tk.info
        hist = tk.history(period="2d")   # need at least 2 rows for prev-close

        if hist.empty:
            raise ValueError("Empty history from yfinance")

        current  = round(float(hist["Close"].iloc[-1]), 2)
        prev     = round(float(hist["Close"].iloc[-2]) if len(hist) > 1 else hist["Open"].iloc[-1], 2)
        change   = round(((current - prev) / prev) * 100, 2) if prev else 0.0
        volume   = int(hist["Volume"].iloc[-1])

        return {
            "ticker":    ticker,
            "company":   info.get("longName", ticker),
            "price":     current,
            "change":    change,
            "volume":    volume,
            "marketCap": info.get("marketCap", 0),
            "sector":    info.get("sector", "N/A"),
            "currency":  info.get("currency", "USD"),
        }
    except Exception as exc:
        log.warning(f"[yfinance] {ticker} failed ({exc}), using mock data")
        return _mock_stock(ticker)


def _mock_history(ticker: str) -> list:
    """Generate 6-month simulated OHLCV data (Mon–Fri only)."""
    records = []
    price   = _MOCK_BASE.get(ticker, 100.0)
    today   = datetime.today()

    for days_back in range(180, -1, -1):
        day = today - timedelta(days=days_back)
        if day.weekday() >= 5:   # skip weekends
            continue
        drift  = random.uniform(-0.025, 0.025)
        price  = round(price * (1 + drift), 2)
        high   = round(price * random.uniform(1.003, 1.018), 2)
        low    = round(price * random.uniform(0.982, 0.997), 2)
        open_  = round(price * random.uniform(0.991, 1.009), 2)
        records.append({
            "date":   day.strftime("%Y-%m-%d"),
            "open":   open_,
            "high":   high,
            "low":    low,
            "close":  price,
            "volume": random.randint(5_000_000, 90_000_000),
        })
    return records


def get_history(ticker: str) -> list:
    """
    Pull 6-month daily OHLCV from yfinance.
    Silently uses mock data on failure so the frontend never breaks.
    """
    try:
        tk    = yf.Ticker(ticker)
        end   = datetime.today()
        start = end - timedelta(days=185)   # a tiny buffer for weekends

        hist = tk.history(
            start=start.strftime("%Y-%m-%d"),
            end=end.strftime("%Y-%m-%d"),
        )
        if hist.empty:
            raise ValueError("Empty history")

        records = []
        for ts, row in hist.iterrows():
            records.append({
                "date":   ts.strftime("%Y-%m-%d"),
                "open":   round(float(row["Open"]),  2),
                "high":   round(float(row["High"]),  2),
                "low":    round(float(row["Low"]),   2),
                "close":  round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return records
    except Exception as exc:
        log.warning(f"[yfinance history] {ticker}: {exc} — using mock")
        return _mock_history(ticker)


def _rule_based_analysis(ticker: str, history: list) -> dict:
    """
    Simple rule-based fallback when HuggingFace is unavailable.
    Uses price trend + standard-deviation volatility.
    """
    if not history:
        return {
            "trend": "Unknown",
            "riskLevel": "Unknown",
            "suggestedAction": "N/A",
            "reason": "No historical data available for analysis.",
        }

    closes = [r["close"] for r in history]
    first, last = closes[0], closes[-1]
    pct_chg = ((last - first) / first) * 100 if first else 0

    # daily return std-dev as proxy for volatility
    returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
    volatility = float(np.std(returns)) * 100   # in percent

    trend  = "Upward" if pct_chg > 5 else ("Downward" if pct_chg < -5 else "Sideways")
    risk   = "Low" if volatility < 1.5 else ("High" if volatility > 3.0 else "Medium")
    action = (
        "Long-term investment"  if trend == "Upward"   and risk != "High"
        else "Avoid"            if trend == "Downward" and risk == "High"
        else "Short-term watch"
    )
    reason = (
        f"Over the past 6 months {ticker} moved {pct_chg:+.1f}%. "
        f"Daily return volatility is {volatility:.2f}%, "
        f"classifying it as {risk.lower()} risk. "
        f"Given the {trend.lower()} trend, a '{action}' stance is suggested."
    )
    return {"trend": trend, "riskLevel": risk, "suggestedAction": action, "reason": reason}


def _build_prompt(ticker: str, company: str, history: list) -> str:
    """Build the LLM prompt using last 30 days closing prices."""
    last30   = [r["close"] for r in history[-30:]]
    price_str = ", ".join(str(p) for p in last30)
    first, last = history[0]["close"], history[-1]["close"]
    pct = round(((last - first) / first) * 100, 2) if first else 0

    return (
        f"Analyze the following 6-month stock price data for {company} ({ticker}).\n"
        f"Total change over 6 months: {pct:+.2f}%\n"
        f"Recent 30-day closing prices (oldest → newest): {price_str}\n\n"
        "Please provide investment guidance for a beginner investor.\n"
        "Format your response EXACTLY as:\n"
        "TREND: <Upward | Downward | Sideways>\n"
        "RISK_LEVEL: <Low | Medium | High>\n"
        "SUGGESTED_ACTION: <Long-term investment | Short-term watch | Avoid>\n"
        "REASON: <2-3 sentence plain-English explanation>\n"
    )


def _parse_llm(text: str) -> dict:
    """Parse structured LLM output into our standard dict."""
    result = {
        "trend": "Sideways",
        "riskLevel": "Medium",
        "suggestedAction": "Short-term watch",
        "reason": text.strip(),
    }
    for line in text.strip().splitlines():
        upper = line.upper()
        if upper.startswith("TREND:"):
            result["trend"] = line.split(":", 1)[1].strip()
        elif upper.startswith("RISK_LEVEL:"):
            result["riskLevel"] = line.split(":", 1)[1].strip()
        elif upper.startswith("SUGGESTED_ACTION:"):
            result["suggestedAction"] = line.split(":", 1)[1].strip()
        elif upper.startswith("REASON:"):
            result["reason"] = line.split(":", 1)[1].strip()
    return result


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "RealTicker API is live 🚀", "docs": "/docs"}


@app.get("/api/stocks/top10")
def top10():
    """Return live data for the top 10 stocks sorted by volume."""
    stocks = [get_stock_info(t["ticker"]) for t in TOP_10]
    stocks.sort(key=lambda s: s["volume"], reverse=True)
    return {
        "stocks":    stocks,
        "count":     len(stocks),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/stocks/{ticker}/history")
def history(ticker: str):
    """Return 6-month daily OHLCV data for a given ticker."""
    ticker = ticker.upper()
    if ticker not in VALID_TICKERS:
        raise HTTPException(status_code=404, detail=f"'{ticker}' is not in the tracked top-10 list.")

    hist  = get_history(ticker)
    stock = get_stock_info(ticker)

    return {
        "ticker":  ticker,
        "company": stock["company"],
        "current": stock,
        "history": hist,
        "dataPoints": len(hist),
    }


@app.post("/api/stocks/{ticker}/analyze")
def analyze(ticker: str):
    """
    Run AI analysis on a ticker's 6-month history.
    Uses Mistral-7B via HuggingFace Inference API if HF_TOKEN is set,
    otherwise falls back to a rule-based analysis.
    """
    ticker = ticker.upper()
    if ticker not in VALID_TICKERS:
        raise HTTPException(status_code=404, detail=f"'{ticker}' is not in the tracked list.")

    hist    = get_history(ticker)
    stock   = get_stock_info(ticker)
    company = stock["company"]

    analysis = {}
    llm_used = "Rule-based fallback"

    if HF_TOKEN:
        try:
            prompt = _build_prompt(ticker, company, hist)
            client = InferenceClient(token=HF_TOKEN)
            raw = client.text_generation(
                prompt,
                model="mistralai/Mistral-7B-Instruct-v0.3",
                max_new_tokens=256,
                temperature=0.3,
                repetition_penalty=1.1,
            )
            analysis = _parse_llm(raw)
            llm_used = "Mistral-7B-Instruct-v0.3 (HuggingFace)"
            log.info(f"[LLM] {ticker} analysed via HuggingFace ✓")
        except Exception as e:
            log.error(f"[LLM] HuggingFace failed for {ticker}: {e}")
            analysis = _rule_based_analysis(ticker, hist)
    else:
        log.info(f"[LLM] No HF_TOKEN, using rule-based fallback for {ticker}")
        analysis = _rule_based_analysis(ticker, hist)

    return {
        "ticker":     ticker,
        "company":    company,
        "analysis":   analysis,
        "llmUsed":    llm_used,
        "disclaimer": "This is AI-generated analysis and not financial advice.",
        "dataPoints": len(hist),
        "analyzedAt": datetime.utcnow().isoformat(),
    }


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
