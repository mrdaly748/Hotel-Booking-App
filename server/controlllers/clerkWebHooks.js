import { json } from "express";
import User from "../models/User.js";
import { Webhook } from "svix";

const clerkWebhooks = async (req, res) => {
  try {
    // Create a Svix instance with clerk webhook secret.
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Getting Headers
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verifying Headers
    try {
      await whook.verify(JSON.stringify(req.body), headers);
      console.log("Webhook verified successfully");
    } catch (verifyError) {
      console.error("Webhook verification failed:", verifyError.message);
      throw verifyError;
    }

    //Getting Data from request Body

    const { data, type } = req.body;

    const userData = {
      _id: data.id,
      username: data.first_name + " " + data.last_name,
      email: data.email_addresses[0].email_address,
      image: data.image_url,
      recentSearchedCities: [],
    };

     console.log("userData:", userData); 

    //Switch case to handle different webhook events
    switch (type) {
      case "user.created":
        // Create a new user in the database
        await User.create(userData);
        break;
      case "user.updated":
        // Update the existing user in the database
        await User.findByIdAndUpdate(data.id, userData);
        break;
      case "user.deleted":
        // Delete the user from the database
        await User.findByIdAndDelete(data.id);
        break;
      default:
        console.log("Unhandled event type:", type);
    }
    res.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    // Handle error
    console.log(error.message);
    res.json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

export default clerkWebhooks;
