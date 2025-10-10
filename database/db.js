
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { config } from '../config/config.js';

dotenv.config();

export const connectToDB = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from previous database connection');
      }
      
      console.log('Attempting to connect to:', config.mongodb.url);
      await mongoose.connect(config.mongodb.url);
      console.log('Connected to database:', mongoose.connection.name);
      console.log('Connected to the database Successfully.');
    } catch (err) {
      console.log('Database connection error:', err.message);
      setTimeout(connectToDB, 5000);
    }
  };