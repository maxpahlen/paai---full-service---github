const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MongoDB URI is not defined in the environment variables.");
    }
    await mongoose.connect(uri, {
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);  // Exit process if there's a connection error
  }
};

module.exports = connectDB;
