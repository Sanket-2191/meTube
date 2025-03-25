import { Router } from "express";


import {
    addVideoToWatchHistory,
    changeUserPassword, getCurrentUser, getUserChannelProfile, loginUser, logoutUser,
    refreshAccessToken, registerUser, updateCurrentUserDetail,
    updateUserAvatar,
    updateUserCoverImage,
    userWatchHistory
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


// route for newAccessToken
userRouter.route('/newAuthenticationTokens').get(refreshAccessToken)

// get channelDetails
userRouter.route('/channelDetails/:username').get(getUserChannelProfile)

/*------------------------ SECURED ROUTES ------------------------------------------- */

// route for logout
userRouter.route('/logout').get(verifyJWT, logoutUser)

// get getCurrentUser
userRouter.route('/currentUserProfile').get(verifyJWT, getCurrentUser);

// change password
userRouter.route('/changePassword')
    .patch(verifyJWT, upload.none(), changeUserPassword)

// change fullname and email 
userRouter.route('/change-email-fullName')
    .patch(verifyJWT, upload.none(), updateCurrentUserDetail);

// change user avatar
userRouter.route('/change-avatar')
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// change user coverImage 
// BUG-FIXED: always make sure '/' before route for proper concatination of routes
userRouter.route('/change-coverImage')
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// add watchHistory....
userRouter.route('/add-to-watchHistory/:videoId').patch(verifyJWT, addVideoToWatchHistory);
// we'll be using params to send videoId not form-data so no need of upload.none()

// get loggedIn user's watchHistory
userRouter.route('/watchHistory').get(verifyJWT, userWatchHistory);


export { userRouter }