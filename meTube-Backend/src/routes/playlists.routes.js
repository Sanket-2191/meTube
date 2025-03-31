import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";


export const playListRouter = Router();

playListRouter.route('/').post(verifyJWT, upload.none(), createPlaylist);

playListRouter.route('/user/:userId').get(getUserPlaylists);

playListRouter.route('/:playlistId').get(getPlaylistById);

playListRouter.route('/:playlistId').delete(verifyJWT, deletePlaylist);

playListRouter.route('/:playlistId').patch(verifyJWT, upload.none(), updatePlaylist);

playListRouter.route('/:playlistId/:videoId').patch(verifyJWT, addVideoToPlaylist);

playListRouter.route('/:playlistId/:videoId').delete(verifyJWT, removeVideoFromPlaylist);
