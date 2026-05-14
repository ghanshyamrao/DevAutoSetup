import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './components/Notifications';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </NotificationProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
