// require('dotenv').config({ path: '../.env' })
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

export const app = express();

(() => {
    app.use(cors({
        origin: process.env.CORS_ORIGIN,
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
app.get('/', (req, res) => {
    return res.status(200)
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


// user end-points
app.use('/api/v1/users', userRouter);
//video end-points
app.use('/api/v1/videos', videoRouter)
// subscription end-points..
app.use('api.v1/subscriptions', subscriptionRouter);
// like end-points
app.use('/api/v1/likes', likeRouter);