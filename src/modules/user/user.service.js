
import { asyncHandler, successResponse } from "../../utils/response.util.js"
import { decryptEncryption, generateCrypt } from "../../utils/security/encrypt.security.js"
import { createRevokeToken, getCredentials } from "../../utils/security/token.security.js"
import * as DBService from '../../DB/db.service.js'
import UserModel, { roleEnum } from "../../DB/models/User.model.js"
import { compareHash, generateHash } from "../../utils/security/hash.security.js"
import { logoutFlagEnum } from "../../DB/models/Token.model.js"
import { cloud, deleteFolderByPrefix, deleteResources, destroyFile, uploadFile, uploadFiles } from "../../utils/multer/cloudinary.js"
import { MessageModel } from "../../DB/models/Message.model.js"



export const logout = asyncHandler(
    async (req, res, next) => {
        // console.log(req.user);

        const { flag } = req.body

        let statusCode = 200

        switch (flag) {
            case logoutFlagEnum.signoutFromAll:
                await DBService.updateOne({
                    model: UserModel, filter: { _id: req.decoded._id }, data: {
                        changeLoginCredentials: new Date()
                    }
                })
                break;

            default:
                await createRevokeToken({ req })
                statusCode = 201
                break;
        }


        return successResponse({ res, message: "Logged Out", status: statusCode })
    }
)
export const getUserById = asyncHandler(
    async (req, res, next) => {
        // console.log(req.user);

        req.user.phone = await decryptEncryption({ cipherText: req.user.phone })
        // if (!user) return next(new Error("user not found", { cause: 404 }))
        return successResponse({ res, data: { user: req.user } })
    }
)

export const shareProfile = asyncHandler(
    async (req, res, next) => {
        const { userId } = req.params
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                _id: userId,
                confirmEmail: { $exists: true }
            }
        })

        user.phone = await decryptEncryption({ cipherText: user.phone })

        return user ? successResponse({ res, data: { user } }) : next(new Error("Invalid account", { cause: 404 }))
    }
)

export const restoreAccount = asyncHandler(
    async (req, res, next) => {

        const { userId } = req.params

        if (userId && req.user.role !== roleEnum.system) {
            return next(new Error("not authorized account", { cause: 403 }))
        }

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                _id: userId,
                deletedAt: { $exists: true },
                deletedBy: { $ne: userId },
            },
            data: {
                $unset: {
                    deletedAt: 1,
                    deletedBy: 1
                },
                restoredAt: Date.now(),
                restoredBy: req.user._id
            }
        })




        return user ? successResponse({ res, message: "account restored successfully" }) : next(new Error("Invalid account", { cause: 404 }))
    }
)

export const freezeAccount = asyncHandler(
    async (req, res, next) => {

        const { userId } = req.params

        if (userId && req.user.role !== roleEnum.system) {
            return next(new Error("not authorized account", { cause: 403 }))
        }

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                _id: userId || req.user._id,
                deletedAt: { $exists: false }
            },
            data: {
                deletedAt: Date.now(),
                deletedBy: req.user._id,
                changeLoginCredentials: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1
                }
            }
        })




        return user ? successResponse({ res, message: "account frozen successfully" }) : next(new Error("Invalid account", { cause: 404 }))
    }
)
export const deleteAccount = asyncHandler(
    async (req, res, next) => {

        const { userId } = req.params

        if (userId && req.user.role !== roleEnum.system) {
            return next(new Error("not authorized account", { cause: 403 }))
        }

        const user = await DBService.deleteOne({
            model: UserModel,
            filter: {
                _id: userId,
                deletedAt: { $exists: true },
                deletedBy: { $exists: true }
            }

        })

        if (user.deletedCount) {
            await deleteFolderByPrefix({ prefix: `user/${req.user._id}` })
        }

        return user.deletedCount ? successResponse({ res, message: "account deleted successfully" }) : next(new Error("Invalid account", { cause: 404 }))
    }
)

export const updateBasicInfo = asyncHandler(
    async (req, res, next) => {

        const { gender, phone, fullName } = req.body

        const updatedData = {}

        if (phone) {
            updatedData.phone = await generateCrypt({ plaintext: phone })
        }

        if (fullName) {
            const [firstName, lastName] = req.body.fullName.split(' ')
            updatedData.firstName = firstName
            updatedData.lastName = lastName
        }

        if (gender) {
            updatedData.gender = gender
        }

        const updatedUser = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id },
            data: { ...updatedData }
        })


        return updatedUser ? successResponse({ res, data: { updatedUser } }) : next(new Error("Invalid account", { cause: 404 }))
    }
)
export const updatePassword = asyncHandler(
    async (req, res, next) => {

        const { oldPassword, password, flag } = req.body

        if (!await compareHash({ plainText: oldPassword, hashValue: req.user.password })) {
            return next(new Error("invalid old password"))
        }

        if (req.user.oldPasswords?.length) {
            for (const historyPassword of req.user.oldPasswords) {
                if (await compareHash({ plainText: password, hashValue: historyPassword })) {
                    return next(new Error("this password has been used before"))
                }
            }
        }

        let updatedData = {}

        switch (flag) {
            case logoutFlagEnum.signoutFromAll:
                updatedData.changeLoginCredentials = new Date()
                break;
            case logoutFlagEnum.signout:
                await createRevokeToken({ req })
                break;

            default:
                break;
        }
        const updatedUser = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id },
            data: {
                password: await generateHash({ plainText: password }),
                $push: { oldPasswords: req.user.password },
                ...updatedData

            }
        })


        return updatedUser ? successResponse({ res, data: { updatedUser } }) : next(new Error("Invalid account", { cause: 404 }))
    }
)

export const coverImages = asyncHandler(
    async (req, res, next) => {



        // console.log(req.files);
        const attachments = await uploadFiles({ files: req.files, path: `user/${req.user._id}/cover` })
        console.log();

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id }
            , data: { covers: attachments },
            options: { new: false }
        })

        if (user?.covers?.length) {
            await deleteResources({ public_ids: user.covers.map(ele => ele.public_id) })
        }

        return successResponse({ res, data: { attachments } })

    }
)

export const profileImage = asyncHandler(
    async (req, res, next) => {

        // console.log(req.file.path);



        const { secure_url, public_id } = await uploadFile({ file: req.file, path: `user/${req.user._id}` })

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: { _id: req.user._id }
            , data: { picture: { secure_url, public_id } },
            options: { new: false }
        })

        if (user?.picture?.public_id) {
            await destroyFile({ public_id: user.picture.public_id })
        }

        return successResponse({
            res, data: {
                user: user || ''
            }
        })

    }
)



export const getNewLoginCredentials = asyncHandler(
    async (req, res, next) => {
        // const newToken = await
        const user = req.user

        const credentials = await getCredentials({ user })


        return successResponse({ res, data: { ...credentials } })
    }
)

export const showMessages = asyncHandler(
    async (req, res, next) => {

        const user = await DBService.findById({
            model: UserModel,
            id: req.user._id,
            select: 'messages fullName',
            populate: 'messages',
            lean: true
        })


        return successResponse({ res, data: { user } })
    }
)
export const getMessageById = asyncHandler(
    async (req, res, next) => {

        const { messageId } = req.params

        const message = await DBService.findOne({
            model: MessageModel,
            filter: {
                receiverId: req.user._id,
                _id: messageId
            }
        })

        if (!message) {
            return next(new Error('Message not found', { cause: 404 }))
        }



        return successResponse({ res, data: { message } })
    }
)