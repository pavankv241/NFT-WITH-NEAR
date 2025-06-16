import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { walletSelectorConfig } from './utils/wallet-selector';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletSelectorProvider config={walletSelectorConfig}>
      <App />
    </WalletSelectorProvider>
  </React.StrictMode>
);
