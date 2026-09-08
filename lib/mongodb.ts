import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable. Add it to ".env.local".');
}

// maxIdleTimeMS keeps the driver from handing out a socket that went stale while a
// serverless function instance was frozen between invocations (the cause of
// "tlsv1 alert internal error" on Vercel) by proactively closing idle connections
// instead of reusing them.
const options = {
  maxIdleTimeMS: 10000,
  maxPoolSize: 10,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // Reuse the client across Turbopack/HMR reloads in dev so we don't
  // open a fresh connection to Atlas on every module re-evaluation.
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}
