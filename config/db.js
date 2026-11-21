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
  // Already connected? Reuse it. If the driver closed the topology after a
  // failed connection (v7 does this on any connect error), reconnect the SAME
  // client so the cached `db` reference stays valid for every model.
  if (db) {
    const topology = client?.topology;
    if (!topology || topology.isConnected()) return db;
    await client.connect();
    return db;
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
      // Small pool per serverless instance: many warm instances × a large
      // default pool (100) can exhaust a shared Atlas cluster's connections.
      client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
      });
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
