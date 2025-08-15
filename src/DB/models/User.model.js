import mongoose, { Types } from "mongoose";

export let genderEnum = { male: "male", female: "female" }
export let providerEnum = { system: "system", google: "google" }
export let roleEnum = { user: 'user', system: "admin" }

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: [20, "firstName max length is 20, you entered {VALUE}"] },
    lastName: { type: String, required: true, minLength: 2, maxLength: [20, "lastName max length is 20, you entered {VALUE}"] },
    email: { type: String, required: true, unique: true },
    password: {
        type: String, required: function () {
            return this.provider === providerEnum.system ? true : false
        },
    },
    gender: {
        type: String,
        enum: {
            values: Object.values(genderEnum), message: "gender must be either male or female"
        },
        // required: true,
        default: genderEnum.male
    },
    phone: {
        type: String, required: function () {
            return this.provider === providerEnum.system ? true : false
        }
    },
    role: {
        type: String,
        // requried: true,
        default: roleEnum.user,
        enum: { values: Object.values(roleEnum), message: "role must be either system or admin", },
    },
    confirmEmailOtp: {
        value: String,
        attempt: { type: Number, default: 0 },
        expireAt: Date,
        banUntil: Date
    }
    ,
    confirmEmail: Date,
    picture: { secure_url: String, public_id: String },
    covers: [{ secure_url: String, public_id: String }],
    provider: { type: String, enum: { values: Object.values(providerEnum) }, default: providerEnum.system },

    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    restoredAt: Date,
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    oldPasswords: [String],

    forgotCode: String,
    changeLoginCredentials: Date

},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
)

UserSchema.virtual("fullName").set(function (value) {
    const [firstName, lastName] = value?.split(" ") || []
    this.set({ firstName, lastName })
}).get(function () {
    return this.firstName + " " + this.lastName;
})

UserSchema.virtual('messages', { localField: "_id", foreignField: "receiverId", ref: 'Message' })
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema)
UserModel.syncIndexes()
export default UserModel