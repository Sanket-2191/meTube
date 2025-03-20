// require('dotenv').config({ path: '../.env' })
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';

export const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// handle data from body, forms, etc and set a limit to prevent server overload....
app.use(express.json({
    limit: "16kb"
}))

// for endcoded data from URLs
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

// easily serve static files like favicon, images, pages......
app.use(express.static('../public'))

app.use(cookieParser());



dotenv.config(
    {
        path: '../env'
    }
)