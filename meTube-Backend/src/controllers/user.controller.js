import { userModel } from "../models/user.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ErrorHandler } from "../utils/ErrorHandlers.js";


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



export { registerUser }