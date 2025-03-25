import { ErrorHandler } from "./ErrorHandlers.js";

const asyncHandler = (requestHandler, options = {}) => {
    const { statusCode, message } = options;
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => {
                // console.log("Following is err: ", err);

                if (err instanceof ErrorHandler) {
                    return next(err);
                }
                const error = new ErrorHandler(
                    statusCode || 500,
                    message || "Internal server Error",
                    err.errors || [],
                    err.stack // Preserve original stack trace
                );

                next(error);
            });
    };
};



export { asyncHandler };