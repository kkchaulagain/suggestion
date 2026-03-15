import type { Request, Response } from 'express';
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const feedbackFormRoutes = require('./routes/feedbackForms');
const pageRoutes = require('./routes/pages');
const uploadRoutes = require('./routes/upload');
const usersRoutes = require('./routes/users');
const v1Routes = require('./routes/v1');
const { setupSwagger } = require('./swagger');

import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // allow any origin (reflects request origin; works with credentials)
  credentials: true,
}));

setupSwagger(app);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the backend', ok: true });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/feedback-forms', feedbackFormRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/v1', v1Routes);



module.exports = app;
