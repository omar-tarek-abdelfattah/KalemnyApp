import joi from 'joi'
import { generalFields } from '../../middleware/validation.middleware.js'
import { fileValidation } from '../../utils/multer/cloud.multer.js'


export const sendMessage = {
    params: joi.object().keys({
        receiverId: generalFields.id.required()
    }).required(),
    body: joi.object().keys({
        content: joi.string().min(2).max(20000),
    }).required(),
    files: joi.array().items(joi.object().keys({
        fieldname: joi.string().valid('attachments').required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().valid(...fileValidation.image).required(),
        // finalPath: joi.string().required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().max(10 * 1024 * 1024).messages({
            "number.max": "Image size must not exceed 2MB",
            "any.required": "File size is required",
        }).required(),
    })).min(0).max(3)
}

export const deleteMessage = {
    params: joi.object().keys({
        messageId: generalFields.id.required()
    }).required()
}