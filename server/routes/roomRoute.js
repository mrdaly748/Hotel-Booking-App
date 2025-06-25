import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createRoom, getOwnerRooms, getRoom, toggleRoomAvailability } from '../controlllers/roomController.js';
import upload from '../middleware/UploadMiddleware.js';



const roomRouter = express.Router();

roomRouter.post('/', upload.array("images",4),protect, createRoom)
roomRouter.get('/',getRoom)
roomRouter.get('/owner',protect, getOwnerRooms)
roomRouter.post('/toggle-availability',protect, toggleRoomAvailability)

export default roomRouter;