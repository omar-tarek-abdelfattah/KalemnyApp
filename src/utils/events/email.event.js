import { EventEmitter } from 'node:events'
import { sendEmail } from '../email/send.email.js'
import { verifyEmailTemplate } from '../email/templates/verify.templates.js';

export const emailEvent = new EventEmitter()

emailEvent.on("confirm-email", async (data) => {
    await sendEmail({
        to: data.to, subject: data.subject || "confirm email",
        html: verifyEmailTemplate({ otp: data.otp })
    })
        .catch(error => { console.log(`failed to send data to ${data.to}`) });
})
emailEvent.on("forgot-password-otp", async (data) => {
    await sendEmail({
        to: data.to, subject: data.subject || "forgot password otp",
        html: verifyEmailTemplate({ otp: data.otp, title: 'reset password otp' })
    })
        .catch(error => { console.log(`failed to send data to ${data.to}`) });
})