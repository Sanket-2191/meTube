import { Router } from "express";


import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";


export const tweetRouter = Router();

tweetRouter.route('/').post(verifyJWT, upload.none(), createTweet);

tweetRouter.route('/user').get(verifyJWT, getUserTweets);

tweetRouter.route('/:tweetId').patch(verifyJWT, upload.none(), updateTweet);

tweetRouter.route('/:tweetId').delete(verifyJWT, deleteTweet);