import React from 'react'
import { Provider } from 'react-redux'
import { store } from './app/store'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import BackToTop from './components/BackToTop.jsx'
import './index.css'
import './styles.css'

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <App />
        <BackToTop />
      </QueryClientProvider>
    </BrowserRouter>
    </Provider>
</React.StrictMode>
)