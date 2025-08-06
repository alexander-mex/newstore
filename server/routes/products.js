const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const Product = require("../models/Product");
const Category = require("../models/Category");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../Uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const parseJSONFields = (data) => {
  const jsonFields = ["name", "description", "detailedDescription", "features", "countryOfOrigin", "subcategory", "colors"];
  const parsed = { ...data };
  jsonFields.forEach((field) => {
    if (parsed[field] && typeof parsed[field] === "string") {
      try {
        parsed[field] = JSON.parse(parsed[field]);
        if (field === "features" && parsed[field]?.isNewPrice !== undefined) {
          parsed[field].isNewPrice = Boolean(parsed[field].isNewPrice);
        }
      } catch (e) {
        console.warn(`Failed to parse ${field}:`, e);
      }
    }
  });
  return parsed;
};

router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
});

router.post("/categories", upload.single("image"), async (req, res) => {
  try {
    const { name, category } = req.body;
    const image = req.file ? `/Uploads/${req.file.filename}` : "/placeholder.png";

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const link = `/products?category=${encodeURIComponent(category)}`;

    const newCategory = new Category({
      name: JSON.parse(name),
      image,
      link,
      category,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(400).json({ message: err.message });
  }
});

router.put("/categories/:id", upload.single("image"), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, link } = req.body;
    let image = req.file ? `/Uploads/${req.file.filename}` : undefined;

    if (!image && req.body.image) {
      image = req.body.image;
    }

    let parsedName;
    if (typeof name === "string") {
      try {
        parsedName = JSON.parse(name);
      } catch (e) {
        return res.status(400).json({ message: "Invalid name format", error: e.message });
      }
    } else {
      parsedName = name;
    }

    if (!parsedName?.uk || !parsedName?.en) {
      return res.status(400).json({ message: "Name must include both uk and en fields" });
    }

    const updatedData = {
      name: parsedName,
      ...(link && { link }),
      ...(image !== undefined && { image }),
    };

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(updatedCategory);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/filters", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};

    const categories = await Product.distinct("category", query);
    const subcategories = await Product.distinct("subcategory", query);
    const brands = await Product.distinct("brand", query);
    const materials = await Product.distinct("features.material", query);
    const countries = await Product.distinct("countryOfOrigin", query);
    const colors = await Product.distinct("colors", query);
    const seasons = await Product.distinct("season", query);

    res.json({
      categories: categories.filter((cat) => ["clothing", "footwear", "bags", "accessories"].includes(cat)),
      subcategories: subcategories
        .filter((subcategory) => subcategory && (subcategory.uk || subcategory.en))
        .map((subcategory) => ({
          uk: subcategory.uk || "",
          en: subcategory.en || "",
        })),
      brands: brands.filter((brand) => brand),
      colors: colors
        .filter((color) => color && (color.uk || color.en))
        .map((color) => ({
          uk: color.uk || "",
          en: color.en || "",
        })),
      materials: materials
        .filter((material) => material && (material.uk || material.en))
        .map((material) => ({
          uk: material.uk || "",
          en: material.en || "",
        })),
      countries: countries
        .filter((country) => country && (country.uk || country.en))
        .map((country) => ({
          uk: country.uk || "",
          en: country.en || "",
        })),
      seasons: seasons.filter((season) => ["winter", "summer", "demiseason", "allseason"].includes(season)),
    });
  } catch (err) {
    console.error("Error fetching filters:", err);
    res.status(500).json({ message: "Failed to fetch filters" });
  }
});

