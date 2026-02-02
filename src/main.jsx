import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Note: StrictMode removed to avoid AbortError issues with Supabase client
// This can be re-enabled once the Supabase client fixes the AbortController issue
// or when we fully migrate to native fetch for all operations
createRoot(document.getElementById('root')).render(
  <App />,
)
