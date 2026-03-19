require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize scheduled jobs (credit maintenance)
const { initializeScheduledJobs } = require('./config/scheduler');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/psp', require('./routes/psp'));
app.use('/maintenance', require('./routes/maintenance'));
app.use('/cro', require('./routes/cro'));
app.use('/cfo', require('./routes/cfo'));
app.use('/external-psp', require('./routes/externalPsp'));
app.use('/webhook', require('./routes/webhook'));
app.use('/test', require('./routes/test'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CredMate PSP Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
initializeScheduledJobs();


module.exports = app;
