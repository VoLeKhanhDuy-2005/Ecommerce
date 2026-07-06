const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();
const sharp = require("sharp");

const bucketName = process.env.BUCKET_NAME;
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const resolveImageKey = (data) => {
  if (!data) return null;
  const key = data.profile?.avatarName || data.avatarName || data.image || null;
  if (key && key.startsWith("http")) return null;
  return key;
};

const checkValidImageExtensionFile = (file) => {
  return file.mimetype === "image/jpeg" || file.mimetype === "image/png";
};

const getImagePresignedUrlByKey = async (key) => {
  if (!key || key.startsWith("http")) return key;
  const getObjectParams = { Bucket: bucketName, Key: key };
  return await getSignedUrl(s3, new GetObjectCommand(getObjectParams), {
    expiresIn: 60,
  });
};

const getImagePresignedUrl = async (data) => {
  const key = resolveImageKey(data);
  return await getImagePresignedUrlByKey(key);
};

const deleteFileFromS3ByKey = async (key) => {
  if (!key || key.startsWith("http")) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
};

const uploadFileToS3 = async (file) => {
  if (!checkValidImageExtensionFile(file)) {
    throw new Error("Định dạng file không hợp lệ! Chỉ chấp nhận ảnh JPG/PNG.");
  }
  const imageName = randomImageName();
  const buffer = await sharp(file.buffer)
    .resize({ height: 500, width: 500, fit: "contain" })
    .toBuffer();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: imageName,
      Body: buffer,
      ContentType: file.mimetype,
    }),
  );
  return imageName;
};

const deleteOldAndInsertNewImageInS3 = async (data, file) => {
  const oldKey = resolveImageKey(data);
  if (oldKey) await deleteFileFromS3ByKey(oldKey);
  return await uploadFileToS3(file);
};

module.exports = {
  getImagePresignedUrl,
  getImagePresignedUrlByKey,
  deleteOldAndInsertNewImageInS3,
  uploadFileToS3,
  deleteFileFromS3ByKey,
};
