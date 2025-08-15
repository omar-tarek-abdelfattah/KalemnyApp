import { Router } from "express"
import * as authService from './auth.service.js'
import * as validators from './auth.validation.js'
import { validation } from "../../middleware/validation.middleware.js"

const router = Router()

router.post('/signup', validation(validators.signup), authService.signup)
router.patch('/confirm-email', validation(validators.confirmEmail), authService.confirmEmail)
router.patch('/resend-otp', validation(validators.resendOtp), authService.resendOtp)
router.post('/login', validation(validators.login), authService.login)

router.patch('/forgot-password', validation(validators.sendForgotPassword), authService.sendForgotPassword)
router.patch('/verify-forget-code', validation(validators.verifyForgetCode), authService.verifyForgetCode)
router.patch('/reset-password', validation(validators.resetPassword), authService.resetPassword)


// both signup and login
router.post('/signup/gmail', validation(validators.signInWithGmail), authService.signupOrLoginWithGmail)

export default router