import multer from "multer";
import fs from "node:fs"
import path from "node:path"

export const fileValidation = {
    image: ['image/jpeg', 'image/png'],
    document: ['application/pdf', 'application/json']
}

export const localFileUpload = ({ customPath = "general", validation = [] } = {}) => {



    const storage = multer.diskStorage({
        destination: function (req, file, callback) {

            let basePath = `uploads/${customPath}`
            if (req.user?._id) {
                basePath = `${basePath}/${req.user._id}`
            }

            const fullPath = path.resolve(`./src/${basePath}`)
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true })
            }

            req.basePath = basePath
            callback(null, path.resolve(fullPath))
        },


        filename: function (req, file, callback) {
            const uniqueFileName = Date.now() + "__" + Math.floor(Math.random() * 1000000000) + "__" + file.originalname
            file.finalPath = req.basePath + "/" + uniqueFileName
            callback(null, uniqueFileName)
        }
    })

    function fileFilter(req, file, callback) {
        if (validation.includes(file.mimetype)) {
            return callback(null, true)
        }
        return callback('Invalid file format', false)
    }



    return multer({ fileFilter, storage })
}