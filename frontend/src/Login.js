import React, { useState } from 'react';
import axios from 'axios';
import paaiLogo from './paai.png'; // Importing the logo

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5003/api/auth/login', { username, password });
      localStorage.setItem('token', response.data.token); // Store token in localStorage
      setError(null);
      window.location.href = '/app'; // Redirect to the main application
    } catch (err) {
      setError('Login failed, please try again.');
    }
  };
  

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        {/* Logo at the top */}
        <img src={paaiLogo} alt="PAAI Logo" style={{ width: '150px', margin: '0 auto 0px auto' }} /> 

        <h2>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', marginBottom: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: 'green', color: 'white' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;
