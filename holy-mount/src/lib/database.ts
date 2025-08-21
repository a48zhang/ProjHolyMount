import { MongoClient, Db } from "mongodb";

class DatabaseManager {
  private static instance: DatabaseManager;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db("holy-mount");
      
      console.log("Connected to MongoDB");
      return this.db;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("Disconnected from MongoDB");
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  public isConnected(): boolean {
    return this.db !== null;
  }
}

export const dbManager = DatabaseManager.getInstance();