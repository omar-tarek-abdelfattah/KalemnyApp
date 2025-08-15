
import CryptoJS from "crypto-js"

export const generateCrypt = async ({ plaintext = "", secretKey = process.env.ENCRYPTION_SECRET } = {}) => {
    return CryptoJS.AES.encrypt(plaintext, secretKey).toString()
}
export const decryptEncryption = async ({ cipherText = "", secretKey = process.env.ENCRYPTION_SECRET } = {}) => {
    return CryptoJS.AES.decrypt(cipherText, secretKey).toString(CryptoJS.enc.Utf8)
}