import { v2 as cloudinary } from "cloudinary";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

export const createRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities } = req.body;
    const hotel = await Hotel.findOne({ owner: req.auth.userId });

    if (!hotel) return res.json({ success: false, message: "No Hotel found" });

    const uploadImages = req.files.map(async (file) => {
      try {
        const response = await cloudinary.uploader.upload(file.path);
        return response.secure_url;
      } catch (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    });

    const images = await Promise.all(uploadImages);

    await Room.create({
      hotel: hotel._id,
      roomType,
      pricePerNight: +pricePerNight,
      amenities: JSON.parse(amenities),
      images,
    });

    res.json({ success: true, message: "Room created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoom = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true })
      .populate({
        path: "hotel",
        populate: { path: "owner", select: "image" },
      })
      .sort({ createdAt: -1 })
      .limit(50) // Prevent timeout with large datasets
      .lean(); // Reduce processing overhead

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOwnerRooms = async (req, res) => {
  try {
    const hotelData = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotelData) return res.json({ success: false, message: "No Hotel found" });

    const rooms = await Room.find({ hotel: hotelData._id })
      .populate("hotel")
      .limit(50) // Prevent timeout
      .lean();

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ success: false, message: "Room ID required" });

    const roomData = await Room.findById(roomId);
    if (!roomData) return res.status(404).json({ success: false, message: "Room not found" });

    roomData.isAvailable = !roomData.isAvailable;
    await roomData.save();
    res.json({ success: true, message: "Room availability updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
