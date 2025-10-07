import path from "node:path"
import * as dotenv from 'dotenv'
dotenv.config({ path: path.join("./src/config/.env.dev"), quiet: true })
// dotenv.config({ path: path.join("./src/config/.env.prod"), quiet: true })
dotenv.config()

import express from 'express'
import authController from './modules/auth/auth.controller.js'
import userController from './modules/user/user.controller.js'
import messageController from './modules/messages/message.controller.js'
import connectDB from './DB/db.connection.js'
import { errorHandling } from './utils/response.util.js'
import cors from 'cors'
import morgan from "morgan"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cron from "node-cron"
import { deleteAllTokens } from "./utils/security/token.security.js"
// import { error } from "node:console"









const bootstrap = async () => {
    const app = express()
    const port = process.env.PORT || 5000

    cron.schedule("0 0 * * *", async () => {
        try {
            const tokens = await deleteAllTokens()
            console.log(`[CRON] deleted ${tokens.deletedCount} at midnight succesfully `);
        } catch (error) {
            console.log('[CRON] ERROR TRYING TO DELETE ALL TOKENS', error);
        }
    })

    const authLimiter = rateLimit({
        windowMs: 1800000,
        limit: 1000,
        legacyHeaders: false
    })
    const userLimiter = rateLimit({
        windowMs: 3600000,
        limit: 1000,
        message: { error: 'Something went wrong please try again later ❌' }
    })

    // cors
    app.use('/auth', authLimiter)
    app.use('/users', userLimiter)
    app.use(morgan('common'))
    app.use(helmet())
    app.use(cors())
    app.use('/uploads', express.static(path.resolve('./src/uploads')))




    //connect DB here
    connectDB()

    // convert buffer Data here
    app.use(express.json())

    // app routing here
    app.use('/auth', authController)
    app.use('/users', userController)
    app.use('/messages', messageController)





    app.all('{/*dummy}', (req, res) => { res.status(404).json({ message: 'invalid routing' }) })

    app.use(errorHandling)

    app.listen(port, e => console.log(`app is running on port :: ${port}`));

}

export default bootstrap