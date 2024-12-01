import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './History.css'; 
import paaiLogo from './paai.png'; 
import { useNavigate, useLocation } from 'react-router-dom';

const History = ({ token }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchConversations = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5003/api/gpt/history', {
        params: { page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.conversations && response.data.conversations.length > 0) {
        setConversations(response.data.conversations);
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
      } else {
        setConversations([]);
      }
    } catch (error) {
      setError('Failed to fetch conversation history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations(currentPage);
  }, [fetchConversations, currentPage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isHistoryPage = location.pathname === '/history';
  const buttonLabel = isHistoryPage ? 'Chat' : 'History';
  const buttonDestination = isHistoryPage ? '/app' : '/history';

  const handleButtonClick = () => {
    navigate(buttonDestination);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={paaiLogo} alt="PAAI Logo" className="logo" />
       
        <div className="spacer"></div>

        <button className="sources-button" onClick={() => navigate('/sources')}>
          Sources
        </button>
        <button className="history-button" onClick={handleButtonClick}>
          {buttonLabel}
        </button>
        <button className="logout-button" onClick={handleLogout}>Log Out</button>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="history-container">
          {loading && <p>Loading...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && conversations.length === 0 && <p>No conversation history found.</p>}

          <div className="history-box">
            {conversations && conversations.map((conversation, index) => (
              <div key={index} className="conversation">
                {conversation.messages.map((message, msgIndex) => (
                  <div key={msgIndex} className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}>
                    <strong>{message.role === 'user' ? 'User: ' : 'Assistant: '}</strong> {message.content}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button onClick={() => fetchConversations(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => fetchConversations(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
