const mongoose = require("mongoose");
const Product = require("./src/models/product");
const Category = require("./src/models/category");
require("dotenv").config();

const images = {
  "Đồ ăn nhanh": [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
    "https://product.hstatic.net/200000282383/product/5_0afbe98e61404387aef10e1c2e762655_master.jpg",
  ],
  "Món Việt": [
    "https://cdn.tgdd.vn/Files/2022/01/25/1412805/cach-nau-pho-bo-nam-dinh-chuan-vi-thom-ngon-nhu-hang-quan-202201250313281452.jpg",
    "https://phunuvietnam.mediacdn.vn/179072216278405120/2021/5/7/image6487327-2-16203618558441663962871.jpg",
    "https://images.unsplash.com/photo-1635363638580-c2809d049eee?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&q=80&w=800",
  ],
  "Đồ uống": [
    "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1587888637140-849b25d80ef9?auto=format&fit=crop&q=80&w=800",
  ],
  "Tráng miệng": [
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800",
    "https://thanhnien.mediacdn.vn/Uploaded/minhnguyet/2016_01_19/bingsu-2_IFHH.jpg?width=500",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800",
  ],
};

const prefixes = {
  c1: [
    "Burger",
    "Pizza",
    "Gà rán",
    "Khoai tây chiên",
    "Hotdog",
    "Sandwich",
    "Taco",
    "Nachos",
  ],
  c2: [
    "Phở bò",
    "Bún chả",
    "Cơm tấm",
    "Bánh mì",
    "Gỏi cuốn",
    "Bánh xèo",
    "Bún bò Huế",
    "Hủ tiếu",
  ],
  c3: [
    "Trà sữa",
    "Cà phê",
    "Nước ép",
    "Sinh tố",
    "Soda",
    "Trà đào",
    "Matcha",
    "Americano",
  ],
  c4: [
    "Bánh ngọt",
    "Kem",
    "Chè",
    "Pudding",
    "Tiramisu",
    "Macaron",
    "Bánh Flan",
    "Trái cây",
  ],
};

const suffixes = {
  c1: [
    "phô mai",
    "cay",
    "đặc biệt",
    "BBQ",
    "size lớn",
    "Hàn Quốc",
    "giòn rụm",
    "thập cẩm",
  ],
  c2: [
    "truyền thống",
    "đặc biệt",
    "siêu ngon",
    "Hà Nội",
    "Sài Gòn",
    "chả giò",
    "tái nạm",
    "nhiều thịt",
  ],
  c3: [
    "trân châu",
    "thạch",
    "full topping",
    "ít đường",
    "đá xay",
    "kem cheese",
    "đường đen",
    "mát lạnh",
  ],
  c4: [
    "dâu tây",
    "sô cô la",
    "matcha",
    "vani",
    "nướng",
    "việt quất",
    "caramel",
    "tươi mát",
  ],
};

const categoryNames = {
  c1: "Đồ ăn nhanh",
  c2: "Món Việt",
  c3: "Đồ uống",
  c4: "Tráng miệng",
};

function generateSlug(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const seedData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Connected successfully!");

    // Clear old products
    await Product.deleteMany({});
    console.log("Deleted old products.");

    // Clear old categories
    await Category.deleteMany({});
    console.log("Deleted old categories.");

    // Seed categories
    const categories = [];
    for (const catId of Object.keys(categoryNames)) {
      categories.push({
        categoryId: catId,
        name: categoryNames[catId],
      });
    }
    await Category.insertMany(categories);
    console.log(`Generated ${categories.length} categories. Inserting...`);

    const products = [];

    // Generate 20 products for each category
    for (const catId of Object.keys(prefixes)) {
      const catName = categoryNames[catId];

      for (let i = 1; i <= 20; i++) {
        const prefixList = prefixes[catId];
        const suffixList = suffixes[catId];

        const prefix = prefixList[randomInt(0, prefixList.length - 1)];
        const suffix = suffixList[randomInt(0, suffixList.length - 1)];

        const name = `${prefix} ${suffix} ${i < 5 ? "Đặc biệt " + i : i < 10 ? "Mới " + i : "Ngon " + i}`;
        const price = randomInt(2, 15) * 10000;
        const hasDiscount = Math.random() > 0.5;
        const discountPrice = hasDiscount ? price - randomInt(1, 3) * 5000 : 0;
        const rating = Number((Math.random() * 2 + 3).toFixed(1));// kết quả từ 3.0 -> 5.0

        const imagesForProduct = [];
        const catImages = images[catName];
        imagesForProduct.push(catImages[randomInt(0, catImages.length - 1)]);
        imagesForProduct.push(catImages[randomInt(0, catImages.length - 1)]);

        products.push({
          name: name,
          slug: generateSlug(name),
          description: `Một phần ${name} cực kỳ hấp dẫn, nguyên liệu tươi ngon được chọn lọc kỹ càng. Đảm bảo mang đến trải nghiệm tuyệt vời cho bạn!`,
          price: price,
          discountPrice: discountPrice > 0 ? discountPrice : price,
          images: imagesForProduct,
          category: catId,
          stock: randomInt(10, 100),
          sold: randomInt(0, 500),
          rating: rating,
          isHot: Math.random() > 0.7,
          isNew: Math.random() > 0.7,
          promotion: Math.random() > 0.8 ? "Tặng kèm ly nước" : "",
        });
      }
    }

    console.log(`Generated ${products.length} products. Inserting...`);
    await Product.insertMany(products);

    console.log("Successfully seeded database with mock data!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedData();
