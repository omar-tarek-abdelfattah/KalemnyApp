import { asyncHandler } from "../utils/response.util.js"

import { decodedToken, getSignature, signatureLevelEnum, tokenTypeEnum, verifyToken } from "../utils/security/token.security.js"

export const authentication = ({ tokenType = tokenTypeEnum.access } = {}) => {
    return asyncHandler(async (req, res, next) => {

        const { user, decoded } = await decodedToken({ next, authorization: req.headers.authorization, tokenType }) || {}
        req.user = user
        req.decoded = decoded

        return next()
    })
}

export const authorization = ({ accessRoles = [] } = {}) => {
    return asyncHandler(async (req, res, next) => {

        if (!accessRoles.includes(req.user.role)) return next(new Error("not authorized account", { cause: 403 }))


        return next()
    })
}

export const auth = ({ accessRoles = [], tokenType = tokenTypeEnum.access } = {}) => {
    return asyncHandler(async (req, res, next) => {
        const { user, decoded } = await decodedToken({ next, authorization: req.headers.authorization, tokenType }) || {}
        req.user = user
        req.decoded = decoded
        if (!accessRoles.includes(req.user.role)) return next(new Error("not authorized account", { cause: 403 }))

        return next()
    })
}
