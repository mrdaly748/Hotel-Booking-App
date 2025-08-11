import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controlllers/clerkWebHooks.js";
import userRouter from "./routes/userRoute.js";
import hotelRouter from "./routes/hotelRoute.js";
import connectCloudinary from "./config/cloudinary.js";
import roomRouter from "./routes/roomRoute.js";
import bookingRouter from "./routes/bookingRoute.js";
import { stripeWebhooks } from "./controlllers/stripeWebhooks.js";

const app = express();

// Explicit CORS configuration
app.use(cors({
  origin: ['https://quickstay-one-rho.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Stripe webhook
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

app.use(express.json());

// Webhook route
app.use("/api/clerk", clerkWebhooks);

// Protected routes
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("API is working!"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

// Fallback route
app.get('*', (req, res) => res.status(500).json({ error: 'Server error' }));

// Initialize services asynchronously
const initializeServices = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    await connectCloudinary();
    console.log("Cloudinary connected successfully");
  } catch (error) {
    console.error("Service initialization failed:", error.message);
    // Continue without crashing, Vercel will handle the error
  }
};

// Start services on function load
initializeServices();

// Export for Vercel serverless
export default app;
