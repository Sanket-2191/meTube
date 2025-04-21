import { isValidObjectId } from "mongoose";


import { tweetModel } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { sendError } from "../utils/sendErrorResp.js";
import { sendAPIResp } from "../utils/sendApiResp.js";



export const createTweet = asyncHandler(async (req, res) => {
    //TODO create tweet
    const { tweetContent } = req.body;

    if (!tweetContent) return sendError(res, 400, "Tweet cannot be empty.");

    const tweet = await tweetModel.create({
        content: tweetContent,
        owner: req.user._id
    })

    if (!tweet) return sendError(res, 500, "Uable to save new tweet");

    return sendAPIResp(
        res,
        200,
        "Tweet created successfully✅✅",
        tweet

    )
},
    { statusCode: 500, message: "Something went wrong while creating new tweet." });

export const getUserTweets = asyncHandler(async (req, res) => {
    // TODO get user tweets
    const userTweets = await tweetModel.find({ owner: req.user._id });

    return sendAPIResp(
        res,
        200,
        userTweets.length ? "User tweets fetched successfully✅✅" : "No tweets found ",
        userTweets
    )
},
    { statusCode: 500, message: "Something went wrong while fetching user tweets." });

export const updateTweet = asyncHandler(async (req, res) => {
    //TODO update tweet
    const { tweetUpdateContent } = req.body;
    const { tweetId } = req.params;

    if (!tweetUpdateContent) return sendError(res, 400, "updating tweet...Tweet cannot be empty.");
    if (!isValidObjectId(tweetId)) return sendError(res, 400, "updating tweet...TweetId is not vaild mongoose-objectId")
    const tweet = await tweetModel.findById(tweetId);

    if (!(tweet.owner.equals(req.user._id))) return sendError(res, 402, "Cannot edit other user's tweet.")

    if (tweet.content === tweetUpdateContent) {
        return sendAPIResp(
            res,
            200,
            "No update as new tweet is same as previous.",
            tweet
        )
    }

    tweet.content = tweetUpdateContent;

    const updatedTweet = await tweet.save();

    return sendAPIResp(
        res,
        200,
        "Tweet updated successfully✅✅.",
        updatedTweet
    )
},
    { statusCode: 500, message: "Something went wrong while updating user tweet." });

export const deleteTweet = asyncHandler(async (req, res) => {
    //TODO delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) return sendError(res, 400, "updating tweet...TweetId is not vaild mongoose-objectId")

    const tweet = await tweetModel.findById(tweetId);

    if (!(tweet.owner.equals(req.user._id))) return sendError(res, 402, "Cannot delete other user's tweet.")

    const tweetDeleted = await tweet.deleteOne();

    return sendAPIResp(
        res,
        200,
        tweetDeleted,
        "Deleted the requested tweet"

    )

},
    { statusCode: 500, message: "Something went wrong while Deleting user tweet." });