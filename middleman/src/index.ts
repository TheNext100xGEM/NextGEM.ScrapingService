import express from 'express';
import mongoose from 'mongoose';
import { authenticateJWT } from './middleware/authMiddleware';
import { MONGODB_URI, PORT } from './utils/config';
import authRoutes from './routes/authRoutes';
import scrapeRoutes from './routes/scrapeRoutes';

const app = express();
app.use(express.json());

mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err.message);
});

app.use('/login', authRoutes);
app.use('/', authenticateJWT, scrapeRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
