import { MongoClient, Db, Collection, Document } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://officeshonkapate_db_user:mBrr5hDeLJkSsRi3@cluster0.v93ywom.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB_NAME || "kapate_os";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (global._mongoClientPromise) {
    try {
      const client = await global._mongoClientPromise;
      return client;
    } catch {
      global._mongoClientPromise = undefined;
    }
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });

  global._mongoClientPromise = client.connect().catch((err) => {
    global._mongoClientPromise = undefined;
    throw err;
  });

  return global._mongoClientPromise;
}

/**
 * Returns a connected MongoDB database instance from the connection pool.
 */
export async function getCloudDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

/**
 * Returns { db, client } helper
 */
export async function getDatabase(): Promise<{ db: Db; client: MongoClient }> {
  const client = await getMongoClient();
  return { db: client.db(dbName), client };
}

/**
 * Helper to get a typed collection directly
 */
export async function getCloudCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db = await getCloudDatabase();
  return db.collection<T>(name);
}
