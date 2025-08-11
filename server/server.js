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

connectCloudinary();

const app = express();
app.use(cors());

// Stripe webhook (must be raw)
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// JSON middleware after stripe raw
app.use(express.json());

// Clerk webhook (no auth needed)
app.use("/api/clerk", clerkWebhooks);

// Clerk middleware for protected routes
app.use(clerkMiddleware());

// Routes
app.get("/", (req, res) => res.send("API is working!"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

const PORT = process.env.PORT || 3000;

// Local dev: connect and start server
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  }).catch((err) => {
    console.error("❌ Failed to connect to DB:", err.message);
    process.exit(1);
  });
}

// In Vercel, `connectDB()` will be called inside each request handler (first call cached)
export default app;
