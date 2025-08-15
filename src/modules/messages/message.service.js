import { asyncHandler, successResponse } from "../../utils/response.util.js"
import * as DBService from '../../DB/db.service.js'
import { MessageModel } from "../../DB/models/Message.model.js"
import { uploadFiles } from "../../utils/multer/cloudinary.js"
import UserModel from "../../DB/models/User.model.js"


export const sendMessage = asyncHandler(
    async (req, res, next) => {


        if (!req.body.content && !req.files) {
            return next(new Error('empty message, content or an attachment is required'))
        }
        const { receiverId } = req.params
        // console.log(receiverId);


        // console.log(req.user);




        if (!await DBService.findOne({
            model: UserModel, filter: {
                _id: receiverId,
                deletedAt: { $exists: false },
                confirmEmail: { $exists: true }
            }
        })) {
            return next(new Error('user not found', { cause: 404 }))
        }



        const { content } = req.body
        let attachments = []
        if (req.files) {
            attachments = await uploadFiles({ files: req.files, path: `messages/${receiverId}` })
        }

        const [message] = await DBService.create({
            model: MessageModel,
            data: [{
                content,
                attachments,
                receiverId,
                senderId: req.user?._id
            }],

        })


        return successResponse({ res, message: 'done', data: { message } })
    })

export const deleteMessage = asyncHandler(
    async (req, res, next) => {

        const { messageId } = req.params

        const message = await DBService.deleteOne({
            model: MessageModel,
            filter: {
                _id: messageId,
                receiverId: req.user._id
            }
        })

        return message.deletedCount ? successResponse({ res, data: {} }) : next(new Error('message not found', { cause: 404 }))
    })

