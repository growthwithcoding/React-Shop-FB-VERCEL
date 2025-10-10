import React from 'react'
import { Provider } from 'react-redux'
import { store } from './app/store'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import BackToTop from './components/BackToTop.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import AuthProvider from './auth/AuthProvider.jsx'
import './index.css'
import './styles.css'

// Font Awesome Configuration
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

// Add all icons to the library
library.add(fas, fab)

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>                              
          <QueryClientProvider client={qc}>
            <App />
            <BackToTop />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
