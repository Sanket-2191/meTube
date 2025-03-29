
import mongoose from "mongoose"
import { videoModel } from "../models/video.model.js"
import { APIresponse } from "../utils/APIresponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ErrorHandler } from "../utils/ErrorHandlers.js"
import { likeModel } from "../models/like.model.js"


export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO get all videos based on query, sort, pagination
    const searchWords = query?.trim().split(" ") || "";
    const regexSearchQuery = query?.trim().split(" ").map(word => (`.*${word}`)).join("") || "";

    const sortTypeNum = (sortType === "asc" ? 1 : -1);

    // const noOfVideosToSkip = (page ? page : 1) * limit

    // if query is fullname ... then....
    // what can we do with userId? 

    // populating video object with owner details
    // const ownerPopulateStage = {
    //     $lookup: {
    //         from: "users",
    //         localField: "owner",
    //         foreignField: "_id",
    //         as: "videoOwner"
    //         //, pipeline: [
    //         //     {
    //         //         $match: {
    //         //             $or: [
    //         //                 {
    //         //                     fullName: {
    //         //                         $regex: `${query.trim()}`,
    //         //                         $options: "i"
    //         //                     },
    //         //                 },
    //         //                 {
    //         //                     fullName: {
    //         //                         $regex: regexSearchQuery,
    //         //                         $options: "i"
    //         //                     }
    //         //                 },

    //         //             ]
    //         //         }
    //         //     }
    //         // ]
    //     }
    // }

    // const createObjOfvideoOwnerStage = {
    //     $addFields: {
    //         videoOwner: "$videoOwner.0"
    //     }
    // }

    const filterWithSearchQueryStage = query ? {
        $search: {
            index: "title-description-search",
            text: {
                query: query.trim(),
                path: ['title', 'description']
            }
        }
    } : {
        $match: {
            "_id": { $exists: true }
        }
    };

    const sortStage = (sortBy && sortType) ?
        {
            $sort: {
                [sortBy]: sortTypeNum
            }
        } :
        {
            $sort: {
                "cratedAt": 1
            }
        };

    //@ts-ignore
    const videos = videoModel.aggregate(
        [
            filterWithSearchQueryStage
            ,
            {
                $match: {
                    isPublished: true
                }
            },
            //@ts-ignore
            sortStage,
        ]
    )

    const options = { page: parseInt(page), limit: parseInt(limit) }

    const videoData = await videoModel.aggregatePaginate(videos, options);

    return res.status(200)
        .json(
            new APIresponse(
                200,
                videoData,
                "Videos fetched successfully✅✅"
            )
        )
})
// const videos = await videoModel.find(
//     {
//         $and: [
//             {
//                 $or: query ? [
//                     {
//                         // searching query words in title....
//                         title: {
//                             $regex: `${query.trim()}`,
//                             $options: "i"
//                         }
//                     },
//                     {
//                         // searching query words in description....
//                         $or: [
//                             {
//                                 description: {
//                                     $regex: `${query.trim()}`,
//                                     $options: "i"
//                                 }
//                             },
//                             {
//                                 description: {
//                                     $regex: regexSearchQuery,
//                                     $options: "i"
//                                 }
//                             }
//                         ]
//                     },
//                     {}
//                 ] : [{}]  // return all videos if searchquery is empty..
//             },
//             {
//                 isPublished: true
//             }
//         ]
//     }
// )
//     .sort({ [sortBy]: sortTypeNum })
//     .skip(noOfVideosToSkip)
//     .limit(limit)


