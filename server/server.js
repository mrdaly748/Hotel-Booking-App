import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controlllers/clerkWebHooks.js";

const app = express();
app.use(cors());
app.use(express.json());

// Webhook route (no clerkMiddleware needed)
app.use("/api/clerk", clerkWebhooks);

// Protected routes (if any)
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("API is working!"));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();