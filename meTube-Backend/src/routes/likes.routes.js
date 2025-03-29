import { Router } from "express";



import { verifyJWT } from "../middlewares/auth.middleware";
import {
    getLikedVideos, toggleCommentLike,
    toggleTweetLike, toggleVideoLike
} from "../controllers/like.controller";


export const likeRouter = Router();


likeRouter.route('/video/:videoId').post(verifyJWT, toggleVideoLike);

likeRouter.route('/comment/:commentId').post(verifyJWT, toggleCommentLike);

likeRouter.route('/tweet/:tweetId').post(verifyJWT, toggleTweetLike);

likeRouter.route('/liked-videos').get(verifyJWT, getLikedVideos)