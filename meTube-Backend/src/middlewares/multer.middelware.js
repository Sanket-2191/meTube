import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        // console.log("Files received in multer midware:?", req.files || "files not received");
        cb(null, 'public/temp/my-uploads')
        /*
           since our project is run as 'node src/server.js' so the root dir will be considered to be
           the dir in which src/server.js is present and all relative path provided in any utility func
           or midware, etc willbe resolved as  
               <parent-folder of src/server.js ("meTube-Backend" here)>/provided-rel-path 
                so above rel path will be resolved as
              
                  meTube-Backend/(public/temp/my-uploads)
        */
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

export { upload };
