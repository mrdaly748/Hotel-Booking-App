import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("MONGODB_URI is not defined in environment variables");
    throw new Error("Database connection failed: Missing MONGODB_URI");
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Increase to 15 seconds for Vercel cold starts
    heartbeatFrequencyMS: 10000, // Check connection every 10 seconds
    maxPoolSize: 10, // Limit connections for serverless
    autoIndex: false, // Disable auto-indexing to reduce startup time
  };

  const connectWithRetry = async (attempt = 1) => {
    try {
      await mongoose.connect(mongoURI, options);
      mongoose.connection.on("connected", () =>
        console.log("Database connected successfully")
      );
      mongoose.connection.on("error", (error) =>
        console.error(`MongoDB connection error: ${error.message}`)
      );
      mongoose.connection.on("disconnected", () =>
        console.log("Database connection disconnected")
      );
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < 3) {
        const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return connectWithRetry(attempt + 1);
      }
      throw new Error(`Failed to connect to MongoDB after ${attempt} attempts: ${error.message}`);
    }
  };

  await connectWithRetry();
};

export default connectDB;
