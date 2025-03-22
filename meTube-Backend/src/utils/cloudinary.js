import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import { ErrorHandler } from './ErrorHandlers.js';



cloudinary.config({
    cloud_name: 'din14pksa',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' })
        console.log("URL created on cloudinary: ", response.url);
        return response;

    } catch (error) {
        throw new ErrorHandler(500, "File upload failed");
    } finally {
        console.log("removed local file after creationod URL");
        // to remove the locally saved temp file from multer as upload operation failed
        fs.unlinkSync(localFilePath)
    }
}

export { uploadOnCloudinary }

