import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/db.js"
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controlllers/clerkWebHooks.js"

connectDB()
const app = express()
app.use(cors())

// Middleware
app.use(express.json())
app.use(clerkMiddleware())

// API to listen for Clerk webhooks
app.use("/api/clerk", clerkWebhooks)

app.get("/", (req, res) => res.send("API is working!"))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))