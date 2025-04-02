import { Router } from "express";

import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";



export const commentRouter = Router();


commentRouter.route('/video/:video').get(getVideoComments);

commentRouter.route('/new-comment/:videoId').post(verifyJWT, upload.none(), addComment);

commentRouter.route('/comment/:commentId').patch(verifyJWT, upload.none(), updateComment);

commentRouter.route('/comment/:commentId').delete(verifyJWT, upload.none(), deleteComment);