router.get('/', async (req, res) => {
  try {
    let query = {};
    let sortOption = {};

    const {
      category,
      subcategory,
      brand,
      colors,
      sizes,
      material,
      country,
      minPrice,
      maxPrice,
      isNewPrice,
      isSale,
      page = 1,
      limit = 10,
      sort,
      language = "en",
    } = req.query;

    // Define sorting parameters
    switch (sort) {
      case 'price-asc':
        sortOption = { newPrice: 1 };
        break;
      case 'price-desc':
        sortOption = { newPrice: -1 };
        break;
      case 'name-asc':
        sortOption = { [`name.${language}`]: 1 };
        break;
      case 'name-desc':
        sortOption = { [`name.${language}`]: -1 };
        break;
      default:
        sortOption = { rating: -1 };
    }

    if (category) query.category = category;
    if (subcategory) {
      try {
        const parsedSubcategory = JSON.parse(subcategory);
        query.$or = [
          { 'subcategory.uk': parsedSubcategory.uk },
          { 'subcategory.en': parsedSubcategory.en }
        ];
      } catch (e) {
        console.error('Error parsing subcategory:', e);
        return res.status(400).json({ message: 'Invalid subcategory format' });
      }
    }
    if (brand) query.brand = brand;
    if (material) query['features.material.en'] = material;
    if (country) query['countryOfOrigin.en'] = country;
    if (colors) query['colors.en'] = colors;
    if (sizes) query.sizes = sizes;
    if (minPrice || maxPrice) {
      query.newPrice = {};
      if (minPrice) query.newPrice.$gte = Number(minPrice);
      if (maxPrice) query.newPrice.$lte = Number(maxPrice);
    }
    if (isNewPrice === 'true') {
      query['features.isNewPrice'] = true;
    }
    if (isSale === 'true') {
      query['features.isSale'] = true;
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products,
      currentPage: Number(page),
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = {
      $or: [
        { 'name.uk': { $regex: query, $options: 'i' } },
        { 'name.en': { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { 'subcategory.uk': { $regex: query, $options: 'i' } },
        { 'subcategory.en': { $regex: query, $options: 'i' } },
      ],
    };

    const products = await Product.find(searchQuery);

    if (!products.length) {
      return res.status(404).json({ message: 'No products found matching the query' });
    }

    res.json(products);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    console.log("Received POST /api/products request:", {
      body: req.body,
      files: req.files?.map((f) => f.filename) || [],
    });

    const parsedData = parseJSONFields(req.body);
    const {
      name,
      description,
      detailedDescription,
      oldPrice,
      newPrice,
      category,
      subcategory,
      accessoriesType,
      footwearType,
      clothingType,
      hatsType,
      sizes,
      colors,
      brand,
      season,
      gender,
      features,
      countryOfOrigin,
    } = parsedData;

    console.log("Parsed data:", parsedData);

    if (!name?.uk || !name?.en) {
      return res.status(400).json({
        message: "Name is required in both languages",
        details: {
          name_uk: !name?.uk ? "Ukrainian name is required" : null,
          name_en: !name?.en ? "English name is required" : null,
          received_name: name,
        },
      });
    }

    if (newPrice === undefined || !category || !brand) {
      return res.status(400).json({
        message: "All required fields must be filled",
        details: {
          newPrice: newPrice === undefined ? "Price is required" : null,
          category: !category ? "Category is required" : null,
          brand: !brand ? "Brand is required" : null,
        },
      });
    }

    const images = req.files?.map((file) => `/Uploads/${file.filename}`) || [];

    const newProduct = new Product({
      name,
      description: description || { uk: "", en: "" },
      detailedDescription: detailedDescription || { uk: "", en: "" },
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      newPrice: Number(newPrice),
      images,
      category,
      subcategory: subcategory || { uk: "", en: "" },
      accessoriesType: category === "accessories" ? accessoriesType : undefined,
      footwearType: category === "footwear" ? footwearType : undefined,
      clothingType: category === "clothing" ? clothingType : undefined,
      hatsType: category === "hats" ? hatsType : undefined,
      sizes: sizes || "",
      colors: colors || { uk: "", en: "" },
      brand,
      season: season || undefined,
      gender: gender || undefined,
      features: {
        material: features?.material || { uk: "", en: "" },
        waterproof: Boolean(features?.waterproof),
        warranty: features?.warranty ? Number(features.warranty) : undefined,
        isNewPrice: features?.isNewPrice !== undefined ? Boolean(features.isNewPrice) : false,
        isSale: oldPrice ? true : Boolean(features?.isSale), // Встановлюємо isSale, якщо є oldPrice
      },
      countryOfOrigin: countryOfOrigin || { uk: "", en: "" },
    });

    const saved = await newProduct.save();
    console.log("Saved product:", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(400).json({
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const productId = req.params.id;
    const parsedData = parseJSONFields(req.body);

    if (req.files && req.files.length > 0) {
      parsedData.images = req.files.map((file) => `/Uploads/${file.filename}`);
    }

    // Remove reviews field if present
    delete parsedData.reviews;

    const cleanData = Object.fromEntries(
      Object.entries(parsedData).filter(([_, v]) => v !== undefined)
    );

    if (cleanData.features) {
      cleanData.features.isNewPrice = cleanData.features.isNewPrice !== undefined ? Boolean(cleanData.features.isNewPrice) : false;
      cleanData.features.isSale = cleanData.oldPrice ? true : Boolean(cleanData.features?.isSale || false);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: cleanData }, // Use $set to avoid overwriting entire fields
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Server error",
      details: error.message,
    });
  }
});

// Add a review to a product
router.post("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, text, rating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid product or user ID" });
    }

    if (!text?.trim() || !rating) {
      return res.status(400).json({ 
        message: "Review text and rating are required",
        details: {
          text: !text?.trim() ? "Text is required" : null,
          rating: !rating ? "Rating is required" : null
        }
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.reviews) {
      product.reviews = [];
    }

    const newReview = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      text: text.trim(),
      rating: Number(rating),
      createdAt: new Date()
    };

    product.reviews.push(newReview);
    product.rating = calculateAverageRating(product.reviews);

    const updatedProduct = await product.save();
    res.status(201).json(updatedProduct);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
});

function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return sum / reviews.length;
}

router.put("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { text, rating } = req.body;

    if (!text || !rating) {
      return res.status(400).json({ message: "Review text and rating are required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.reviews || !Array.isArray(product.reviews)) {
      return res.status(404).json({ message: "No reviews found" });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.text = text;
    review.rating = Number(rating);
    review.updatedAt = new Date();

    product.rating = calculateAverageRating(product.reviews);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a review
router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const { id, reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid product or review ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.reviews || !Array.isArray(product.reviews)) {
      return res.status(404).json({ message: "No reviews found for this product" });
    }

    const reviewIndex = product.reviews.findIndex(
      review => review._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" });
    }

    product.reviews.splice(reviewIndex, 1);
    product.rating = calculateAverageRating(product.reviews);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
});

module.exports = router;