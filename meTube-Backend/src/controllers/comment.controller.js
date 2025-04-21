import mongoose, { isValidObjectId } from "mongoose"

import { commentModel } from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { sendError } from "../utils/sendErrorResp.js"
import { sendAPIResp } from "../utils/sendApiResp.js"



export const getVideoComments = asyncHandler(async (req, res) => {
    //TODO get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) return sendError(res, 400, "fetching comments...videoId is not vaild mongoose-objectId");

    const commentAggregatePipeline = [
        {
            //@ts-ignore
            $match: { video: new mongoose.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullName: 1,
                            username: 1
                        }
                    }
                ]
            }
        }, {
            $addFields: {
                ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] }
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ];

    const options = {
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.max(1, parseInt(limit) || 10)
    };

    const allComments = await commentModel.aggregatePaginate(commentModel.aggregate(commentAggregatePipeline), options);

    return sendAPIResp(
        res,
        200,
        "Comments fetched successfully✅✅",
        allComments,
    )


},
    { statusCode: 500, message: "Something went wrong while fetching comments on video." });

export const addComment = asyncHandler(async (req, res) => {
    // TODO add a comment to a video
    const { commentContent } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) return sendError(res, 400, "updating comment...videoId is not vaild mongoose-objectId")


    if (!commentContent) return sendError(res, 400, "comment cannot be empty.");

    const comment = await commentModel.create({
        content: commentContent,
        owner: req.user._id,
        video: videoId
    })

    if (!comment) return sendError(res, 500, "Uable to save new comment");

    return sendAPIResp(
        res,
        201,
        "comment created successfully✅✅",
        comment
    )

},
    { statusCode: 500, message: "Something went wrong while creating new Comment." });

export const updateComment = asyncHandler(async (req, res) => {
    // TODO update a comment

    const { commentUpdateContent } = req.body;
    const { commentId } = req.params;

    if (!commentUpdateContent) return sendError(res, 400, "updating comment...comment cannot be empty.");

    if (!isValidObjectId(commentId)) return sendError(res, 400, "updating comment...commentId is not vaild mongoose-objectId")
    const comment = await commentModel.findById(commentId);

    if (!(comment.owner.equals(req.user._id))) return sendError(res, 402, "Cannot edit other user's comment.")

    if (comment.content === commentUpdateContent) {
        return sendAPIResp(
            res,
            200,
            "No update as new comment is same as previous.",
            comment,
        )
    }

    comment.content = commentUpdateContent;

    const updatedcomment = await comment.save();

    return sendAPIResp(
        res,
        200,
        "comment updated successfully✅✅.",
        updatedcomment
    )
},
    { statusCode: 500, message: "Something went wrong while updating the Comment." });

export const deleteComment = asyncHandler(async (req, res) => {
    // TODO delete a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) return sendError(res, 400, "deleting comment...commentId is not vaild mongoose-objectId")
    const comment = await commentModel.findById(commentId);

    if (!(comment.owner.equals(req.user._id))) return sendError(res, 402, "Cannot delete other user's comment.")

    const deletedComment = await comment.deleteOne();

    return sendAPIResp(
        res,
        200,
        "comment deleted successfully✅✅.",
        deletedComment,
    )

},
    { statusCode: 500, message: "Something went wrong while deleting the Comment." });
