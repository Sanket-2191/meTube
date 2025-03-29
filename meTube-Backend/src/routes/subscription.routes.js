import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription } from "../controllers/subscription.controller.js";



export const subscriptionRouter = Router();


subscriptionRouter.route('/:channelId').post(verifyJWT, toggleSubscription)