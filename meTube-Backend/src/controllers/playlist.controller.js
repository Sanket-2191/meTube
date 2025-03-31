import mongoose, { isValidObjectId } from "mongoose";
import { playListModel } from "../models/playlist.model.js"
import { APIresponse } from "../utils/APIresponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ErrorHandler } from "../utils/ErrorHandlers.js"


export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name) throw new ErrorHandler(400, "PlayList must have a name.")

    //TODO create playlist
    const playList = await playListModel.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playList) throw new ErrorHandler(500, "Uable to save new playlist.");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                playList,
                "PlayList created successfully✅✅"
            )
        )

},
    { statusCode: 500, message: "Something went wrong while creating new playList." });

export const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO get user playlists
    if (!userId || !isValidObjectId(userId)) throw new ErrorHandler(400, "A valid userId is required to get their playlist.");

    const userPlayLists = await playListModel.aggregate([
        { $match: { owner: req.user._id } },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $match: { isPublished: true }
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
                    },
                    {
                        $addFields: {
                            ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] }
                        }
                    },
                    {
                        $project: {
                            ownerDetails: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                videoDetails: 1,
                videos: 0,
                owner: 1
            }
        }
    ])

    return res.status(200)
        .json(
            new APIresponse(
                200,
                userPlayLists,
                userPlayLists.length ? "Fetched playlists for user.👍✅" : "No playlist found for the user."
            )
        )
},
    { statusCode: 500, message: "Something went wrong while fetching all playLists for the user." });

export const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO get playlist by id

    const playlist = await playListModel.aggregate([
        { $match: { _id: playlistId } },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $match: { isPublished: true }
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
                    },
                    {
                        $addFields: {
                            ownerDetails: { $arrayElemAt: ["$ownerDetails", 0] }
                        }
                    },
                    {
                        $project: {
                            ownerDetails: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                videoDetails: 1,
                videos: 0,
                owner: 1
            }
        }
    ]);

    return res.status(200)
        .json(
            new APIresponse(
                200,
                playlist,
                playlist.length ? "Fetched the requested playlist.👍✅" : "No playlist found with requested Id."
            )
        )

},
    { statusCode: 500, message: "Something went wrong while fetching the requested playlist." });

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!(isValidObjectId(playlistId) && isValidObjectId(videoId)))
        throw new ErrorHandler(400, "playlistId and VideoId must be vaild mongodb Id");

    const updatedPlaylist = await playListModel.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                $addToSet: {
                    // @ts-ignore
                    videos: new mongoose.ObjectId(videoId)
                }
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) throw new ErrorHandler(500, "Unable to add new video to playlist.");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                updatePlaylist,
                "New Video added to playlist successfully✅✅"
            )
        )
},
    { statusCode: 500, message: "Something went wrong while adding requested video to playlist." });


export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO remove video from playlist
    if (!(isValidObjectId(playlistId) && isValidObjectId(videoId)))
        throw new ErrorHandler(400, "playlistId and VideoId must be vaild mongodb Id");

    const updatedPlaylist = await playListModel.findByIdAndUpdate(
        playlistId,
        {
            $unset: {
                $pull: {
                    // @ts-ignore
                    videos: new mongoose.ObjectId(videoId)
                }
            }
        },
        {
            new: true
        }
    )

    if (!updatedPlaylist) throw new ErrorHandler(500, "Unable to delete the video to playlist.");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                updatePlaylist,
                "Video deleted from playlist successfully✅✅"
            )
        );


},
    { statusCode: 500, message: "Something went wrong while removing requested video to playlist." });


export const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO delete playlist
    if (!isValidObjectId(playlistId)) throw new ErrorHandler(400, " playlistId must be vaild mongodb Id");

    const deletedPlaylist = await playListModel.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) throw new ErrorHandler(500, "Unable to delete the playlist.");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                deletedPlaylist,
                "Deleted the playlist successfully✅✅"
            )
        );
},
    { statusCode: 500, message: "Something went wrong while deleting the playlist." });


export const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO update playlist

    if (!isValidObjectId(playlistId)) throw new ErrorHandler(400, " playlistId must be vaild mongodb Id");
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;

    const updatedPlaylist = await playListModel.findByIdAndUpdate(
        playlistId,
        {
            $set: updateFields
        },
        {
            new: true
        }
    );

    return res.status(201)
        .json(
            new APIresponse(
                200,
                updatedPlaylist,
                "updated the playlist successfully✅✅"
            )
        );

},
    { statusCode: 500, message: "Something went wrong while updating the playlist." });
