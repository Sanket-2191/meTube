import { isValidObjectId } from "mongoose";
import { tweetModel } from "../models/tweet.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ErrorHandler } from "../utils/ErrorHandlers.js";



export const createTweet = asyncHandler(async (req, res) => {
    //TODO create tweet
    const { tweetContent } = req.body;

    if (!tweetContent) throw new ErrorHandler(400, "Tweet cannot be empty.");

    const tweet = await tweetModel.create({
        content: tweetContent,
        owner: req.user._id
    })

    if (!tweet) throw new ErrorHandler(500, "Uable to save new tweet");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                tweet,
                "Tweet created successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "Something went wrong while creating new tweet." });

export const getUserTweets = asyncHandler(async (req, res) => {
    // TODO get user tweets
    const userTweets = await tweetModel.find({ owner: req.user._id });

    return res.status(200)
        .json(
            new APIresponse(
                200,
                userTweets,
                userTweets.length ? "User tweets fetched successfully✅✅" : "No tweets found "
            )
        )
},
    { statusCode: 500, message: "Something went wrong while fetching user tweets." });

export const updateTweet = asyncHandler(async (req, res) => {
    //TODO update tweet
    const { tweetUpdateContent } = req.body;
    const { tweetId } = req.params;

    if (!tweetUpdateContent) throw new ErrorHandler(400, "updating tweet...Tweet cannot be empty.");
    if (!isValidObjectId(tweetId)) throw new ErrorHandler(400, "updating tweet...TweetId is not vaild mongoose-objectId")
    const tweet = await tweetModel.findById(tweetId);

    if (!(tweet.owner.equals(req.user._id))) throw new ErrorHandler(402, "Cannot edit other user's tweet.")

    if (tweet.content === tweetUpdateContent) {
        return res.status(200)
            .json(
                200,
                tweet,
                "No update as new tweet is same as previous."
            )
    }

    tweet.content = tweetUpdateContent;

    const updatedTweet = await tweet.save();

    return res.status(200)
        .json(
            200,
            updatedTweet,
            "Tweet updated successfully✅✅."
        )
},
    { statusCode: 500, message: "Something went wrong while updating user tweet." });

export const deleteTweet = asyncHandler(async (req, res) => {
    //TODO delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) throw new ErrorHandler(400, "updating tweet...TweetId is not vaild mongoose-objectId")
    const tweet = await tweetModel.findById(tweetId);

    if (!(tweet.owner.equals(req.user._id))) throw new ErrorHandler(402, "Cannot delete other user's tweet.")

    const tweetDeleted = await tweet.deleteOne();

    return res.status(200)
        .json(
            new APIresponse(
                200,
                tweetDeleted,
                "Deleted the requested tweet"
            )
        )

},
    { statusCode: 500, message: "Something went wrong while Deleting user tweet." });