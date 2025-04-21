import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { userModel } from "../models/user.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteAssestFromCloudinary } from "../utils/deleteCloudinaryAsset.js";
import { sendError } from "../utils/sendErrorResp.js";
import { sendAPIResp } from "../utils/sendApiResp.js";


const generate_Access_And_Refresh_Token = async (res, userID) => {

    try {
        const user = await userModel.findById({ _id: userID });
        // can also be written as userModel.findById(userID)

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false }); // got error because of validation checks in mongoose
        /*
            whenever we save mongoose object all validations (like password checks, username check) 
            also gets triggered, since we are not providing them here, by using { validateBeforeSave: false },
            we can save any field without worrying about those validations.
        */

        return { accessToken, refreshToken };

    } catch (error) {
        return sendError(res, 500, "Error while generating Access token");
    }

}

// works ✅✅
export const registerUser = asyncHandler(async (req, res) => {
    // get user detail from frontend
    const { fullname, email, username, password } = req.body;
    console.log("req.body structure: ", req.body);

    // validations -> fields are not empty, email is in valid form, password matches strength requirements
    if (!email) return sendError(res, 400, "Email is required!!");
    if (!fullname) return sendError(res, 400, "Fullname is required!!");
    if (!username) return sendError(res, 400, "Username is required!!");
    if (!password) return sendError(res, 400, "Password is required!!");


    // check if user exists
    const userEmailExisits = await userModel.findOne({ email })
    if (userEmailExisits) return sendError(res, 409, "Account already exists with email :" + email);

    const usernameExisits = await userModel.findOne({ username })
    if (usernameExisits) return sendError(res, 409, "Account already exists with username :" + username);

    // check for images, check for avatar , cover image is OPTIONAL
    // console.log("Files received:?", req.files || "files not received");
    // console.log("coverImage :", (!req.files?.coverimage ? "false" : "true"));

    const avatarFilePath = req.files?.avatar[0]?.path;
    if (!avatarFilePath) return sendError(res, 400, "Avatar file is required");

    const coverImageFilePath = req.files?.coverimage?.[0]?.path;

    // upload them to cloudinary
    const avatarURL = await uploadOnCloudinary(avatarFilePath);
    let coverImageURL = null;
    if (coverImageFilePath) coverImageURL = await uploadOnCloudinary(coverImageFilePath);
    if (!avatarURL) return sendError(res, 500, "Avatar creation failed");


    // create user object, get object from DB
    const newUser = await userModel.create({
        username,
        fullName: fullname,
        email,
        password,
        avatar: avatarURL.url,
        coverImage: coverImageURL?.url || "",
    })

    // remove password and refresh tkn from feild from response that is being sent to frontend
    const createdUser = await userModel.findById({ _id: newUser._id }).select("-password -refreshToken")

    // check if user is created
    if (!createdUser) return sendError(res, 500, "New User creation failed");


    // return response.
    return sendAPIResp(res, 201, "User creation successful✅✅", createdUser);

},
    { statusCode: 500, message: "Something went wrong while registration of the user" }
);

// works ✅✅
export const loginUser = asyncHandler(async (req, res) => {
    // data from req.body
    const { email, password, username } = req.body;
    // check credentials for login
    console.log("login req.body: ", req.body);

    if (!username && !email) {
        return sendError(res, 400, "Username or email needed!");
    }

    // find the user
    const user = await userModel.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        return sendError(res, 404, "Cannot find user, please complete registration!");
    }

    // check password
    const isPasswordValid = await user.isPasswordCorrect(res, password || "");
    if (!isPasswordValid) {
        return sendError(res, 401, "Invalid password entered!");
    }

    // generate access and refresh tokens..
    const { accessToken, refreshToken } = await generate_Access_And_Refresh_Token(res, user._id)

    // send tokens with cookie
    const loggedInUser = await userModel.findById(user._id).select("-password -refreshToken");

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    }

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new APIresponse(200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                }
                , `${loggedInUser.username} logged in successfully✅✅`)
        )
},
    { statusCode: 500, message: "Something went wrong while logging-in" }
);


// works ✅✅
export const logoutUser = asyncHandler(async (req, res) => {
    // get userId from req.user set in auth midware
    const user = await userModel.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1 // removes the feild from doc
            }
        },
        {
            new: true
        }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    }

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new APIresponse(200,
                {},
                "User loggedout😥"
            )
        )
},
    { statusCode: 500, message: "Something went wrong while logging-out" })


