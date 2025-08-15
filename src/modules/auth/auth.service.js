import UserModel, { providerEnum, roleEnum } from "../../DB/models/User.model.js"
import { asyncHandler, successResponse } from "../../utils/response.util.js"
import * as DBService from '../../DB/db.service.js'
import { compareHash, generateHash, generateHashedOtp, generateOtp } from "../../utils/security/hash.security.js"
import { generateCrypt } from "../../utils/security/encrypt.security.js"
import { OAuth2Client } from 'google-auth-library'


import { getCredentials } from "../../utils/security/token.security.js"
import { emailEvent } from "../../utils/events/email.event.js"
import { customAlphabet } from "nanoid"





async function verifyGoogleAccount({ idToken } = {}) {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID?.split(','),  // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload

}


export const signupOrLoginWithGmail = asyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body
        const { picture, name, email, email_verified } = await verifyGoogleAccount({ idToken })

        if (!email_verified) return next(new Error("not verified account"))
        const user = await DBService.findOne({ model: UserModel, filter: { email } })
        if (user) {
            if (user.provider === providerEnum.google) {
                const credentials = await getCredentials({ user })
                return successResponse({ res, data: { ...credentials } })
            }
            return next(new Error("account already exists", { cause: 409 }))
        }

        const [newUser] = await DBService.create({
            model: UserModel, data: [{
                fullName: name,
                email,
                picture,
                confirmEmail: Date.now(),
                provider: providerEnum.google
            }]
        })
        const credentials = await getCredentials({ user: newUser })
        return successResponse({ res, data: { ...credentials }, status: 201 })

    })


// export const loginWithGmail = asyncHandler(
//     async (req, res, next) => {
//         const { idToken } = req.body
//         const { email, email_verified } = await verifyGoogleAccount({ idToken })

//         if (!email_verified) return next(new Error("not verified account"))

//         const user = await DBService.findOne({
//             model: UserModel,
//             filter: { email, provider: providerEnum.google },
//             select: ''
//         })

//         if (!user) return next(new Error("invalid credentials or provider", { cause: 404 }))

//         const credentials = await getCredentials({ user })
//         return successResponse({ res, data: { ...credentials } })
//     }
// )


export const signup = asyncHandler(
    async (req, res, next) => {
        const { fullName, email, password, phone, gender } = req.body


        if (await DBService.findOne({ model: UserModel, filter: { email } })) return next(new Error("email already exists", { cause: 409 }))

        const hashPassword = await generateHash({ plainText: password, saltRound: 4 })
        const encPhone = await generateCrypt({ plaintext: phone })
        const otp = await generateOtp()


        const [user] = await DBService.create({
            model: UserModel,
            data: [{
                fullName,
                email,
                password: hashPassword,
                phone: encPhone,
                gender,
                confirmEmailOtp: {
                    value: await generateHashedOtp({ otp }),
                    expireAt: Date.now() + 120000
                }
            }]
        })
        emailEvent.emit("confirm-email", { to: email, otp })


        return successResponse({ res, data: { user }, status: 201, message: 'user created successfully' })
    })



export const login = asyncHandler(
    async (req, res, next) => {
        const { email, password } = req.body

        const user = await DBService.findOne({
            model: UserModel,
            filter: { email, provider: providerEnum.system },
            select: ''
        })

        if (!user) return next(new Error("invalid email or password", { cause: 404 }))

        if (!user.confirmEmail) {
            return next(new Error('please verify account first'))
        }
        if (user.deletedAt) {
            return next(new Error('Account is deleted'))
        }

        if (!await compareHash({ hashValue: user.password, plainText: password })) return next(new Error("invalid email or password", { cause: 404 }))
        const credentials = await getCredentials({ user })
        return successResponse({ res, data: { ...credentials } })
    }

)

export const verifyForgetCode = asyncHandler(
    async (req, res, next) => {
        const { email, otp } = req.body
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                email,
                deletedAt: { $exists: false },
                confirmEmail: { $exists: true },
                forgotCode: { $exists: true }

            },
            // data: { forgotCode: hashOtp }
        })
        if (!user) {
            return next(new Error("invalid account", { cause: 404 }))
        }
        if (!await compareHash({ plainText: otp, hashValue: user.forgotCode })) {
            return next(new Error("invalid otp", { cause: 400 }))
        }



        return successResponse({ res, message: 'otp verified' })
    }

)

