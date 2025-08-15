import joi from "joi"
import { generalFields } from "../../middleware/validation.middleware.js"



export const login = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        password: generalFields.password.required(),

    }).required()
}
export const signup = {
    body: login.body.append({
        fullName: generalFields.fullName.required(),
        phone: generalFields.phone.required(),
        confirmPassword: generalFields.confirmPassword.required(),
        gender: generalFields.gender
    }),
    query: joi.object().keys({
        lang: generalFields.lang
    })
}
export const confirmEmail = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required()
    })
}
export const resendOtp = {
    body: joi.object().keys({
        email: generalFields.email.required(),
    })
}

export const signInWithGmail = {
    body: joi.object().keys({
        idToken: joi.string().required()
    })
}
export const sendForgotPassword = {
    body: joi.object().keys({
        email: generalFields.email.required()
    })
}
export const verifyForgetCode = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required()
    })
}
export const resetPassword = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required(),
        password: generalFields.password.required(),
        confirmPassword: generalFields.confirmPassword.required(),
    })
}