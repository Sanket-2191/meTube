import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";



const uri = `${process.env.ATLAS_URI}/${DB_NAME}${process.env.ATLAS_URI_tail}`

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(uri);

        console.log(`\n MONGODB connected: ${connectionInstance.connection.host}`);


    } catch (error) {
        console.log("Unable to connect to DB🤕 :", error);
        process.exit(1);

    }
};

