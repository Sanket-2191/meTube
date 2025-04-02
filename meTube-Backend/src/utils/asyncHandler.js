import { ErrorHandler } from "./ErrorHandlers.js";

const asyncHandler = (requestHandler, options = {}) => {
    const { statusCode, message } = options;
    return (req, res, next) => {
        Promise
            .resolve(
                requestHandler(req, res, next)
            )
            .catch((err) => {
                // console.log("Following is err: ", err);
                // console.log("-----------------------------------------------------------------------------------------------------");
                if (err instanceof ErrorHandler) {
                    return next(err);
                }
                const error = new ErrorHandler(
                    statusCode,
                    message,
                    err.errors || [],
                    err.stack // Preserve original stack trace
                );

                return next(error);
            });
    };
};



export { asyncHandler };