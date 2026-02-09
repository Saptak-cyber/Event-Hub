import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const verifyAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await User.updateMany(
      {},
      { $set: { isEmailVerified: true } }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} users - all emails now verified`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyAllUsers();
