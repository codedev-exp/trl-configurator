import React from 'react'
import ReactDOM from 'react-dom/client'
import Configurator from './App'

const rootElement = document.getElementById('slatwall-root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Configurator />
    </React.StrictMode>,
  )
} else {
  console.error("Nie znaleziono kontenera #slatwall-root");
}

