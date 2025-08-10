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

// Explicit CORS configuration - apply before any routes or middleware
app.use(cors({
  origin: ['https://quickstay-one-rho.vercel.app'], // Allow your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Handle preflight methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow token header
  credentials: true, // If cookies or auth credentials are needed
}));

// Stripe webhook (raw body, before json parser)
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

// JSON body parser for other routes
app.use(express.json());

// Webhook route (no clerkMiddleware)
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
    await connectDB(); // Database first
    await connectCloudinary(); // Cloudinary second
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
});

// Export for Vercel serverless
export default app;
