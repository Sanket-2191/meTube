import { Router } from "express";


import {
    changeUserPassword, getCurrentUser, loginUser, logoutUser,
    refreshAccessToken, registerUser, updateCurrentUserDetail,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const userRouter = Router();

// route for registration
userRouter.route('/register')
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
// upload.none() only needed when form-data is received


// route for logout
userRouter.route('/logout').get(verifyJWT, logoutUser)

// route for newAccessToken
userRouter.route('/newAuthenticationTokens').get(refreshAccessToken)

// change password
userRouter.route('/changePassword')
    .post(verifyJWT, upload.none(), changeUserPassword)

// get getCurrentUser
userRouter.route('/userProfile').get(verifyJWT, getCurrentUser);

// change fullname and email 
userRouter.route('/change-email-fullName')
    .post(verifyJWT, upload.none(), updateCurrentUserDetail);

// change user avatar
userRouter.route('/change-avatar')
    .post(verifyJWT, upload.single("avatar"), updateUserAvatar);

// change user coverImage 
// BUG-FIXED: always make sure '/' before route for proper concatination of routes
userRouter.route('/change-coverImage')
    .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

export { userRouter }