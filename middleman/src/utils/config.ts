import dotenv from 'dotenv';

dotenv.config();

export const API_BASE_URL = process.env.API_BASE_URL || 'http://default.api.url';
export const PORT = +process.env.EXPRESS_PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/middleman';