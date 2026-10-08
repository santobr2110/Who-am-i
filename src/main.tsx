import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { RoomProvider } from './net/room';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/game.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RoomProvider>
      <App />
    </RoomProvider>
  </StrictMode>,
);
