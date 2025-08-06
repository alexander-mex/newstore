const mongoose = require('mongoose');
const Product = require('./models/Product'); // Переконайтеся, що шлях правильний

async function cleanInvalidData() {
  try {
    await mongoose.connect('mongodb+srv://alexandermex:IMaKSmxnNV1viBaX@cluster0.cgy0ky9.mongodb.net/NewStore');
    console.log('MongoDB connected');

    const products = await Product.find();
    let updatedCount = 0;

    for (const product of products) {
      if (product.features && product.features.isNew !== undefined) {
        // Логуємо значення features.isNew для діагностики
        console.log(`Product ${product._id}: features.isNew =`, product.features.isNew);

        // Перевіряємо, чи features.isNew не є boolean
        if (typeof product.features.isNew !== 'boolean') {
          // Якщо значення є об’єктом або іншим некоректним типом, встановлюємо false
          product.features.isNew = false;
          await product.save();
          updatedCount++;
          console.log(`Updated product ${product._id}: set features.isNew to false`);
        }
      } else {
        // Якщо features.isNew відсутнє, встановлюємо за замовчуванням false
        if (!product.features) product.features = {};
        product.features.isNew = false;
        await product.save();
        updatedCount++;
        console.log(`Updated product ${product._id}: initialized features.isNew to false`);
      }
    }

    console.log(`Data cleanup completed. Updated ${updatedCount} products.`);
    mongoose.connection.close();
  } catch (err) {
    console.error('Error cleaning data:', err);
    mongoose.connection.close();
  }
}

cleanInvalidData();