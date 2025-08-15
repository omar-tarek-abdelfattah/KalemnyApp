import jwt from 'jsonwebtoken'
export const signatureLevelEnum = { bearer: "Bearer", system: 'System' }
export const tokenTypeEnum = { access: "access", refresh: "refresh" }
import * as DBService from "../../DB/db.service.js"
import UserModel, { roleEnum } from "../../DB/models/User.model.js"
import { nanoid } from 'nanoid'
import TokenModel from '../../DB/models/Token.model.js'

export const generateToken = async ({
    payload = {},
    signature = process.env.ACCESS_USER_TOKEN_SIGNATURE,
    options = { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) }
} = {}) => {
    const token = jwt.sign(payload, signature, options)
    return token
}
export const verifyToken = async ({
    token = "",
    signature = process.env.ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
    return jwt.verify(token, signature)
}

export const getSignature = async ({ signatureLevel = signatureLevelEnum.bearer } = {}) => {
    let signatures = { accessSignature: undefined, refreshSignature: undefined }
    switch (signatureLevel) {
        case signatureLevelEnum.system:
            signatures.accessSignature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE
            signatures.refreshSignature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE
            break;

        default:
            signatures.accessSignature = process.env.ACCESS_USER_TOKEN_SIGNATURE
            signatures.refreshSignature = process.env.REFRESH_USER_TOKEN_SIGNATURE
            break;
    }
    return signatures
}

export const decodedToken = async ({ next, authorization = "", tokenType = tokenTypeEnum.access } = {}) => {



    const [bearer, token] = authorization?.split(' ') || []
    // console.log({ bearer, token });

    if (!bearer || !token) { return next(new Error("missing token parts", { cause: 401 })) }




    const signatures = await getSignature({ signatureLevel: bearer })


    const decoded = await verifyToken({
        token,
        signature: tokenType === tokenTypeEnum.access ? signatures.accessSignature : signatures.refreshSignature
    })
    if (!decoded?._id) return next(new Error("invalid token", { cause: 400 }))

    if (decoded.jti && await DBService.findOne({
        model: TokenModel, filter: {
            jti: decoded.jti
        }
    })) {
        return next(new Error("invalid login credentials", { cause: 401 }))
    }

    const user = await DBService.findById({ model: UserModel, id: decoded._id })
    if (!user) return next(new Error("not registered account", { cause: 404 }));

    if (user.changeLoginCredentials && decoded.iat * 1000 < new Date(user.changeLoginCredentials).getTime()) {
        return next(new Error('old login credentials, please login again'), { cause: 401 })
    }

    // console.log(decoded.jti);

    return { user, decoded }
}

export const getCredentials = async ({ user } = {}) => {
    const signatures = await getSignature({ signatureLevel: user?.role !== roleEnum.user ? signatureLevelEnum.system : signatureLevelEnum.bearer })
    const jwtid = nanoid()

    const access_Token = await generateToken({
        payload: { _id: user._id },
        signature: signatures.accessSignature,
        options: {
            jwtid: jwtid,
            expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
        }
    })
    const refresh_Token = await generateToken({
        payload: { _id: user._id },
        signature: signatures.refreshSignature,
        options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) }
    })



    return { access_Token, refresh_Token }
}

export const createRevokeToken = async ({ req } = {}) => {
    await DBService.create({
        model: TokenModel, data: [{
            jti: req.decoded.jti,
            expiresIn: req.decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            userId: req.decoded._id
        }]
    })

    return true
}

export const deleteAllTokens = async () => {
    const tokens = await DBService.deleteMany({ model: TokenModel })
    return tokens
}