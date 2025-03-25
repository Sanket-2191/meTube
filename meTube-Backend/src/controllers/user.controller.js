import jwt from "jsonwebtoken";

import { userModel } from "../models/user.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ErrorHandler } from "../utils/ErrorHandlers.js";
import { videoModel } from "../models/video.model.js";
import { deleteAssestFromCloudinary } from "../utils/deleteCloudinaryAsset.js";
import mongoose from "mongoose";


const generate_Access_And_Refresh_Token = async (userID) => {

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
        throw new ErrorHandler(500, "Error while generating Access token")
    }

}

export const registerUser = asyncHandler(async (req, res) => {
    // get user detail from frontend
    const { fullname, email, username, password } = req.body;
    console.log("req.body structure: ", req.body);

    // validations -> fields are not empty, email is in valid form, password matches strength requirements
    if (!email) throw new ErrorHandler(400, "Email is required!!");
    if (!fullname) throw new ErrorHandler(400, "Fullname is required!!");
    if (!username) throw new ErrorHandler(400, "Username is required!!");
    if (!password) throw new ErrorHandler(400, "Password is required!!");

    // check if user exists
    const userExisits = await userModel.findOne({
        $or: [{ email }, { username }]
    })
    userExisits ? console.log(userExisits) : ""

    if (userExisits) throw new ErrorHandler(409, "User already exists with username :" + username);

    // check for images, check for avatar , cover image is OPTIONAL
    // console.log("Files received:?", req.files || "files not received");
    // console.log("coverImage :", (!req.files?.coverimage ? "false" : "true"));

    const avatarFilePath = req.files?.avatar[0]?.path;
    if (!avatarFilePath) throw new ErrorHandler(409, "Avatar file is required");
    const coverImageFilePath = req.files?.coverimage?.[0]?.path;

    // upload them to cloudinary
    const avatarURL = await uploadOnCloudinary(avatarFilePath);
    let coverImageURL = null;
    if (coverImageFilePath) coverImageURL = await uploadOnCloudinary(coverImageFilePath);
    if (!avatarURL) throw new ErrorHandler(500, "Avatar creation failed :" + { avatarURL: avatarURL.url });
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
    if (!createdUser) throw new ErrorHandler(500, "New User creation failed");
    // return response.

    res.status(201).json(
        new APIresponse(200, createdUser, "User creation successful✅✅")
    )
},
    { statusCode: 500, message: "Something went wrong while registration of the user" })

export const loginUser = asyncHandler(async (req, res) => {
    // data from req.body
    const { email, password, username } = req.body;
    // check credentials for login
    console.log("login req.body: ", req.body);

    if (!username && !email) throw new ErrorHandler(400, "Username or email needed!");

    // find the user
    const user = await userModel.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) throw new ErrorHandler(400, "Cannot find user, please complete registration!");
    // check password
    const isPasswordValid = await user.isPasswordCorrect(password || "");
    if (!isPasswordValid) throw new ErrorHandler(400, "Invalid password entered!");
    // generate access and refresh tokens..
    const { accessToken, refreshToken } = await generate_Access_And_Refresh_Token(user._id)
    // send tokens with cookie
    const loggedInUser = await userModel.findById(user._id).select("-password -refreshToken");

    const cookieOptions = {
        httpOnly: true,
        sercure: true
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
    { statusCode: 500, message: "Something went wrong while logging-in" })

export const logoutUser = asyncHandler(async (req, res) => {
    // get userId from req.user set in auth midware
    const user = await userModel.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
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

    // user.refreshToken = null;

    // user.save({ validateBeforeSave: false }); // not a good way

    // req.cookies = {}; // not a good way
},
    { statusCode: 500, message: "Something went wrong while logging-out" })

export const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refreshToken from req object...
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    // check if token is present
    if (!incomingRefreshToken) throw new ErrorHandler(401, "Unauthorized Access! please login again");

    // decode the data contained with token..
    const tokenPayload = jwt.verify(  // this give _id of user.
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    // @ts-ignore
    // use token data to get the required user.
    const user = await userModel.findById(tokenPayload._id);

    // check if refreshtoken had an id error if refreshToken is expired, (we wont user as no Id)
    if (!user) throw new ErrorHandler(401, "Invalid refreshToken!");

    // check if expired refresh token is being used....
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ErrorHandler(401, "refreshToken is Expired please login again!");
    }

    // gererate new set of tokens, below method will update refreshtoken in DB.
    const { newAccessToken, newRefreshToken } = await generate_Access_And_Refresh_Token(user._id)
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
                "User LoggedIn again"
            )
        )
},
    { statusCode: 500, message: "Unable to get access tokens please login again" })

export const changeUserPassword = asyncHandler(async (req, res) => {
    //get old password and newPassword.
    const { oldPassword, newPassword } = req.body;
    // get user._id from req.user and get user from DB
    /*
        we know req obj will have user because, we are using authMidware in changePassword route
    */
    const user = await userModel.findById(req.user?._id);
    // check for old password 
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ErrorHandler(400, "Old password is incorrect!");

    // set new password, bcrypt in usermodel will handle hashing of password.
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res.status(201).json(
        new APIresponse(
            200,
            {},
            "Password changed successfully✅✅"
        )
    )
},
    { statusCode: 500, message: "Password change failed :" })

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(
            new APIresponse(
                200,
                req.user,
                "Current user fetched successfully✅✅"
            )
        )
})

