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

// ✅ Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000", // Local dev
  "https://quickstay-one-rho.vercel.app" // Production frontend
];

// ✅ Manual CORS middleware to handle OPTIONS preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ Stripe webhook must come before express.json()
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// ✅ JSON body parser for other routes
app.use(express.json());

// ✅ Webhook route (no Clerk middleware here)
app.use("/api/clerk", clerkWebhooks);

// ✅ Apply Clerk middleware for protected routes
app.use(clerkMiddleware());

// ✅ API routes
app.get("/", (req, res) => res.send("API is working!"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

// ✅ Start server
const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(Server is running on port ${PORT}));
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
});

// ✅ Export for Vercel serverless functions
export default app;
