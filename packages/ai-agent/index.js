import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Use CORS to allow requests from any origin
app.use(cors());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/votes', voteRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
