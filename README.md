# 📈 RealTicker — AI-Powered Stock Insights Platform

> **SORIM.Ai Hackathon Technical Assessment**
> An AI-powered stock analysis platform that tracks the top 10 stocks by volume, visualizes 6-month price trends, and provides intelligent investment insights using HuggingFace LLMs.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?logo=vite)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Mistral--7B-FFD21E?logo=huggingface)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│                        http://localhost:5173                     │
│                                                                 │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Navbar   │  │  Dashboard   │  │     StockDetail Panel    │  │
│  │           │  │              │  │                          │  │
│  │ • Brand   │  │ • Hero       │  │ ┌────────┐ ┌──────────┐ │  │
│  │ • Live    │  │ • Stats      │  │ │ Stock  │ │   AI     │ │  │
│  │   Badge   │  │ • StockTable │  │ │ Chart  │ │ Analysis │ │  │
│  └───────────┘  │   (Top 10)   │  │ │(6-mo)  │ │  Panel   │ │  │
│                 └──────┬───────┘  │ └────────┘ └──────────┘ │  │
│                        │         └──────────────────────────┘  │
└────────────────────────┼───────────────────────────────────────┘
                         │  Axios HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                   │
│                      http://localhost:8000                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     API Endpoints                        │   │
│  │                                                          │   │
│  │  GET  /api/stocks/top10          → Top 10 stocks data    │   │
│  │  GET  /api/stocks/{ticker}/history → 6-month OHLCV      │   │
│  │  POST /api/stocks/{ticker}/analyze → AI analysis         │   │
│  └──────────┬─────────────────────────────┬─────────────────┘   │
│             │                             │                     │
│             ▼                             ▼                     │
│  ┌──────────────────┐          ┌────────────────────────┐       │
│  │    yfinance       │          │   HuggingFace API      │       │
│  │  (Market Data)    │          │  (Inference Client)    │       │
│  │                   │          │                        │       │
│  │ • Live prices     │          │ • Mistral-7B-Instruct  │       │
│  │ • 6-month history │          │ • Text generation      │       │
│  │ • Volume, sector  │          │ • Structured output    │       │
│  └──────────────────┘          └────────────────────────┘       │
│             │                             │                     │
│             ▼                             ▼                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Fallback: Mock Data + Rule-Based Analysis   │   │
│  │    (Ensures the app always works, even without API keys) │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 LLM Used

| Property | Detail |
|----------|--------|
| **Model** | `mistralai/Mistral-7B-Instruct-v0.3` |
| **Provider** | HuggingFace Inference API |
| **Integration** | `huggingface_hub.InferenceClient` |
| **Task** | Text Generation (structured stock analysis) |
| **Fallback** | Rule-based analysis using NumPy (trend + volatility) |

### How the AI Analysis Works

1. **Data Collection**: Fetches 6 months of daily closing prices via `yfinance`
2. **Prompt Engineering**: Builds a structured prompt with the last 30 closing prices and overall % change
3. **LLM Inference**: Sends the prompt to Mistral-7B via HuggingFace Inference API
4. **Structured Output**: Parses the LLM response into:
   - **Trend**: Upward / Downward / Sideways
   - **Risk Level**: Low / Medium / High
   - **Suggested Action**: Long-term investment / Short-term watch / Avoid (with reason)
5. **Disclaimer**: Always displayed — *"This is AI-generated analysis and not financial advice."*

### Prompt Template

```
Analyze the following 6-month stock price data for {company} ({ticker}).
Total change over 6 months: {pct}%
Recent 30-day closing prices (oldest → newest): {prices}

Please provide investment guidance for a beginner investor.
Format your response EXACTLY as:
TREND: <Upward | Downward | Sideways>
RISK_LEVEL: <Low | Medium | High>
SUGGESTED_ACTION: <Long-term investment | Short-term watch | Avoid>
REASON: <2-3 sentence plain-English explanation>
```

---

## 🚀 Setup Steps

