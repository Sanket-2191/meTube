import { model, Schema } from "mongoose";


const playListSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        discription: {
            type: String,
            required: true
        },
        videos: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Video"
                }
            ]
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);


export const playListModel = model("PlayList", playListSchema)