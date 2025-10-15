import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { TokenProvider } from './context/TokenContext';
import { UserProvider } from './context/UserContext';

createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <UserProvider>
      <TokenProvider>
        <App />
      </TokenProvider>
    </UserProvider>
  </MemoryRouter>
);