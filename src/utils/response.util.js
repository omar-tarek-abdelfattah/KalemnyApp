export const asyncHandler = (fn) => {
    return async (req, res, next) => {

        await fn(req, res, next).catch(error => {
            return next(error, { cause: 500 })
        })
    }
}
export const errorHandling = (error, req, res, next) => {
    return res.status(error.cause || 400).json({
        message: error.message,
        code: error.code

        // stack: process.env.MOOD === "DEV" ? error.stack : undefined
    })
}

export const errorEnum = {
    EmailExists: 'EMAIL_EXISTS',
    NotFoundException: 'NOT_FOUND_EXCEPTION',
    UnConfirmedAccount:'UNCONFIRMED_ACCOUNT',
    InvalidOtp:'INVALID_OTP',
    OtpExpired:'OTP_EXPIRED',
    InvalidOtp:'INVALID_OTP',
    TempBlock:"TEMP_BLOCK"
}

export class AppError extends Error {
    constructor(message, cause, code) {
        super(message, cause)
        this.code = code || "INTERNAL_ERR"

        Error.captureStackTrace(this, this.constructor)
    }
}

export const successResponse = async ({ res, data = {}, message = "done", status = 200 } = {}) => {
    return await res.status(status).json({ message, status, ...data })
}

