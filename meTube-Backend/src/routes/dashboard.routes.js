import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";


export const dashboardRouter = Router();

dashboardRouter.route('/stats').get(verifyJWT, getChannelStats);

dashboardRouter.route('/videos').get(verifyJWT, getChannelVideos);