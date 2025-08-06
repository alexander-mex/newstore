require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Налаштування Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Логування змінних середовища для дебагу
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '[REDACTED]' : undefined);

const uploadImageToCloudinary = (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { resource_type: 'image' }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
};

const uploadAllImages = async () => {
  const uploadPath = path.join(__dirname, './Uploads');
  console.log('Upload path:', uploadPath);
  const files = fs.readdirSync(uploadPath);
  console.log('Files in Uploads:', files);

  const uploadedImages = {};
  for (const file of files) {
    const filePath = path.join(uploadPath, file);
    try {
      const imageUrl = await uploadImageToCloudinary(filePath);
      uploadedImages[file] = imageUrl;
      console.log(`Uploaded ${file} to ${imageUrl}`);
    } catch (error) {
      console.error(`Error uploading ${file}:`, error);
    }
  }

  // Зберігаємо результат у файл
  fs.writeFileSync(
    path.join(__dirname, 'uploadedImages.json'),
    JSON.stringify(uploadedImages, null, 2)
  );
  console.log('Uploaded images saved to uploadedImages.json');

  return uploadedImages;
};

uploadAllImages()
  .then(uploadedImages => {
    console.log('All uploaded images:', uploadedImages);
  })
  .catch(err => {
    console.error('Error in upload process:', err);
  });