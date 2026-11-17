import { MongoClient } from 'mongodb';

let client = null;
let db = null;

/**
 * Connects to the MongoDB database using the official MongoDB Native Driver.
 * Ensures a single shared client and database instance across the application lifecycle.
 *
 * @returns {Promise<import('mongodb').Db>}
 */
export const connectDB = async () => {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  if (!dbName) {
    throw new Error('DB_NAME is not defined in environment variables.');
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected successfully to MongoDB database: "${dbName}"`);
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
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
