import { Router } from "express"
import * as userService from './user.service.js'
import * as validators from './user.validation.js'
import { auth, authentication, authorization } from "../../middleware/authentication.middleware.js"
import { tokenTypeEnum } from "../../utils/security/token.security.js"
import { endpoint } from "./user.authorization.js"
import { validation } from "../../middleware/validation.middleware.js"
import { fileValidation, localFileUpload } from "../../utils/multer/local.multer.js"
import { cloudFileUpload } from "../../utils/multer/cloud.multer.js"

const router = Router()

// router.use(authentication())
router.post("/logout",
    authentication(),
    validation(validators.logout),
    userService.logout)

router.get('/',
    authentication(),
    authorization({ accessRoles: endpoint.profile }),
    userService.getUserById)

router.patch('/', authentication(), validation(validators.updateBasicInfo), userService.updateBasicInfo)



router.get("/refresh-token", authentication({ tokenType: tokenTypeEnum.refresh }), userService.getNewLoginCredentials)

router.get("/messages", authentication(), userService.showMessages)

router.get("/messages/:messageId", authentication(),validation(validators.getMessageById), userService.getMessageById)

router.get("/share-profile/:userId", validation(validators.shareProfile), userService.shareProfile)

router.patch('/profile-image', authentication(), cloudFileUpload({ validation: fileValidation.image }).single('image'), validation(validators.profileImage), userService.profileImage)

router.patch('/cover-image', authentication(), cloudFileUpload({ validation: fileValidation.image }).array('images', 2), validation(validators.coverImages), userService.coverImages)

router.patch('/password', authentication(), validation(validators.updatePassword), userService.updatePassword)

router.patch('/:userId/restore-account', auth({ accessRoles: endpoint.restoreAccount }), validation(validators.restoreAccount), userService.restoreAccount)

router.delete('{/:userId}/freeze-account', authentication(), validation(validators.freezeAccount), userService.freezeAccount)

router.delete('/:userId/delete-account', auth({ accessRoles: endpoint.deleteAccount }), validation(validators.deleteAccount), userService.deleteAccount)

export default router