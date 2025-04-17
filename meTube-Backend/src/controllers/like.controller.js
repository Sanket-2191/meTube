import { isValidObjectId } from "mongoose"


import { asyncHandler } from "../utils/asyncHandler.js"
import { ErrorHandler } from "../utils/ErrorHandlers.js"
import { likeModel } from "../models/like.model.js"
import { APIresponse } from "../utils/APIresponse.js"
import { videoModel } from "../models/video.model.js"
import { commentModel } from "../models/comment.model.js"
import { tweetModel } from "../models/tweet.model.js"

const toggleLike = async ({
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
    if (!created) throw new ErrorHandler(500, `Unable to save the like for ${modelKey}.`);

    if (parentModel)
        await parentModel.findByIdAndUpdate(parentId, {
            $inc: { likes: 1 },
        });

    return { status: "liked", data: created };
};


export const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ErrorHandler(400, "Invalid videoId received.");

    const result = await toggleLike({
        modelKey: "video",
        parentModel: videoModel,
        parentId: videoId,
        userId: req.user._id,
    });

    return res.status(result.status === "liked" ? 201 : 200).json(
        new APIresponse(
            200,
            result.data,
            result.status === "liked" ? "Video liked✅✅" : "Unliked the video !!"
        )
    );
},
    { statusCode: 500, message: "Something went wrong while liking/unliking the Video." });

export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) throw new ErrorHandler(400, "Invalid commentId received.");

    const result = await toggleLike({
        modelKey: "comment",
        parentModel: commentModel,
        parentId: commentId,
        userId: req.user._id,
    });

    return res.status(result.status === "liked" ? 201 : 200).json(
        new APIresponse(
            200,
            result.data,
            result.status === "liked" ? "Comment liked✅✅" : "Unliked the comment !!"
        )
    );
},
    { statusCode: 500, message: "Something went wrong while liking/unliking the Comment." });

export const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ErrorHandler(400, "Invalid tweetId received.");

    const result = await toggleLike({
        modelKey: "tweet",
        parentModel: tweetModel,
        parentId: tweetId,
        userId: req.user._id,
    });

    return res.status(result.status === "liked" ? 201 : 200).json(
        new APIresponse(
            200,
            result.data,
            result.status === "liked" ? "Tweet liked✅✅" : "Unliked the tweet !!"
        )
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

    return res.status(200).json(
        new APIresponse(
            200,
            likedVideos,
            likedVideos.length ? "Liked videos fetched successfully✅✅" : "No liked videos found."
        )
    );
},
    { statusCode: 500, message: "Something went wrong while fetching liked-Videos." });

// export const toggleVideoLike = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO toggle like on video
//     if (!isValidObjectId(videoId)) throw new ErrorHandler(400, "Invalid videoId received for liking.");

//     const likeFind = await likeModel.findOne({
//         $and: [
//             { video: videoId }, { likedBy: req.user._id }
//         ]
//     });

//     if (likeFind) {
//         const deleted = await likeFind.deleteOne();

//         await videoModel.findByIdAndUpdate(
//             videoId,
//             {
//                 $inc: { likes: -1 }

//             }
//         )
//         return res.status(200)
//             .json(
//                 new APIresponse(
//                     200,
//                     deleted,
//                     "Unliked the video !!"
//                 )
//             )
//     };

//     const like = await likeModel.create({
//         video: videoId,
//         likedBy: req.user._id
//     })
//     await videoModel.findByIdAndUpdate(
//         videoId,
//         {
//             $inc: { likes: 1 }

//         }
//     )

//     if (!like) throw new ErrorHandler(500, "Unable to save the like for video .");

//     return res.status(201)
//         .json(
//             new APIresponse(
//                 200,
//                 like,
//                 "Video liked✅✅"
//             )
//         );


// },
//  );


// export const toggleCommentLike = asyncHandler(async (req, res) => {
//     const { commentId } = req.params
//     //TODO: toggle like on comment
//     if (!isValidObjectId(commentId)) throw new ErrorHandler(400, "Invalid commentId received for liking.");
//     const likeFind = await likeModel.findOne({
//         $and: [
//             { comment: commentId }, { likedBy: req.user._id }
//         ]
//     });

//     if (likeFind) {
//         const deleted = await likeFind.deleteOne();
//         return res.status(200)
//             .json(
//                 new APIresponse(
//                     200,
//                     deleted,
//                     "Unliked the comment !!"
//                 )
//             )
//     };

//     const like = await likeModel.create({
//         comment: commentId,
//         likedBy: req.user._id
//     })

//     if (!like) throw new ErrorHandler(500, "Unable to save the like for comment .");

//     return res.status(201)
//         .json(
//             new APIresponse(
//                 200,
//                 like,
//                 "Comment liked✅✅"
//             )
//         );

// },
//     )

// export const toggleTweetLike = asyncHandler(async (req, res) => {
//     const { tweetId } = req.params
//     //TODO: toggle like on tweet
//     if (!isValidObjectId(tweetId)) throw new ErrorHandler(400, "Invalid tweetId received for liking.");

//     const likeFind = await likeModel.findOne({
//         $and: [
//             { tweet: tweetId }, { likedBy: req.user._id }
//         ]
//     });

//     if (likeFind) {
//         const deleted = await likeFind.deleteOne();
//         return res.status(200)
//             .json(
//                 new APIresponse(
//                     200,
//                     deleted,
//                     "Unliked the tweet !!"
//                 )
//             )
//     };

//     const like = await likeModel.create({
//         tweet: tweetId,
//         likedBy: req.user._id
//     })

//     if (!like) throw new ErrorHandler(500, "Unable to save the like for tweet .");

//     return res.status(201)
//         .json(
//             new APIresponse(
//                 200,
//                 like,
//                 "Tweet liked✅✅"
//             )
//         );

// },
// )



// export const getLikedVideos = asyncHandler(async (req, res) => {
//     //TODO get all liked videos
//     const userId = req.user._id;

//     const likedVideos = await likeModel.aggregate([
//         {
//             $match: {
//                 $and: [
//                     { likedBy: userId },
//                     { video: { $exists: true } }
//                 ]
//             }
//         },
//         {
//             $lookup: {
//                 from: 'videos',
//                 localField: 'video',
//                 foreignField: '_id',
//                 as: 'VideoDetails',
//                 pipeline: [
//                     {
//                         $match: { isPublished: true }
//                     },
//                     {
//                         $lookup: {
//                             from: "users",
//                             localField: "owner",
//                             foreignField: "_id",
//                             as: "ownerDetails"
//                         }
//                     },
//                     {
//                         $addFields: {
//                             ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] }
//                         }
//                     },
//                     {
//                         $project: {
//                             videoFile: 1,
//                             thumbnail: 1,
//                             title: 1,
//                             description: 1,
//                             views: 1,
//                             ownerDetails: {
//                                 _id: 1,
//                                 avatar: 1,
//                                 fullName: 1
//                             }
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $addFields: {
//                 videoDetails: { $ifNull: [{ $arrayElemAt: ["$VideoDetails", 0] }, {}] }
//             }
//         }, {
//             $project: {
//                 likedBy: 1,
//                 videoDetails: 1
//             }
//         }
//     ])

//     return res.status(200)
//         .json(
//             new APIresponse(
//                 200,
//                 likedVideos,
//                 likedVideos.length ? "Liked videos fetched successfully✅✅" : "No liked videos found."
//             )
//         )

// },
//    )
