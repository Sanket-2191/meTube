import { Router } from "express";


import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const userRouter = Router();

// route for registration
userRouter
    .route('/register')
    .post(
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverimage",
                maxCount: 1
            }
        ]),
        registerUser
    )

// route for login
userRouter.route('/login').post(upload.none(), loginUser)


// route for logout
userRouter.route('/logout').get(verifyJWT, logoutUser)

export { userRouter }