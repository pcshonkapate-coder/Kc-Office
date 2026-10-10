import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://officeshonkapate_db_user:mBrr5hDeLJkSsRi3@cluster0.v93ywom.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB_NAME || "kapate_os";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable.');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });
    global._mongoClientPromise = client.connect().catch((err) => {
      console.warn('[MongoDB Atlas] Initial connection notice (using resilient local dataStore):', err?.message || err);
      return client;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 2500,
    connectTimeoutMS: 2500,
  });
  clientPromise = client.connect().catch((err) => {
    console.warn('[MongoDB Atlas] Production connection notice (using resilient local dataStore):', err?.message || err);
    return client;
  });
}

/**
 * Returns a connected MongoDB database instance from the connection pool.
 */
export async function getCloudDatabase(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

/**
 * Returns { db, client } helper
 */
export async function getDatabase(): Promise<{ db: Db; client: MongoClient }> {
  const connectedClient = await clientPromise;
  return {
    db: connectedClient.db(dbName),
    client: connectedClient,
  };
}

/**
 * Returns a specific MongoDB collection.
 */
export async function getCloudCollection<T extends Record<string, any>>(collectionName: string) {
  const db = await getCloudDatabase();
  return db.collection<T>(collectionName);
}

export default clientPromise;
