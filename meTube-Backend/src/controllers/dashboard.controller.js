import { userModel } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"



const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // get userId from req.user._id  (secure route controller)

    // match userid from userModel
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

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})
