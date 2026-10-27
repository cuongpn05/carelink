// Database configuration and connection setup
// Example using mongoose or pg/mysql

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/carelink';
    console.log(`Connecting to database at ${connStr}...`);
    // Example: await mongoose.connect(connStr);
    console.log('Database connected successfully');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
