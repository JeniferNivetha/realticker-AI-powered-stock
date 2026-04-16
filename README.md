# RealTicker — AI-Powered Stock Insights Platform
> **SORIM.Ai Hackathon Technical Assessment**

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?logo=fastapi)
![AI](https://img.shields.io/badge/AI-HuggingFace%20Mistral--7B-yellow?logo=huggingface)

---

## Architecture

```
sorim tech project/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Dashboard.jsx      # Hero + market overview
│       │   ├── StockTable.jsx     # Top-10 table with volume bars
│       │   ├── StockDetail.jsx    # Slide-over detail panel
│       │   ├── StockChart.jsx     # Recharts 6-month area chart
│       │   ├── AnalysisPanel.jsx  # HuggingFace AI analysis
│       │   ├── LoadingSpinner.jsx
│       │   └── ErrorState.jsx
│       ├── api.js                 # Axios client
│       └── index.css              # Design system (dark glassmorphism)
└── backend/           # Python FastAPI
    ├── main.py        # All API routes
    ├── .env           # HF_TOKEN goes here
    └── requirements.txt
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/stocks/top10` | Top 10 stocks by volume |
| GET    | `/api/stocks/{ticker}/history` | 6-month OHLCV history |
| POST   | `/api/stocks/{ticker}/analyze` | HuggingFace LLM analysis |

## LLM Used
**Mistral-7B-Instruct-v0.3** via HuggingFace Inference API  
Falls back to rule-based analysis if no token is provided.

---

## Setup & Run

### 1. Backend
```bash
cd backend
pip install -r requirements.txt

# (Optional) Add your HuggingFace token for real LLM:
# Edit .env → HF_TOKEN=hf_xxxxxxxxxxxx

python main.py
# → http://localhost:8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Features
- ✅ Top 10 stocks table (ranked by volume) with change badges
- ✅ 6-month interactive price chart (Recharts AreaChart)
- ✅ AI analysis: **Trend / Risk Level / Suggested Action**
- ✅ HuggingFace Mistral-7B integration with rule-based fallback
- ✅ Real data via `yfinance`, mock fallback for offline use
- ✅ Loading & error states on every screen
- ✅ Dark glassmorphism UI with animations

> ⚠ **Disclaimer**: This is AI-generated analysis and not financial advice.