// works ✅✅
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
    // get refreshToken from req object...
    const incomingRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken || undefined;

    // check if token is present
    if (!incomingRefreshToken) return sendError(res, 401, "Unauthorized Access! please login again");
    // decode the data contained with token..
    const tokenPayload = jwt.verify(  // this gives _id of user.
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    // @ts-ignore
    // use token data to get the required user.
    const user = await userModel.findById(tokenPayload._id);
    // console.log("user while refreshing tokens : ", user);

    // check if refreshtoken had an id error if refreshToken is expired, (we won't use as no Id)
    if (!user) return sendError(res, 401, "Invalid refreshToken!");

    // check if expired refresh token is being used....
    if (incomingRefreshToken !== user.refreshToken) return sendError(res, 401, "Refreshtoken is expired! please login again");

    // generate new set of tokens, below method will update refreshtoken in DB.
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generate_Access_And_Refresh_Token(res, user._id);
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
    }

    return res.status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new APIresponse(
                200,
                {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                },
                "User LoggedIn successfully with new tokens✅✅"
            )
        )
},
    { statusCode: 500, message: "Unable to get access tokens please login again" });

// works ✅✅
export const changeUserPassword = asyncHandler(async (req, res) => {
    // get old password and newPassword.
    const { oldPassword, newPassword } = req.body;

    // get user._id from req.user and get user from DB
    /*
        we know req obj will have user because, we are using authMidware in changePassword route
    */
    const user = await userModel.findById(req.user?._id);

    // check for old password 
    const isPasswordCorrect = await user.isPasswordCorrect(res, oldPassword);
    if (!isPasswordCorrect) return sendError(res, 400, "Old password is incorrect!");

    // set new password, bcrypt in usermodel will handle hashing of password.
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return sendAPIResp(res, 200, "Password changed successfully✅✅", {});
},
    { statusCode: 500, message: "Password change failed :" });

// works ✅✅
export const getCurrentUser = asyncHandler(async (req, res) => {
    return sendAPIResp(res, 200, "Current user fetched successfully✅✅", req.user);
},
    { statusCode: 500, message: "Unable to fetch Current user." });

// BUG-FIXED Make sure the feidnames match in code and in form-data
// works ✅✅
export const updateCurrentUserDetail = asyncHandler(async (req, res) => {
    console.log("userDetails received in body...", req.body);

    const { fullName, email } = req.body;

    console.log("1. find the user with req.user._id=", req.user._id);

    if (!(fullName && email)) return sendError(res, 400, "All fields are required");

    console.log("2. find the user with req.user._id=", req.user._id);
    const updatedUser = await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");
    // console.log("couldn't find the user with req.user._id=", req.user._id);
    if (!updatedUser) return sendError(res, 404, "User not found");

    return sendAPIResp(
        res,
        200,
        "User updated successfully✅✅",
        updatedUser
    );
},
    { statusCode: 500, message: "Email and fullName update failed :" });

// BUG-FIXED while uploading single file multer send req.file not req.files so => req.file.path directly
// works ✅✅

export const updateUserAvatar = asyncHandler(async (req, res) => {
    // get avatar file objects from req.file not req.files as we are only accepting for one field.
    const avatar = req.file;
    if (!avatar) return sendError(res, 400, "No file received for avatar update");

    // get localFilePath for avatar.
    const avatarLocalFilePath = avatar?.path;
    if (!avatarLocalFilePath) return sendError(res, 500,
        "Unable to create file locally while avatar update!");

    // get URL for avatarFile from cloudinary...
    const cloudinaryOBJ = await uploadOnCloudinary(avatarLocalFilePath);
    const avatarURL = cloudinaryOBJ.url;
    if (!avatarURL) return sendError(res, 500, "Unable to create cloudinary-url for avatar update!");

    // update user with new avatar URL
    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatarURL
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    // delete old avatar from cloudinary..
    const deleted = await deleteAssestFromCloudinary(res, req.user.avatar);
    if (deleted.result !== "ok") return sendError(res, 500, `Cloudinary avatar delete failed: ${deleted.result}`)

    return sendAPIResp(
        res,
        200,
        "Avatar update successful✅✅",
        user
    );
},
    { statusCode: 500, message: "Avatar update failed :" });

