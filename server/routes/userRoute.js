import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getUserData, storeRecentSearchedCities } from '../controlllers/userController.js';

const userRouter = express.Router();

userRouter.get('/', protect , getUserData) 
userRouter.post('/store-recent-search', protect , storeRecentSearchedCities) 

export default userRouter;