### Prerequisites

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)
- **HuggingFace API Token** (free) — [Get one here](https://huggingface.co/settings/tokens)

### 1. Clone the Repository

```bash
git clone https://github.com/JeniferNivetha/realticker-AI-powered-stock.git
cd realticker-AI-powered-stock
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure your HuggingFace token
# Edit the .env file and replace the placeholder:
echo HF_TOKEN=your_huggingface_token_here > .env

# Start the backend server
python main.py
```

The API will be running at **http://localhost:8000**
- API docs available at **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at **http://localhost:5173**

### 4. Open the App

Visit **http://localhost:5173** in your browser to use RealTicker!

---

## 📡 API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stocks/top10` | Returns top 10 stocks sorted by volume with live price, change %, volume, sector, market cap |
| `GET` | `/api/stocks/{ticker}/history` | Returns 6-month daily OHLCV (Open, High, Low, Close, Volume) data |
| `POST` | `/api/stocks/{ticker}/analyze` | Runs AI-powered analysis using HuggingFace Mistral-7B LLM |

### Example Responses

**GET /api/stocks/top10**
```json
{
  "stocks": [
    {
      "ticker": "NVDA",
      "company": "NVIDIA Corp.",
      "price": 875.60,
      "change": 2.34,
      "volume": 98000000,
      "marketCap": 2150000000000,
      "sector": "Technology",
      "currency": "USD"
    }
  ],
  "count": 10,
  "timestamp": "2026-04-16T10:30:00"
}
```

**POST /api/stocks/{ticker}/analyze**
```json
{
  "ticker": "AAPL",
  "company": "Apple Inc.",
  "analysis": {
    "trend": "Upward",
    "riskLevel": "Medium",
    "suggestedAction": "Long-term investment",
    "reason": "Over the past 6 months AAPL moved +12.3%. Daily return volatility is 1.85%, classifying it as medium risk."
  },
  "llmUsed": "Mistral-7B-Instruct-v0.3 (HuggingFace)",
  "disclaimer": "This is AI-generated analysis and not financial advice.",
  "dataPoints": 128,
  "analyzedAt": "2026-04-16T10:35:00"
}
```

---

## 🎨 Features

- **📊 Live Stock Dashboard** — Top 10 stocks with price, change %, volume bars, sector
- **📈 Interactive Charts** — 6-month price history with Recharts (area chart with tooltips)
- **🤖 AI Analysis** — One-click AI-powered investment analysis via HuggingFace
- **⚡ Real-time Data** — Live stock prices from Yahoo Finance via `yfinance`
- **🎯 Smart Fallbacks** — Mock data + rule-based analysis when APIs are unavailable
- **🌙 Dark Theme** — Premium glassmorphism UI with gradient accents
- **📱 Responsive** — Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Recharts, Axios |
| **Backend** | Python, FastAPI, Uvicorn |
| **AI/LLM** | HuggingFace Inference API, Mistral-7B-Instruct-v0.3 |
| **Data** | Yahoo Finance (yfinance), NumPy, Pandas |
| **Styling** | Vanilla CSS (custom design system, glassmorphism) |

---

## 📁 Project Structure

```
realticker-AI-powered-stock/
├── backend/
│   ├── main.py              # FastAPI server with all endpoints
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # HuggingFace token (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Top navigation bar
│   │   │   ├── Dashboard.jsx      # Main dashboard with hero + table
│   │   │   ├── StockTable.jsx     # Top 10 stocks table
│   │   │   ├── StockDetail.jsx    # Slide-out detail panel
│   │   │   ├── StockChart.jsx     # 6-month price chart (Recharts)
│   │   │   ├── AnalysisPanel.jsx  # AI analysis trigger + results
│   │   │   ├── LoadingSpinner.jsx # Loading state
│   │   │   └── ErrorState.jsx     # Error state with retry
│   │   ├── api.js           # Axios API client
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Full design system (740 lines)
│   ├── index.html           # HTML shell with Google Fonts
│   ├── vite.config.js       # Vite config with API proxy
│   └── package.json         # Node dependencies
├── .gitignore
└── README.md
```

---

## ⚠️ Disclaimer

> **This is AI-generated analysis and not financial advice.** The investment suggestions provided by this application are for educational and demonstration purposes only. Always consult a qualified financial advisor before making investment decisions.

---

## 👩‍💻 Author

**SORIM.Ai Team** — Built for the SORIM.Ai Hackathon Technical Assessment

---

*Built with ❤️ using React, FastAPI, and HuggingFace AI*
