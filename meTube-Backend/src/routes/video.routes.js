import { Router } from "express"


import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo, getAllVideos, getVideoById,
    publishAVideo, togglePublishStatus, updateVideo,
    updateVideoThumbnail
} from "../controllers/video.controller.js";


export const videoRouter = Router();

videoRouter.route('/')
    .post(verifyJWT, upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), publishAVideo)
    .get(getAllVideos);

videoRouter.route('/:videoId')
    .get(getVideoById)
    .patch(verifyJWT, upload.none(), updateVideo)
    .delete(verifyJWT, deleteVideo)

videoRouter.route('/video-thumbnail/:videoId').patch(verifyJWT, upload.single("thumbnail"), updateVideoThumbnail)

videoRouter.route('/publish-status/:videoId').patch(verifyJWT, togglePublishStatus)