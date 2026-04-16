/**
 * api.js — Axios client for RealTicker backend
 *
 * All requests go to localhost:8000.
 * Vite proxies /api/* during dev so no CORS issues.
 *
 * TODO: add request caching so we don't hammer the API on every click
 */

import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 25_000,
  headers: { 'Content-Type': 'application/json' },
})

// Simple request logger (remove before production)
client.interceptors.request.use(cfg => {
  console.log(`[API] ${cfg.method?.toUpperCase()} ${cfg.url}`)
  return cfg
})

// Normalise errors so components always get a .message string
client.interceptors.response.use(
  res => res,
  err => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export const getTop10Stocks   = () => client.get('/api/stocks/top10').then(r => r.data)
export const getStockHistory  = (ticker) => client.get(`/api/stocks/${ticker}/history`).then(r => r.data)
export const runStockAnalysis = (ticker) => client.post(`/api/stocks/${ticker}/analyze`).then(r => r.data)

// Aliases used by components
export const fetchTop10Stocks  = getTop10Stocks
export const fetchStockHistory = getStockHistory
export const analyzeStock      = runStockAnalysis

export default client
