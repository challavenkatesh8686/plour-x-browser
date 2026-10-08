import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './theme.css';
import './design/tokens.css';
import './design/morphism.css';
import './design/surfaces.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

const boot = document.getElementById('boot')
if (boot) {
  requestAnimationFrame(() => {
    boot.classList.add('hide')
    window.setTimeout(() => boot.remove(), 300)
  })
}
