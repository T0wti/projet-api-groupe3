import express from 'express';
import dotenv from 'dotenv';
import { initDb } from './config/db';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
app.use(express.json());

initDb();

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
