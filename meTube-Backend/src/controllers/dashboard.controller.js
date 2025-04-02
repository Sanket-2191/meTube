import { userModel } from "../models/user.model.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"



export const getChannelStats = asyncHandler(async (req, res) => {
    // TODO Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // get userId from req.user._id  (secure route controller)

    // match userid from userModel

    const channelStats = await userModel.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            likes: 1,
                            views: 1,
                            title: 1,
                            description: 1,
                            isPublished: 1,
                            duration: 1,
                            _id: 1
                        }
                    }
                ]
            }
        }, {
            $addFields: {
                totalLikes: { $sum: "$videos.likes" },
                totalViews: { $sum: "$videos.views" },
                totalVideos: { $size: "$videos" }
            }
        }, {
            $lookup: {
                from: 'subscribers',
                localField: "_id",
                foreignField: 'channel',
                as: 'subscribers',
                // pipeline:[
                //     {}
                // ]
            }
        },
        {
            $addFields: {
                totalSubscriber: { $size: "$subscriber" }
            }
        },
        {
            $project: {
                videos: 1,
                totalLikes: 1,
                totalViews: 1,
                totalVideos: 1,
                totalSubscriber: 1,
                avatar: 1,
                coverImage: 1,
                username: 1,
                fullName: 1,
                email: 1,
            }
        }
    ]);

    return res.status(200)
        .json(
            new APIresponse(
                200,
                channelStats,
                channelStats ? "Fetched user's channel stats." : "No stats found for requested channel."
            )
        );

},
    { statusCode: 500, message: "Something went wrong while fetching channel stats." });

export const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO Get all the videos uploaded by the channel
    const channelVideos = await userModel.aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            likes: 1,
                            views: 1,
                            title: 1,
                            description: 1,
                            isPublished: 1,
                            duration: 1,
                            _id: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                videos: 1,
                avatar: 1,
                coverImage: 1,
                username: 1,
                fullName: 1,
                email: 1,
            }
        }
    ]);

    return res.status(200)
        .json(
            new APIresponse(
                200,
                channelVideos,
                channelVideos ? "Fetched user's channel stats." : "No stats found for requested channel."
            )
        );

},
    { statusCode: 500, message: "Something went wrong while fetching channel videos." });


/*

const user = await userModel.aggregate([
    {
        $match: {
            _id: req.user._id
        }
    },
    // total allSubscribers
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "allSubscribers"
        }
    }, // => give output with allSubcriber field 
    {
        $addFields: {
            totalSubscribers: {
                $size: "$allSubscribers"
            },
        }
    },
    // total video &  total views 
    {
        $lookup: {
            from: "videos",
            localField: "_id",
            foreignField: "owner",
            as: "allVideos",
            // total likes
            pipeline: [
                // for every video... lookup videoId in likeModel...
                {
                    $lookup: {
                        from: "likes",
                        localField: "_id",
                        foreignField: "video",
                        as: "likesOnVideo"
                    },
                }, {
                    $addFields: {
                        totalLikesOnVideo: {
                            $size: "$likesOnVideo"
                        }
                    }
                }
            ] // => single object might look like  { _id: "video1", likesOnVideo:[{_id:"like1",count:20}]}
        }
    },
    {
        $addFields: {
            totalViews: {
                $sum: "$allVideos.views"
            },
            totalVideos: {
                $size: "$allVideos"
            },
            totalLikes: {
                $sum: "$allVideos.totalLikesOnVideo"
            }
        }
    }
])
*/