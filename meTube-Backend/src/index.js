// require('dotenv').config({ path: '../.env' })
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import swagger from 'swagger-ui-express';
import fs from 'fs';

// @ts-ignore
const apiDocs = JSON.parse(fs.readFileSync(new URL('../swagger.json', import.meta.url), 'utf-8'));

export const app = express();

(() => {
    app.use("/api/v1/meTube-docs", swagger.serve, swagger.setup(apiDocs))

    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }));

    console.log("in index.js");

    // handle data from body, forms, etc and set a limit to prevent server overload....
    app.use(express.json({
        limit: "16kb"
    }))

    // for endcoded data from form-data
    app.use(express.urlencoded({
        extended: true,
        limit: "16kb"
    }))

    // easily serve static files like favicon, images, pages......
    app.use(express.static('public'))
    /*
        public and not ../public because the root dir is considered to be the dir, where entry point is present
        and here entry point "src/server.js" is in meTube-Backend hence "public" willbe searched in "meTube-Backend"
     
    */
    app.use(cookieParser());

    dotenv.config(
        {
            path: '../env'
        }
    )
}
)();

// checking server running status.....

import { APIresponse } from './utils/APIresponse.js';
//@ts-ignore
app.get('/', (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    }
    return res.status(200)
        // .clearCookie("accessToken")
        .json(
            new APIresponse(
                200,
                {},
                "ALL OK👍👍"
            )
        )
})


/// ROUTEs import 
import { userRouter } from './routes/user.routes.js';
import { videoRouter } from './routes/video.routes.js';
import { subscriptionRouter } from './routes/subscription.routes.js';
import { likeRouter } from './routes/likes.routes.js';
import { tweetRouter } from './routes/tweet.routes.js';
import { commentRouter } from './routes/comments.routes.js';
import { playListRouter } from './routes/playlists.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
(() => {


    const urlPrefix = '/api/v1/';

    // user end-points
    app.use(`${urlPrefix}users`, userRouter);
    //video end-points
    app.use(`${urlPrefix}videos`, videoRouter);
    // subscription end-points..
    app.use(`${urlPrefix}subscriptions`, subscriptionRouter);
    // like end-points
    app.use(`${urlPrefix}likes`, likeRouter);
    //tweet endpoints
    app.use(`${urlPrefix}tweets`, tweetRouter);
    // comments end-points
    app.use(`${urlPrefix}comments`, commentRouter);
    // playlsits end-points
    app.use(`${urlPrefix}playlists`, playListRouter);
    // dashboard end-points
    app.use(`${urlPrefix}dashboard`, dashboardRouter);
})()