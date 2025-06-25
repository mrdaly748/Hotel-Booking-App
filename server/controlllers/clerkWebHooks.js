import User from "../models/User.js"; 
import { Webhook } from "svix";

const clerkWebhooks = async (req, res) => {
  try {
    // Create a Svix instance with clerk webhook secret
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Get Headers
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify Headers
    let verifiedData;
    try {
      verifiedData = await whook.verify(JSON.stringify(req.body), headers);
      console.log("Webhook verified successfully");
    } catch (verifyError) {
      console.error("Webhook verification failed:", verifyError.message);
      return res.status(400).json({
        success: false,
        message: "Webhook verification failed",
        error: verifyError.message,
      });
    }

    // Get Data from request Body
    const { data, type } = verifiedData;

    // Prepare user data based on event type
    let userData;
    switch (type) {
      case "user.created":
      case "user.updated":
        userData = {
          _id: data.id,
          username: (data.first_name || "") + " " + (data.last_name || ""),
          email: data.email_addresses?.[0]?.email_address || "",
          image: data.image_url || "",
          recentSearchedCities: [],
        };
        if (type === "user.created") {
          await User.create(userData);
        } else {
          await User.findByIdAndUpdate(data.id, userData, { new: true, runValidators: true });
        }
        break;
      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;
      default:
        console.log("Unhandled event type:", type);
        return res.status(400).json({
          success: false,
          message: `Unhandled event type: ${type}`,
        });
    }

    res.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

export default clerkWebhooks;