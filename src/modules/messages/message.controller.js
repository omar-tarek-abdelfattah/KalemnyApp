import { Router } from "express";
import * as MessageService from './message.service.js'
import * as validators from './message.validation.js'
import { cloudFileUpload, fileValidation } from "../../utils/multer/cloud.multer.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/authentication.middleware.js";


const router = Router()

router.post(
    '/:receiverId',
    cloudFileUpload({ validation: fileValidation.image }).array('attachments', 3),
    validation(validators.sendMessage),
    MessageService.sendMessage
)
router.post(
    '/:receiverId/sender',
    authentication(),
    cloudFileUpload({ validation: fileValidation.image }).array('attachments', 3),
    validation(validators.sendMessage),
    MessageService.sendMessage
)

router.delete('/:messageId',
    authentication(),
    validation(validators.deleteMessage),
    MessageService.deleteMessage)




export default router