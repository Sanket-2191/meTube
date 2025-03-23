import mongoose, { model, Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        channel: {
            type: Schema.Types.ObjectId, //  "channel" which can be subscribed
            ref: 'User'
        },
        subscriber: {
            type: Schema.Types.ObjectId, // user who is subscribing to this "channel"
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);


export const subscriptionModel = model('Subscription', subscriptionSchema);