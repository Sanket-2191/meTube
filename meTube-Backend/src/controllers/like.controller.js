import { isValidObjectId } from "mongoose"


import { asyncHandler } from "../utils/asyncHandler.js"
import { ErrorHandler } from "../utils/ErrorHandlers.js"
import { likeModel } from "../models/like.model.js"
import { APIresponse } from "../utils/APIresponse.js"
import { videoModel } from "../models/video.model.js"
import { commentModel } from "../models/comment.model.js"
import { tweetModel } from "../models/tweet.model.js"
import { sendError } from "../utils/sendErrorResp.js"
import { sendAPIResp } from "../utils/sendApiResp.js"

const toggleLike = async (res, {
    modelKey,
    parentModel,
    parentId,
    userId,
}) => {
    const query = { [modelKey]: parentId, likedBy: userId };
    const existing = await likeModel.findOne(query);

    if (existing) {
        await existing.deleteOne();
        if (parentModel)
            await parentModel.findByIdAndUpdate(parentId, {
                $inc: { likes: -1 },
            });
        return { status: "unliked", data: existing };
    }

    const created = await likeModel.create({ [modelKey]: parentId, likedBy: userId });
    if (!created) return sendError(res, 500, `Unable to save the like for ${modelKey}.`);

    if (parentModel)
        await parentModel.findByIdAndUpdate(parentId, {
            $inc: { likes: 1 },
        });

    return { status: "liked", data: created };
};


export const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) return sendError(res, 400, "Invalid videoId received.");

    const result = await toggleLike(res, {
        modelKey: "video",
        parentModel: videoModel,
        parentId: videoId,
        userId: req.user._id,
    });

    return sendAPIResp(
        res,
        result.status === "liked" ? 201 : 200,
        result.status === "liked" ? "Video liked✅✅" : "Unliked the video !!",
        result.data
    );
},
    { statusCode: 500, message: "Something went wrong while liking/unliking the Video." });

export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) return sendError(res, 400, "Invalid commentId received.");

    const result = await toggleLike(res, {
        modelKey: "comment",
        parentModel: commentModel,
        parentId: commentId,
        userId: req.user._id,
    });

    return sendAPIResp(
        res,
        result.status === "liked" ? 201 : 200,
        result.status === "liked" ? "Comment liked✅✅" : "Unliked the comment !!",
        result.data,
    );
},
    { statusCode: 500, message: "Something went wrong while liking/unliking the Comment." });

export const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) return sendError(res, 400, "Invalid tweetId received.");

    const result = await toggleLike(res, {
        modelKey: "tweet",
        parentModel: tweetModel,
        parentId: tweetId,
        userId: req.user._id,
    });

    return sendAPIResp(
        res,
        result.status === "liked" ? 201 : 200,
        result.status === "liked" ? "Tweet liked✅✅" : "Unliked the tweet !!",
        result.data
    );
},
    { statusCode: 500, message: "Something went wrong while liking/unliking the Tweet." });

export const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await likeModel.aggregate([
        {
            $match: {
                likedBy: userId,
                video: { $exists: true },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "VideoDetails",
                pipeline: [
                    { $match: { isPublished: true } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $addFields: {
                            ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] },
                        },
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            ownerDetails: {
                                _id: 1,
                                avatar: 1,
                                fullName: 1,
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                videoDetails: { $ifNull: [{ $arrayElemAt: ["$VideoDetails", 0] }, {}] },
            },
        },
        {
            $project: {
                likedBy: 1,
                videoDetails: 1,
            },
        },
    ]);

    return sendAPIResp(
        res,
        200,
        likedVideos.length ? "Liked videos fetched successfully✅✅" : "No liked videos found.",
        likedVideos
    );
},
    { statusCode: 500, message: "Something went wrong while fetching liked-Videos." });

