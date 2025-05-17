
import mongoose from "mongoose"

import { videoModel } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { likeModel } from "../models/like.model.js"
import { commentModel } from "../models/comment.model.js"
import { sendAPIResp } from "../utils/sendApiResp.js"
import { sendError } from "../utils/sendErrorResp.js"


export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO get all videos based on query, sort, pagination
    // const searchWords = query?.trim().split(" ") || "";
    // const regexSearchQuery = query?.trim().split(" ").map(word => (`.*${word}`)).join("") || "";

    const sortTypeNum = (sortType === "asc" ? 1 : -1);


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
    const videos = [
        filterWithSearchQueryStage
        ,
        {
            $match: {
                isPublished: true
            }
        },
        //@ts-ignore
        sortStage
    ]


    const options = {
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.max(1, parseInt(limit) || 10)
    };
    const videoData = await videoModel.aggregatePaginate(videoModel.aggregate(videos), options);

    return sendAPIResp(res, 200, "Videos fetched successfully✅✅", videoData);
})

export const publishAVideo = asyncHandler(async (req, res) => {
    // TODO get video, upload to cloudinary, create video
    //for owner field..
    const owner = req.user._id;

    const { title, description } = req.body;

    if (!title) return sendError(res, 400, "Title is required for video.");
    if (!description) return sendError(res, 400, "Description is required for video.");

    // console.log("Files for video upload: ", req.files);

    const { video, thumbnail } = req.files;
    const videoPathLoc = video?.[0]?.path, thumbnailPathLoc = thumbnail?.[0]?.path;
    if (!videoPathLoc) return sendError(res, 400, "Video is required for video Uploading 😒.");

    // upload video on cloudinary...
    const videoCloudinary = await uploadOnCloudinary(videoPathLoc);
    if (!videoCloudinary) return sendError(res, 500, "unable to upload Video on cloud ");
    if (!videoCloudinary.url) return sendError(res, 500, "unable to generate url for Video on cloud ");
    const videoURL = videoCloudinary.url;
    const videoDuration = videoCloudinary.duration || 0;

    // upload video on cloudinary...
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailPathLoc);
    if (!thumbnailCloudinary) return sendError(res, 500, "unable to upload thumbnail on cloud ");
    if (!thumbnailCloudinary.url) return sendError(res, 500, "unable to generate url for thumbnail on cloud ");
    const thumbnailURL = thumbnailCloudinary.url;

    const newVideo = await videoModel.create({
        owner,
        videoFile: videoURL,
        thumbnail: thumbnailURL,
        title,
        description,
        duration: videoDuration
    });
    if (!newVideo) return sendError(res, 500, "new video creation unsuccessful");

    return sendAPIResp(
        res,
        201,
        "Video uploaded successfully✅✅",
        newVideo
    )

},
    { statusCode: 500, message: "something went wrong while video upload" })

export const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    console.log("have videoId? ", videoId);

    //TODO get video by id
    if (!mongoose.isValidObjectId(videoId)) return sendError(res, 400, "need videoId to search requested video");

    const video = await videoModel.findById(videoId);

    if (!video) return sendError(res, 404, "No Video found with requested _id")

    return sendAPIResp(
        res,
        200,
        "Video fetched successfully✅✅",
        video
    )
},
    { statusCode: 500, message: "something went wrong while fetching the requested video" })

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO update video details like title, description

    const { title, description } = req.body;

    const video = await videoModel.findById(videoId);

    // make sure that the loggedIn user is the owner of the video being updated...
    if (!(video.owner.equals(req.user._id))) return sendError(res, 402, "Cannot update videos of other users.")

    video.title = title || video.title; // Update only if a new value is provided
    video.description = description || video.description;

    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updateVideo) return sendError(res, 500, "Failed to save update in video.");

    return sendAPIResp(
        res,
        200,
        "Video Updated successfully✅✅",
        updatedVideo
    )

},
    { statusCode: 500, message: "something went wrong while updating the requested video" })

export const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await videoModel.findById(videoId);

    // make sure that the loggedIn user is the owner of the video being updated...
    if (!(video.owner.equals(req.user._id))) return sendError(res, 402, "Cannot update videos of other users. updating thumbnail..")

    const { thumbnailLocalPath } = req.file?.path || "";
    if (!thumbnailLocalPath) return sendError(res, 500, "Unable to create file locally while thumbnail update!");

    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailCloudinary) return sendError(res, 500, "Thumbnail upload on cloud failed while update.");

    const thumbnailURL = thumbnailCloudinary.url;
    if (!thumbnailURL) return sendError(res, 500, "URL creation for thumbnail failed while update.");


    video.thumbnail = thumbnailURL;
    const updatedVideo = await video.save({ validateBeforeSave: false });

    if (!updatedVideo) return sendError(res, 500, "Failed to save thumbnail update in video.");

    return sendAPIResp(
        res,
        200,
        "Video-thumbnail Updated successfully✅✅",
        updatedVideo
    )

},
    { statusCode: 500, message: "something went wrong while updating the thumbnail of the requested video" })

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await videoModel.findById(videoId);
    // Check if the video exists
    if (!video) return res.status(404).json({ message: "Video not found" });
    // make sure that the loggedIn user is the owner of the video being deleted...
    if (!(video.owner.equals(req.user._id))) return sendError(res, 402, "Cannot delete videos of other users. deleting video..")

    const deletedVideo = await video.deleteOne();
    // console.log("deleted video: ", deletedVideo);

    // To ensure properly fetching liked videos we must deleted liked-docs with deleted videoId
    const deletedLikes = await likeModel.deleteMany({
        video: videoId
    });
    const deleteComments = await commentModel.deleteMany({ video: videoId })

    // console.log(`Deleted ${deletedLikes.deletedCount} likes and ${deleteComments.deletedCount} comments for deleted video..`);

    return sendAPIResp(
        res,
        200,
        `Video deleted successfully✅✅. Deleted ${deletedLikes.deletedCount} likes and ${deleteComments.deletedCount} comments`,
        deletedVideo
    )

},
    { statusCode: 500, message: "something went wrong while deleting the requested video" })

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await videoModel.findById(videoId);

    // make sure that the loggedIn user is the owner of the video being updated...
    if (!(video.owner.equals(req.user._id)))
        return sendError(res, 402, "Cannot change publish status of videos of other users. updating publish status..")

    video.isPublished = !video.isPublished;
    const updatedVideo = await video.save({ validateBeforeSave: false });
    if (!updatedVideo) return sendError(res, 500, "Failed to save change in publish status of the video.");;

    return sendAPIResp(
        res,
        200,
        "Video publish status changed successfully✅✅",
        updatedVideo
    )

},
    { statusCode: 500, message: "something went wrong while updating publish status of the requested video" })
