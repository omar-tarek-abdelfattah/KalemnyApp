import mongoose from "mongoose";

export const logoutFlagEnum = { signout: 'signout', signoutFromAll: 'signoutFromAll', stayLoggedIn: 'stayLoggedIn' }

const TokenSchema = new mongoose.Schema({

    jti: { type: String, required: true, unique: true },
    expiresIn: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

},
    {
        timestamps: true
    }
)



const TokenModel = mongoose.models.Token || mongoose.model('Token', TokenSchema)
TokenModel.syncIndexes()
export default TokenModel