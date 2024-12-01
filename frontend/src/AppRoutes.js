import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import App from './App';  // Your main chat application
import ConversationHistory from './History';  // Import the conversation history component
import Register from './Register';  // Update the import to Register
import Login from './Login';  // Import the Login component
import PDFViewer from './PDFViewer';
import Sources from './Sources';

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect default route to login */}
      <Route path="/" element={<Navigate to="/register" />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Register page */}
      <Route path="/register" element={<Register />} />

      {/* Conversation history interface */}
      <Route path="/history" element={<ConversationHistory token={localStorage.getItem('token')} />} />

      {/* Main chat interface */}
      <Route path="/app" element={<App />} />

       {/* PDF Viewer Route */}
      <Route path="/file/pdf/:documentId" element={<PDFViewer />} />

      <Route path="/sources" element={<Sources />} />

    </Routes>
  );
}

export default AppRoutes;
