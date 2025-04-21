import mongoose from "mongoose";

import { subscriptionModel } from "../models/subscription.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { sendError } from "../utils/sendErrorResp.js"
import { sendAPIResp } from "../utils/sendApiResp.js"


export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!mongoose.isValidObjectId(channelId)) return sendError(res, 400, "Please provide channel Id");
    // TODO toggle subscription
    const subscriptionFind = await subscriptionModel.findOne(
        {
            $and: [
                { channel: channelId }, { subscriber: req.user._id }
            ]
        }
    )
    if (subscriptionFind) {
        const deleted = await subscriptionFind.deleteOne();
        return sendAPIResp(
            res,
            200,
            "Subscription cancelled !!",
            deleted
        )
    }


    const subscription = await subscriptionModel.create({
        channel: channelId,
        subscriber: req.user._id
    })

    if (!subscription) return sendError(res, 500, "Unable to save subsbcription.");

    return sendAPIResp(
        res,
        201,
        "Subscription successfull✅✅",
        subscription
    )


},
    { statusCode: 500, message: "Failed to create/delete subscription." })

// controller to return subscriber list of a channel
export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) return sendError(res, 'Please provide vaid channelId');

    const subscriberList = await subscriptionModel.aggregate(
        [
            {
                $match: { channelId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'subscriber',
                    foreignField: '_id',
                    as: 'subscribers',
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                email: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    totalSubscribers: { $size: "$subscribers" }
                }
            },
            {
                $project: {
                    channelId: 1,
                    subscribers: 1,
                    totalSubscribers: 1
                }
            }

        ]


    )

    return sendAPIResp(
        res,
        200,
        subscriberList.length ? "Fetched all subscribers" : "No subcribers on account.",
        subscriberList
    )


},
    { statusCode: 500, message: "Failed to fetch all subscribers." })

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})