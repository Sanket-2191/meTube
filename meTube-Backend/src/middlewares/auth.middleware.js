import jwt from "jsonwebtoken";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/ErrorHandlers.js";
import { userModel } from "../models/user.model.js";

/// IS used every where user needs to be loggedin to be able to access the api.
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    // req.header("Authorization") used for mobile apps as they cant use cookies well.

    if (!token) throw new ErrorHandler(401, "Unauthorized request!")

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // @ts-ignore
        if (!decodedToken._id) throw new ErrorHandler(401, "Invalid token!")
        // t
        // @ts-ignore
        const user = await userModel.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) throw new ErrorHandler(401, "User not found!");

        req.user = user; // Attaching user to request
        next(); // Proceeding to next middleware
    } catch (error) {
        throw new ErrorHandler(401, "Invalid or expired token!");
    }
})