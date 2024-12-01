import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';  // Import Link for navigation

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5003/api/auth/register', { username, password });
      setSuccess(response.data.message);
      setError('');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Error registering user');
      setSuccess('');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '300px', width: '100%' }}>
        {/* Centered logo */}
        <div style={{ textAlign: 'center' }}>
          <img src={require('./paai.png')} alt="PAAI Logo" style={{ width: '150px', marginBottom: '20px' }} />
        </div>

        {/* Left-aligned Register text */}
        <div style={{ textAlign: 'left' }}>
          <h2>Register</h2>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '10px', width: '90%' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '10px', width: '90%' }}
              required
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', width: '100%' }}>
            Register
          </button>
        </form>
        <p style={{ marginTop: '10px' }}>
          Already have an account? Log in <Link to="/login">here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
