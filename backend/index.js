// Entry point that loads environment variables before importing anything else
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Now import and run the server
import('./server.js');
