import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WebSocketProvider } from './context/AblyProvider';
import { DebugProvider } from './context/DebugProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <WebSocketProvider>
      <DebugProvider>
        <App />
      </DebugProvider>
    </WebSocketProvider>
  </React.StrictMode>
);