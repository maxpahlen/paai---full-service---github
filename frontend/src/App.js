import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import Login from './Login'; 
import { useNavigate, useLocation } from 'react-router-dom';
import paaiLogo from './paai.png';
import axios from './axiosConfig';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [monthlyTokenCount, setMonthlyTokenCount] = useState(0);
  const [tokensAvailable, setTokensAvailable] = useState(0);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const chatBoxRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [outOfTokens, setOutOfTokens] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleLogin = (jwtToken, username) => {
    setToken(jwtToken);
    setUsername(username);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('username', username);
    fetchMonthlyTokens(jwtToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername('');
    setMessages([]);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  const fetchMonthlyTokens = useCallback(async (jwtToken) => {
    try {
      const response = await axios.get('http://localhost:5003/api/account/token-info', {
        headers: {
          Authorization: `Bearer ${jwtToken || token}`,
        },
      });
      
      const { tokensUsed = 0, tokensAllowed = 0, tokensRemaining = tokensAllowed - tokensUsed } = response.data;
      setMonthlyTokenCount(tokensUsed);
      setTokensAvailable(tokensRemaining);
    } catch (error) {
      console.error('Error fetching token data:', error);
      setMonthlyTokenCount(0);
      setTokensAvailable(0);
    }
  }, [token]);

  const sendMessage = async () => {
    if (!token) {
      setSessionExpired(true);
      return;
    }
    if (input.trim() === '') return;

    if (tokensAvailable <= 0) {
      setOutOfTokens(true);
      return;
    }

    const newMessage = { role: 'user', content: input };
    setMessages([...messages, newMessage]);

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:5003/api/gpt/chat',
        { prompt: input },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const gptResponse = { role: 'assistant', content: response.data.response };
      setMessages([...messages, newMessage, gptResponse]);

      // Fetch updated tokens after receiving response
      await fetchMonthlyTokens();

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const isHistoryPage = location.pathname === '/history';
  const buttonLabel = isHistoryPage ? 'Chat' : 'History';
  const buttonDestination = isHistoryPage ? '/' : '/history';

  const handleButtonClick = () => {
    navigate(buttonDestination);
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (token) {
      fetchMonthlyTokens();
    }
  }, [token, fetchMonthlyTokens]);

  useEffect(() => {
    const handleSessionExpired = () => setSessionExpired(true);
    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  if (sessionExpired) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2>Session Expired</h2>
          <p>Your session has expired. Please log in again to continue.</p>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: 'green',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              navigate('/login');
            }}
          >
            Log In Again
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
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

      <div className="main-content">
        <div className="top-bar">
          <div className="total-tokens">
            Tokens used this month: {monthlyTokenCount} | Tokens available: {tokensAvailable}
          </div>
          <div className="profile">{username}</div>
        </div>

        <div className="chat-container">
          <div className="chat-box" ref={chatBoxRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            ))}
            {loading && <div className="chat-message assistant">Typing...</div>}
          </div>
          
          {outOfTokens ? (
            <div style={{ color: 'red', textAlign: 'center', margin: '10px' }}>
              You have run out of tokens.
            </div>
          ) : (
            <div className="chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
