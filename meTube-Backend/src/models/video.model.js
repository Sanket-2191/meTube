import { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        videoFile: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
        },
        duration: {
            type: Number,
            required: true,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

/*
      Return a paginated response that includes:

            docs: The data for the requested page.

            totalDocs: Total number of documents.

            limit: Number of documents per page.

            page: Current page number.

            totalPages: Total number of pages.

            pagingCounter: Index of the first document on the page.

            hasPrevPage: Boolean for the previous page.

            hasNextPage: Boolean for the next page.

            prevPage: Number of the previous page (if exists).

            nextPage: Number of the next page (if exists).

*/

// videoSchema.index()

export const videoModel = model('Video', videoSchema);