import bcrypt from "bcrypt"
import { customAlphabet } from "nanoid"

export const generateHash = async ({ plainText = "", saltRound = process.env.SALT } = {}) => {
    return bcrypt.hashSync(plainText, parseInt(saltRound))
}
export const compareHash = async ({ plainText = "", hashValue = "" } = {}) => {
    return bcrypt.compareSync(plainText, hashValue)
}

export const generateOtp = async () => {
    const otp = customAlphabet('0123456789', 6)()
    return otp
}
export const generateHashedOtp = async ({ otp = "" } = {}) => {
    const confirmEmailOtp = await generateHash({ plainText: String(otp) })
    return confirmEmailOtp
}