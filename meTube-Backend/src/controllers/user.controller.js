import jwt from "jsonwebtoken";

import { userModel } from "../models/user.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ErrorHandler } from "../utils/ErrorHandlers.js";


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

const registerUser = asyncHandler(async (req, res) => {
    // get user detail from frontend
    const { fullname, email, username, password } = req.body;
    console.log("email: ", email);

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
})

const loginUser = asyncHandler(async (req, res) => {
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
})

export const logoutUser = asyncHandler(async (req, res) => {
    // get userId from req.user set in auth midware
    try {
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
    } catch (error) {
        throw new ErrorHandler(500, "Unable to logout")
    }

})

export const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refreshToken from req object...
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    // check if token is present
    if (!incomingRefreshToken) throw new ErrorHandler(401, "Unauthorized Access!");

    try {
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
    } catch (error) {
        throw new ErrorHandler(500, "Unable to get access tokens please login again");
    }

})



export { registerUser, loginUser }