export const resetPassword = asyncHandler(
    async (req, res, next) => {
        const { email, otp, password } = req.body

        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                email,
                deletedAt: { $exists: false },
                confirmEmail: { $exists: true },
                forgotCode: { $exists: true }

            },
            // data: { forgotCode: hashOtp }
        })
        if (!user) {
            return next(new Error("invalid account", { cause: 404 }))
        }
        if (!await compareHash({ plainText: otp, hashValue: user.forgotCode })) {
            return next(new Error("invalid otp", { cause: 400 }))
        }

        const hashNewPassword = await generateHash({ plainText: password })
        await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                email
            },
            data: {
                $set: { password: hashNewPassword, changeLoginCredentials: Date.now() },
                $unset: { forgotCode: 1 }
            }
        })
        return successResponse({ res, message: 'password updated' })
    }

)

export const sendForgotPassword = asyncHandler(
    async (req, res, next) => {
        const { email } = req.body
        const otp = customAlphabet("0123456789", 6)()
        const hashOtp = await generateHash({ plainText: otp })
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                email,
                deletedAt: { $exists: false },
                confirmEmail: { $exists: true },
            },
            data: { forgotCode: hashOtp }
        })

        if (!user) {
            return next(new Error("invalid account", { cause: 404 }))
        }

        emailEvent.emit("forgot-password-otp", {
            to: email,
            subject: "Forgot Password Otp",
            otp
        })

        return successResponse({ res, message: 'check your email' })
    }

)

export const confirmEmail = asyncHandler(
    async (req, res, next) => {
        const { email, otp } = req.body
        const user = await DBService.findOne({
            model: UserModel,
            filter: { email, confirmEmail: { $exists: false }, confirmEmailOtp: { $exists: true } }
        })

        if (Date.now() - user.confirmEmailOtp.expireAt > 120000) {
            return next(new Error('otp expired'))
        }




        if (!user) return next(new Error('Invalid account or already verified', { cause: 404 }))

        if (!await compareHash({ plainText: otp, hashValue: user.confirmEmailOtp.value })) return next(new Error('invalid otp'))

        const updatedUser = await DBService.updateOne({
            model: UserModel,
            filter: { email }, data: {
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true }
            }
        })
        return updatedUser.matchedCount ? successResponse({ res, message: "email confirmed" }) : next(new Error("fail to confirm user email"))
    }

)
export const resendOtp = asyncHandler(
    async (req, res, next) => {
        const { email } = req.body
        const otp = await generateOtp()
        const hashedOtp = await generateHashedOtp({ otp })
        let existing = await DBService.findOne({ model: UserModel, filter: { email, confirmEmailOtp: { $exists: true } } })
        if (!existing) {
            return next(new Error('user not found', { cause: 404 }))
        }

        if (existing.confirmEmailOtp && existing.confirmEmailOtp.banUntil > new Date()) {
            return next(new Error(`you are temporarily banned from requesting a new Otp`))
        }

        if (existing.confirmEmailOtp.banUntil && existing.confirmEmailOtp.banUntil < new Date()) {
            await DBService.updateOne({
                model: UserModel,
                filter: { email, "confirmEmailOtp.banUntil": { $exists: 1 } },
                data: {
                    $unset: { "confirmEmailOtp.banUntil": 1 },
                    "confirmEmailOtp.attempt": 1
                }
            })
        }

        const user = await DBService.findOneAndUpdateWithoutVersioning({
            model: UserModel,
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                "confirmEmailOtp.attempt": { $lte: 5 },
            },
            data: {
                "confirmEmailOtp.value": hashedOtp,
                $inc: { __v: 1, "confirmEmailOtp.attempt": 1 },
                "confirmEmailOtp.expireAt": Date.now() + 120000
            }
        })
        if (user.confirmEmailOtp.attempt == 5) {
            await DBService.updateOne({
                model: UserModel,
                filter: { email, confirmEmailOtp: { $exists: 1 } },
                data: { "confirmEmailOtp.banUntil": Date.now() + 300000 }
            })
            emailEvent.emit("confirm-email", { to: email, otp })
            return successResponse({ res, message: `otp resent, Cant resend before 5 minutes from now` })
        }

        emailEvent.emit("confirm-email", { to: email, otp })
        return successResponse({ res, message: "otp resent ! check your mail" })
    }

)

