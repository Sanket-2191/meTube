import { ErrorHandler } from "./ErrorHandlers.js";

const asyncHandler = (requestHandler, options = {}) => {
    const { statusCode, message } = options
    return (req, res, next) => {
        Promise
            .resolve(
                requestHandler(req, res, next)
            )
            .catch((err) => {
                const error = new ErrorHandler(statusCode || 500, message || "Internal server Error" + err);

                next(error);
            })
    }
}



export { asyncHandler };