import mongoose from "mongoose"
import { subscriptionModel } from "../models/subscription.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ErrorHandler } from "../utils/ErrorHandlers.js"
import { APIresponse } from "../utils/APIresponse.js"


export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.isValidObjectId(channelId)) throw new ErrorHandler(400, "Please provide channel Id");
    // TODO toggle subscription
    const subscriptionFind = await subscriptionModel.findOne(
        {
            $and: [
                { channel: channelId }, { subscrider: req.user._id }
            ]
        }
    )
    if (subscriptionFind) {
        const deleted = await subscriptionFind.deleteOne();
        return res.status(200)
            .json(
                new APIresponse(
                    200,
                    deleted,
                    "Subscription cancelled !!"
                )
            )
    }


    const subscription = await subscriptionModel.create({
        channel: channelId,
        subscriber: req.user._id
    })

    if (!subscription) throw new ErrorHandler(500, "Unable to save subscrition.");

    return res.status(201)
        .json(
            new APIresponse(
                200,
                subscription,
                "Subscription successfull✅✅"
            )
        )


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})