// BUG-FIXED while uploading single file multer send req.file not req.files so => req.file.path directly
// works ✅✅
export const updateUserCoverImage = asyncHandler(async (req, res) => {

    // get coverImage file objects from req.file not req.files as we are only accepting for one feild.
    // console.log("coverImage file :", req.file);

    const coverImage = req.file;
    if (!coverImage) return sendError(res, 400, "No file received for coverImage update");

    // get localFilePath for coverImage.
    const coverImageLocalFilePath = coverImage?.path;
    if (!coverImageLocalFilePath) return sendError(res, 500, "Unable to create file locally while coverImage update!");
    // console.log("coverImage loc path done");


    // get URL for coverImageFile from cloudinary...
    const cloudinaryOBJ = await uploadOnCloudinary(coverImageLocalFilePath);
    const coverImageURL = cloudinaryOBJ.url;
    // console.log("coverImage url path done :", cloudinaryOBJ);

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImageURL
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    // delete old coverImage from cloudinary..
    const deleted = await deleteAssestFromCloudinary(res, req.user.coverImage);

    if (deleted.result !== "ok") return sendError(res, 500, `Cloudinary coverImage delete failed`)


    return sendAPIResp(res, 200, "coverImage update successful✅✅", user);

},
    { statusCode: 500, message: "coverImage update failed :" })


// works ✅✅
export const getUserChannelProfile = asyncHandler(async (req, res) => {
    // this will generally get trggered when user clicks on other channel link or profile...
    // get username from params
    const { username, userId } = req.params;  // we will 
    console.log("req.params.username :", username);

    if (!username?.trim()) return sendError(res, 400, "No username received for fetching channel profile.");

    if (userId && !(mongoose.isValidObjectId(userId))) return sendError(res, 400, "userId should be valid for fetching channel profile.");

    const channelProfile = await userModel.aggregate(
        [
            userId ? {
                $match: {
                    userId: userId
                }
            } : {
                $match: {
                    username: username
                }
            },
            // find subscribers to user....
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "allSubscribers"
                }
            },
            // find no of user currUser has subscribed to.
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscriberCount: {
                        $size: "$allSubscribers"
                    },
                    subscriptionCount: {
                        $size: "$subscribedTo"
                    },
                    // if logged in user is in the list of "allSubscribers"
                    isSubscribed: {
                        $cond: {
                            //          what to check , where it is checked in
                            if: { $in: [req.user?._id, "$allSubscribers.subscriber"] },
                            // req.user?._id as secure route is not needed to access this controller
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscriberCount: 1,
                    subscriptionCount: 1,
                    isSubscribed: 1
                }
            }
        ]
    )

    if (!channelProfile?.length) return sendError(res, 404, "channel not found");

    return sendAPIResp(res, 200, 'Channel profile fetched successfully✅✅', channelProfile?.[0] || {});

},
    { statusCode: 500, message: "Unable to fetch channel profile :" })


// add videoId to watch history...    // works ✅✅
export const addVideoToWatchHistory = asyncHandler(async (req, res) => {
    // console.log("reveived req.params: ", req.params);

    const { videoId } = req.params;

    //@ts-ignore
    if (((String)(new mongoose.ObjectId(videoId)) !== videoId) || !mongoose.isValidObjectId(videoId)) {
        return sendError(res, 400, "Invalid videoId");
    }

    const user = await userModel
        .findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: {
                    // @ts-ignore
                    watchHistory: new mongoose.ObjectId(videoId)
                }
            },
            {
                new: true
            }
        ).select('-password -refreshToken')

    return sendAPIResp(res, 200, "Video added to watchHistory.", user);

},
    { statusCode: 500, message: "Unable to add video to watchHistory :" })


// works ✅✅
export const userWatchHistory = asyncHandler(async (req, res) => {
    console.log("fetching watchHistory for : ", req.user, "..... ");

    const user = await userModel.aggregate(
        [
            {
                $match: {
                    // @ts-ignore
                    _id: req.user._id  // in req.user._id  id is already stored as ObjectId
                }
            },
            {
                $addFields: {
                    watchHistory: { $ifNull: ["$watchHistory", []] }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistoryObjects",
                    // we will get owner feild i.e. objectId of a user-model so to get more info about that user
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "ownerObjects",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1, // can be used to go to channel by passing username in params
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        // now we will get ownerObjects as an array and client will have to use 
                        // ownerObjects[0].fullname , ownerObjects[0].avatar... so to make it easy for them...
                        {
                            $addFields: {
                                ownerObjects: {
                                    $first: "$ownerObjects"  // "$first" return first element of the specified arrayField
                                }
                            }
                        } //  ownerObjects will be added with existing feilds of video objects
                    ]
                }
            },

        ]
    )

    if (!user) return sendError(res, 404, "Watch history not found!");


    return sendAPIResp(res, 200, "watchHistory fetched successfully✅✅", user?.[0]?.watchHistoryObjects)
},
    { statusCode: 500, message: "Unable to fetch the watchHistory :" });