export const publishAVideo = asyncHandler(async (req, res) => {
    // TODO get video, upload to cloudinary, create video
    //for owner field..
    const owner = req.user._id;

    const { title, description } = req.body;

    if (!title) throw new ErrorHandler(400, "Title is required for video.");
    if (!description) throw new ErrorHandler(400, "Description is required for video.");

    const { videolocalPath, thumbnailLocalPath } = req.files;
    if (!videolocalPath) throw new ErrorHandler(400, "Video is required for video Uploading 😒.");

    // upload video on cloudinary...
    const videoCloudinary = await uploadOnCloudinary(videolocalPath);
    if (!videoCloudinary) throw new ErrorHandler(500, "unable to upload Video on cloud ");
    if (!videoCloudinary.url) throw new ErrorHandler(500, "unable to generate url for Video on cloud ");
    const videoURL = videoCloudinary.url;
    const videoDuration = videoCloudinary.duration || 0;

    // upload video on cloudinary...
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailCloudinary) throw new ErrorHandler(500, "unable to upload thumbnail on cloud ");
    if (!thumbnailCloudinary.url) throw new ErrorHandler(500, "unable to generate url for thumbnail on cloud ");
    const thumbnailURL = thumbnailCloudinary.url;

    const video = await videoModel.create({
        owner,
        videoFile: videoURL,
        thumbnail: thumbnailURL,
        title,
        description,
        duration: videoDuration
    });
    if (!video) throw new ErrorHandler(500, "new video creation unsuccessful");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                video,
                "Video uploaded successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "something went wrong while video upload" })

export const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    console.log("have videoId? ", videoId);

    //TODO get video by id
    if (!mongoose.isValidObjectId(videoId)) throw new ErrorHandler(400, "need videoId to search requested video");

    const video = await videoModel.findById(videoId);

    if (!video) throw new ErrorHandler(404, "No Video found with requested _id")

    return res.status(200)
        .json(
            new APIresponse(
                200,
                video,
                "Video fetched successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "something went wrong while fetching the requested video" })

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description

    const { title, description } = req.body;

    const video = await videoModel.findById(videoId);

    // make sure that the loggedIn user is the owner of the video being updated...
    if (!(video.owner.equals(req.user._id))) throw new ErrorHandler(402, "Cannot update videos of other users.")

    video.title = title || video.title; // Update only if a new value is provided
    video.description = description || video.description;

    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updateVideo) throw new ErrorHandler(500, "Failed to save update in video.");

    return res.status(200)
        .json(
            new APIresponse(
                200,
                updatedVideo,
                "Video Updated successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "something went wrong while updating the requested video" })

export const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await videoModel.findById(videoId);

    // make sure that the loggedIn user is the owner of the video being updated...
    if (!(video.owner.equals(req.user._id))) throw new ErrorHandler(402, "Cannot update videos of other users. updating thumbnail..")

    const { thumbnailLocalPath } = req.file?.path || "";
    if (!thumbnailLocalPath) throw new ErrorHandler(500,
        "Unable to create file locally while thumbnail update!");

    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailCloudinary) throw new ErrorHandler(500, "Video upload on cloud failed while update.");
    const thumbnailURL = thumbnailCloudinary.url;
    if (!thumbnailURL) throw new ErrorHandler(500, "URL creation for thumbnail failed while update.");


    video.thumbnail = thumbnailURL;
    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updatedVideo) throw new ErrorHandler(500, "Failed to save thumbnail update in video.");

    return res.status(200)
        .json(
            new APIresponse(
                200,
                updatedVideo,
                "Video-thumbnail Updated successfully✅✅"
            )
        )

},
    { statusCode: 500, message: "something went wrong while updating the thumbnail of the requested video" })

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await videoModel.findById(videoId);
    // Check if the video exists
    if (!video) return res.status(404).json({ message: "Video not found" });
    // make sure that the loggedIn user is the owner of the video being deleted...
    if (!(video.owner.equals(req.user._id))) throw new ErrorHandler(402, "Cannot delete videos of other users. deleting video..")

    const deletedVideo = await video.deleteOne();
    console.log("deleted video: ", deletedVideo);

    // To ensure properly fetching liked videos we must deleted liked-docs with deleted videoId
    const deletedLikes = await likeModel.deleteMany({
        video: videoId
    });

    console.log(`Deleted ${deletedLikes.deletedCount} likes for deleted video..`);


    return res.status(200)
        .json(
            new APIresponse(
                200,
                {},
                "Video deleted successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "something went wrong while deleting the requested video" })

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await videoModel.findById(videoId);

    // make sure that the loggedIn user is the owner of the video being updated...
    if (!(video.owner.equals(req.user._id)))
        throw new ErrorHandler(402, "Cannot change publish status of videos of other users. updating publish status..")

    video.isPublished = !video.isPublished;
    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updatedVideo) throw new ErrorHandler(500, "Failed to save change in publish status of the video.");;

    return res.status(200)
        .json(
            new APIresponse(
                200,
                updatedVideo,
                "Video publish status changed successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "something went wrong while updating publish status of the requested video" })
