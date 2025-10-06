import mongoose from "mongoose";

const connectDB = async () => {
    const atlasConnection = process.env.DB_ATLAS_URI
    const localConnection = process.env.DB_LOCAL_URI

    console.log(atlasConnection);
    try {
        const result = await mongoose.connect(`${atlasConnection}`)
        
        console.log(`db connected !`);

    } catch (error) {
        console.log(`failed to connect db`, { error });

    }
}

export default connectDB