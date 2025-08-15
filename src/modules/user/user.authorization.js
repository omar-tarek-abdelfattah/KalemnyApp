import { roleEnum } from "../../DB/models/User.model.js";

export const endpoint = {
    profile: [roleEnum.system, roleEnum.user],
    restoreAccount: [roleEnum.system],
    deleteAccount: [roleEnum.system],
}