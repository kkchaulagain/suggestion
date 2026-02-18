const express = require('express');
const authRoutes = require('./routes/auth');
const feedbackFormRoutes = require('./routes/feedbackForms');
const { setupSwagger } = require('./swagger');

const app = express();
app.use(express.json());

setupSwagger(app);

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend', ok: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/feedback-forms', feedbackFormRoutes);

module.exports = app;
