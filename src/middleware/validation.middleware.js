import { Types } from "mongoose"
import { asyncHandler } from "../utils/response.util.js"
import joi from "joi"
import { genderEnum } from "../DB/models/User.model.js"
export const generalFields = {
    fullName: joi.string().min(2).max(20).messages({
        "string.min": "min name length is 2 char",
        "any.required": "fullName is mandatory"
    }),
    email: joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3, tlds: { allow: ["net", "com"] } }),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}/)),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}/)),
    confirmPassword: joi.string().valid(joi.ref("password")),
    gender: joi.string().valid(genderEnum.male, genderEnum.female),
    lang: joi.string().valid("ar", "en"),
    otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
    id: joi.string().custom((value, helper) => {
        return Types.ObjectId.isValid(value) || helper.message("invalid ObjectId")
    })
}

export const validation = (schema) => {

    
    
    return asyncHandler(
        async (req, res, next) => {
            // console.log({ files: req.files, file: req.file });
            // console.log(req.files);


            const validationError = []

            for (const key of Object.keys(schema)) {
                const validationResult = await schema[key].validate(req[key], { abortEarly: false })
                if (validationResult.error) {
                    validationError.push({
                        key, error: validationResult.error.details
                            .map(ele => {
                                return { message: ele.message, path: ele.path[0] }
                            })
                    })
                }
            }
            if (validationError.length) return res.status(400).json({ err_message: "validation error", ...validationError })
            return next()
        }
    )
}