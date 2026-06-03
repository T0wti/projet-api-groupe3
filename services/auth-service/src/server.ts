import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Similar to Angular HTTP Interceptors, but on the receiving end)
app.use(cors());
app.use(express.json()); // Allows Express to read JSON body requests

// A simple test route
app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'UP', message: 'Auth service is running smoothly!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on http://localhost:${PORT}`);
});