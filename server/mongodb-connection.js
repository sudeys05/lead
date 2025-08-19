import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from 'dotenv';

dotenv.config();

let db = null;
let client = null;
let isConnected = false;

export async function connectToMongoDB() {
  try {
    if (isConnected) return db;

    console.log("🔗 Attempting to connect to MongoDB Atlas...");
    console.log(`MONGODB_URI = ${process.env.MONGODB_URI ? "[SET]" : "[NOT SET]"}`);

    if (!process.env.MONGODB_URI) {
      throw new Error("❌ MONGODB_URI is not set in environment variables!");
    }

    client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 30000, // 30 seconds
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 30000, // 30 seconds
    });

    await client.connect();
    console.log("✓ Connected to MongoDB Atlas successfully!");

    await client.db("admin").command({ ping: 1 });
    console.log("✓ MongoDB ping successful!");

    db = client.db("police"); // explicitly connect to 'police'
    isConnected = true;

    return db;
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    console.log("📋 MongoDB Connection Troubleshooting:");
    console.log("1. Check your MongoDB password is correct");
    console.log("2. Verify network access is allowed from anywhere (0.0.0.0/0)");
    console.log("3. Ensure your MongoDB cluster is running");
    console.log("4. Try connecting from your local machine first");
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not connected. Call connectToMongoDB() first.");
  }
  return db;
}

export function getMongoConnection() {
  return client;
}

export async function closeConnection() {
  if (isConnected && client) {
    await client.close();
    console.log("MongoDB connection closed");
    isConnected = false;
    db = null;
  }
}

process.on("SIGINT", async () => {
  await closeConnection();
  process.exit(0);
});