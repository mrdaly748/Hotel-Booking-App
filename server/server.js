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



connectCloudinary()

const app = express();
app.use(cors());

//API to listen to stripe webhooks
app.post('/api/stripe',express.raw({type: "application/json"}),stripeWebhooks)

app.use(express.json());


// Webhook route (no clerkMiddleware needed)
app.use("/api/clerk", clerkWebhooks);

// Protected routes (if any)
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("API is working!"));
app.use("/api/user", userRouter)
app.use("/api/hotels",hotelRouter)
app.use("/api/rooms",roomRouter)
app.use("/api/bookings" ,bookingRouter)


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