import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
 
    await connectDB();

  
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
