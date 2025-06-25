import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import stripe from "stripe";

// Function to check Availability of a Room
const checkAvailability = async (room, checkInDate, checkOutDate) => {
  try {
    console.log('Checking availability for room:', room, 'from', checkInDate, 'to', checkOutDate);
    const bookings = await Booking.find({
      room,
      $or: [
        { checkInDate: { $lte: checkOutDate, $gte: checkInDate } },
        { checkOutDate: { $gte: checkInDate, $lte: checkOutDate } },
      ],
    });
    console.log('Found bookings:', bookings);
    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.error(error.message);
  }
};

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability(room, checkInDate, checkOutDate);
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to create a new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    // Before Booking Check Availability
    const isAvailable = await checkAvailability(room, checkInDate, checkOutDate);

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // Get totalPrice from Room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    // Calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    let nights = Math.floor(timeDiff / (1000 * 3600 * 24));
    if (nights === 0 && checkOut > checkIn) nights = 1;
    console.log("pricePerNight:", roomData.pricePerNight, "nights:", nights, "totalPrice:", totalPrice * nights);
    totalPrice *= nights;

    // Create Booking
    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    res.json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to create booking" });
  }
};

// API to get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth().userId });
    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });
    // Total Bookings
    const totalBookings = bookings.length;
    // Total Revenue
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0
    );
    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Fetch the booking
    const booking = await Booking.findById(bookingId).populate("room");
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const roomData = booking.room;
    const totalPrice = booking.totalPrice;
    const { origin } = req.headers;

    if (!origin) {
      return res.json({ success: false, message: "Origin header missing" });
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY, {
    });

    console.log("Creating session with:", { totalPrice, roomData, origin });

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name || "Hotel Room",
          },
          unit_amount: Math.round(totalPrice * 100), // Ensure integer cents
        },
        quantity: 1,
      },
    ];

    // Create a checkout session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      metadata: {
        bookingId,
      },
    });

    console.log("Session created:", session.url);
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error.message, error.stack);
    res.json({
      success: false,
      message: "Failed to create payment session",
      error: error.message,
    });
  }
};