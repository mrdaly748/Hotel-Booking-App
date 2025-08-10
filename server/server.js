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

// Explicit CORS configuration for deployed frontend
app.use(cors({
  origin: ['https://quickstay-one-rho.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// API to listen to stripe webhooks (before clerkMiddleware)
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

// Parse JSON bodies
app.use(express.json());

// Webhook route (no clerkMiddleware needed)
app.use("/api/clerk", clerkWebhooks);

// Protected routes with clerkMiddleware
app.use(clerkMiddleware());

// API routes
app.get("/", (req, res) => res.send("API is working!"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

// Connect to database and Cloudinary
const startServer = async () => {
  try {
    await connectDB(); // Ensure database is connected first
    await connectCloudinary(); // Then configure Cloudinary
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1); // Exit on failure, Vercel will handle restart
  }
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
});


export default app;
