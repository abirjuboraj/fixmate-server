import { MongoClient } from 'mongodb';

let client = null;
let db = null;
let connectionPromise = null;

/**
 * Connects to the MongoDB database using the official MongoDB Native Driver.
 * Cached connection for serverless environments (Vercel) as well as traditional long-running Node processes.
 *
 * @returns {Promise<import('mongodb').Db>}
 */
export const connectDB = async () => {
  // Return existing database connection if already connected and healthy
  if (db && client && !client.topology?.isClosed()) {
    return db;
  }

  // If client was previously closed or invalid, reset cache to reconnect cleanly
  if (client && client.topology?.isClosed()) {
    db = null;
    connectionPromise = null;
  }

  // Prevent multiple concurrent connection attempts
  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  if (!dbName) {
    throw new Error('DB_NAME is not defined in environment variables.');
  }

  connectionPromise = (async () => {
    try {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log(`Connected successfully to MongoDB database: "${dbName}"`);
      return db;
    } catch (error) {
      connectionPromise = null; // reset promise on error
      console.error('Failed to connect to MongoDB:', error.message);
      throw error;
    }
  })();

  return connectionPromise;
};

/**
 * Returns the active MongoDB database instance.
 * Throws an error if connectDB() has not been executed yet.
 *
 * @returns {import('mongodb').Db}
 */
export const getDB = () => {
  if (!db) {
    throw new Error('Database is not initialized. Please call connectDB() before getDB().');
  }
  return db;
};

/**
 * Returns the active MongoClient instance (useful for transactions or graceful shutdown).
 *
 * @returns {MongoClient|null}
 */
export const getClient = () => {
  return client;
};
