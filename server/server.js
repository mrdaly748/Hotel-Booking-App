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

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", // Local
  "https://quickstay-one-rho.vercel.app", // Production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// Body Parser
app.use(express.json());

// Clerk Webhook (no auth middleware here)
app.use("/api/clerk", clerkWebhooks);

// Clerk Auth Middleware
app.use(clerkMiddleware());

// API Routes
app.get("/", (req, res) => {
  res.send(" API is working!");
});

app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

// Local Dev Server
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    try {
      await connectDB();
      await connectCloudinary();
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(` Server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error(" Failed to start server:", error.message);
      process.exit(1);
    }
  };

  startServer();
}

// Vercel Export (Serverless)

export default async function handler(req, res) {
  try {
    await connectDB();
    await connectCloudinary();
    return app(req, res);
  } catch (err) {
    console.error(" Serverless startup failed:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
