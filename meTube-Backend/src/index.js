// require('dotenv').config({ path: '../.env' })
import dotenv from 'dotenv';

import express from 'express';

export const app = express();


dotenv.config(
    {
        path: '../env'
    }
)