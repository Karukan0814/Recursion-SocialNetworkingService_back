const multer = require("multer");
const AWS = require("aws-sdk");

// Multer設定
export const storage = multer.memoryStorage(); // ファイルをメモリに一時保存
export const upload = multer({ storage: storage });

// AWS S3 設定

export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
