import React from 'react';  // Import React to avoid JSX error
import ReactDOM from 'react-dom/client';  // Updated for React 18
import './index.css';
import AppRoutes from './AppRoutes';  // Import AppRoutes to handle routing
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <AppRoutes />  {/* Use AppRoutes to handle navigation */}
    </Router>
  </React.StrictMode>
);

reportWebVitals();