// BUG-FIXED: Make sure the feidnames match in code and in form-data
export const updateCurrentUserDetail = asyncHandler(async (req, res) => {
    console.log("userDetails received in body...", req.body);

    const { fullName, email } = req.body;

    console.log("1. find the user with req.user._id=", req.user._id);

    if (!(fullName && email)) throw new ErrorHandler(400, "All feilds are required");


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
    if (!updatedUser) throw new ErrorHandler(400, "User not found")


    return res.status(200)
        .json(
            new APIresponse(
                200,
                updatedUser,
                "User updated successfully✅✅"
            )
        )

},
    { statusCode: 500, message: "Email and fullName update failed :" })

// BUG-FIXED: while uploading single file multer send req.file not req.files so => req.file.path directly
export const updateUserAvatar = asyncHandler(async (req, res) => {
    // get avatar file objects from req.file not req.files as we are only accepting for one feild.
    const avatar = req.file;
    if (!avatar) throw new ErrorHandler(400, "No file received for avatar update");

    // get localFilePath for avatar.
    const avatarLocalFilePath = avatar?.path;
    if (!avatarLocalFilePath) throw new ErrorHandler(500,
        "Unable to create file locally while avatar update!");

    // get URL for avatarFile from cloudinary...
    const cloudinaryOBJ = await uploadOnCloudinary(avatarLocalFilePath);
    const avatarURL = cloudinaryOBJ.url;
    if (!avatarURL) throw new ErrorHandler(500,
        "Unable to create cloudinary-url for avatar update!");


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
    ).select("-password -refreshToken")

    // delete old avatar from cloudinary..
    const deleted = await deleteAssestFromCloudinary(req.user.avatar)
    if (deleted.result !== "ok") {
        throw new ErrorHandler(500, `Cloudinary avatar delete failed: ${deleted.result}`);
    }

    return res.status(200)
        .json(
            new APIresponse(200,
                user,
                "Avatar update successful✅✅"
            )
        )
},
    { statusCode: 500, message: "Avatar update failed :" })

// BUG-FIXED: while uploading single file multer send req.file not req.files so => req.file.path directly
export const updateUserCoverImage = asyncHandler(async (req, res) => {

    // get coverImage file objects from req.file not req.files as we are only accepting for one feild.
    // console.log("coverImage file :", req.file);

    const coverImage = req.file;
    if (!coverImage) throw new ErrorHandler(400, "No file received for coverImage update");

    // get localFilePath for coverImage.
    const coverImageLocalFilePath = coverImage?.path;
    if (!coverImageLocalFilePath) throw new ErrorHandler(500,
        "Unable to create file locally while coverImage update!");
    // console.log("coverImage loc path done");


    // get URL for coverImageFile from cloudinary...
    const cloudinaryOBJ = await uploadOnCloudinary(coverImageLocalFilePath);
    const coverImageURL = cloudinaryOBJ.url;
    console.log("coverImage url path done :", cloudinaryOBJ);

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
    const deleted = await deleteAssestFromCloudinary(req.user.coverImage)
    if (deleted.result !== "ok") {
        throw new ErrorHandler(500, `Cloudinary coverImage delete failed: ${deleted.result}`);
    }

    return res.status(200)
        .json(
            new APIresponse(200,
                user,
                "coverImage update successful✅✅"
            )
        )


},
    { statusCode: 500, message: "coverImage update failed :" })

export const getUserChannelProfile = asyncHandler(async (req, res) => {
    // this will generally get trggered when user clicks on other channel link or profile...
    // get username from params
    const { username } = req.params;
    if (!username?.trim()) throw new ErrorHandler(400, "No username received for fetching channel profile.")

    const channelProfile = await userModel.aggregate(
        [
            {
                $match: { "username": username }
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
                            if: { $in: [req.user._id, "$allSubscribers.subscriber"] },
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

    if (!channelProfile?.length) throw new ErrorHandler(404, "channel not found");

    return res.status(200)
        .json(
            new APIresponse(
                200,
                channelProfile[0],
                'Channel profile fetched successfully✅✅'
            )
        )

},
    { statusCode: 500, message: "Unable to fetch channel profile :" })

// add videoId to watch history...
export const addVideoToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const user = await userModel
        .findByIdAndUpdate(
            req.user._id,
            {
                $push: {
                    watchHistory: videoId
                }

            },
            {
                new: true
            }
        ).select('-password -refreshToken')

    return res.status(200)
        .json(
            new APIresponse(
                200,
                user,
                "Video added to watchHistory."
            )
        )

},
    { statusCode: 500, message: "Unable to add video to watchHistory :" })

export const userWatchHistory = asyncHandler(async (req, res) => {

    const user = await userModel.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Schema.Types.ObjectId(req.user._id)
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
            /*
                {
                    $project: {
                        videoFile: 1,
                        thumbnail: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        views: 1,
                        isPublished: 1,
                        watchHistoryObjects: 1
                    }
                }
            */

            // wont work because on outer level the aggregation is run on user object and,
            // user dont have all these feild so we have all video feilds in the watchHistory $lookup 
            // so at end we will get a user object with added field watchHistoryObjects,
            //  which can be accessed as user[0].watchHistoryObjects

        ]
    )

    if (!user) throw new ErrorHandler(404, "Watch history not found!");

    // const watchHistory = user.watchHistory;

    return res.status(200)
        .json(
            new APIresponse(
                200,
                user?.[0]?.watchHistoryObjects
                ,
                "watchHistory fetched successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "Unable to fetch the watchHistory :" });
