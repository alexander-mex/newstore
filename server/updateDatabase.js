require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Content = require('./models/Content');
const fs = require('fs');
const path = require('path');

// Завантажуємо uploadedImages із файлу
const uploadedImages = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploadedImages.json')));

const updateDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Оновлення продуктів
    const products = await Product.find();
    let updatedProducts = 0;
    for (const product of products) {
      const updatedImages = product.images.map(imagePath => {
        const fileName = path.basename(imagePath);
        return uploadedImages[fileName] || imagePath;
      });
      if (updatedImages.some((img, idx) => img !== product.images[idx])) {
        product.images = updatedImages;
        await product.save();
        updatedProducts++;
        console.log(`Updated product ${product._id} with new images`);
      }
    }
    console.log(`Updated ${updatedProducts} products`);

    // Оновлення категорій
    const categories = await Category.find();
    let updatedCategories = 0;
    for (const category of categories) {
      const fileName = path.basename(category.image);
      const newImage = uploadedImages[fileName] || category.image;
      if (newImage !== category.image) {
        category.image = newImage;
        await category.save();
        updatedCategories++;
        console.log(`Updated category ${category._id} with new image`);
      }
    }
    console.log(`Updated ${updatedCategories} categories`);

    // Оновлення контенту
    const content = await Content.findOne();
    let updatedContent = false;
    if (content) {
      content.cards = content.cards.map(card => {
        const fileName = path.basename(card.image);
        return {
          ...card,
          image: uploadedImages[fileName] || card.image,
        };
      });
      content.moduleCards = content.moduleCards.map(card => {
        const fileName = path.basename(card.imgSrc);
        return {
          ...card,
          imgSrc: uploadedImages[fileName] || card.imgSrc,
        };
      });
      await content.save();
      updatedContent = true;
      console.log('Updated Content images');
    }
    console.log(`Content update: ${updatedContent ? 'successful' : 'no content found'}`);

    console.log('Database update completed');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    mongoose.connection.close();
  }
};

updateDatabase();