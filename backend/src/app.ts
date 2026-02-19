import type { Request, Response } from 'express';
const express = require('express');
const authRoutes = require('./routes/auth');
const feedbackFormRoutes = require('./routes/feedbackForms');
const { setupSwagger } = require('./swagger');

const app = express();
app.use(express.json());

setupSwagger(app);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from the backend', ok: true });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/feedback-forms', feedbackFormRoutes);

module.exports = app;
