require('dotenv').config();
require('./tasks/resetTokens');  
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authenticateToken = require('./middleware/auth');

// Import all routes
const authRoutes = require('./routes/auth');
const accountTypeRoutes = require('./routes/accountType');
const accountRoutes = require('./routes/account');
const userRoutes = require('./routes/user');
const sourceRoutes = require('./routes/source');
const documentRoutes = require('./routes/document');
const gptRoutes = require('./routes/gpt');  // GPT-related routes
const fileRoutes = require('./routes/fileRoutes');  

connectDB();  // Connect to MongoDB

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// Route usage
app.use('/api/auth', authRoutes);
app.use('/api/account-type', accountTypeRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/user', userRoutes);
app.use('/api/source', sourceRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/gpt', authenticateToken, gptRoutes); // Protect GPT routes with JWT
app.use('/api', fileRoutes); 


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
