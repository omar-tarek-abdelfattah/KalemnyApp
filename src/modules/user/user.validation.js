import joi from "joi"
import { generalFields } from "../../middleware/validation.middleware.js"
import { logoutFlagEnum } from "../../DB/models/Token.model.js"
import { fileValidation } from "../../utils/multer/local.multer.js"

export const logout = {
    body: joi.object().keys({
        flag: joi.string().valid(...Object.values(logoutFlagEnum)).default(logoutFlagEnum.stayLoggedIn)
    })
}
export const shareProfile = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    })
}
export const getMessageById = {
    params: joi.object().keys({
        messageId: generalFields.id.required()
    })
}
export const profileImage = {
    file: joi.object().keys({
        fieldname: joi.string().valid('image').required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().valid(...fileValidation.image).required(),
        // finalPath: joi.string().required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().positive().required(),
    })
}
export const coverImages = {
    files: joi.array().items(
        joi.object().keys({
            fieldname: joi.string().valid('images').required(),
            originalname: joi.string().required(),
            encoding: joi.string().required(),
            mimetype: joi.string().valid(...fileValidation.image).required(),
            // finalPath: joi.string().required(),
            destination: joi.string().required(),
            filename: joi.string().required(),
            path: joi.string().required(),
            size: joi.number().positive().required(),
        }).required()
    ).min(1).max(2)
}
export const updateBasicInfo = {
    body: joi.object().keys({
        fullName: generalFields.fullName,
        phone: generalFields.phone,
        gender: generalFields.gender,

    })
}
export const updatePassword = {
    body: logout.body.append({
        oldPassword: generalFields.password.required(),
        password: generalFields.password.not(joi.ref('oldPassword'))
            .messages({ "any.invalid": "New Password cannot match the Old Password" }).required(),
        confirmPassword: generalFields.confirmPassword
            .messages({ "any.only": "Confirm password and password don't match" }).required(),

    })
}
export const freezeAccount = {
    params: joi.object().keys({
        userId: generalFields.id
    })
}
export const restoreAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    }).required()
}
export const deleteAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    }).required()
}