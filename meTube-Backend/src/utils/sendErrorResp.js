import { ErrorHandler } from "./ErrorHandlers.js";

export const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json(
        new ErrorHandler(
            statusCode,
            message,
            null,
            null
        )
    );
};