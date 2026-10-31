const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Tải file .env từ thư mục server kể cả khi chạy từ thư mục gốc
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const caregiverRoutes = require('./routes/caregiverRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CareLink Server is running',
  });
});

// Authentication & Account Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// User Profile Routes
app.use('/api/user', userRoutes);
app.use('/api/v1/user', userRoutes);

// Caregiver Routes
app.use('/api/caregivers', caregiverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống nội bộ.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start Server after connecting to Database
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CareLink Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
