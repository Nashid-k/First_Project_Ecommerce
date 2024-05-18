const multer = require('multer');

// Define multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/products');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Define productsUpload middleware
const productsUpload = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'screenshots', maxCount: 4 }
]);

module.exports = productsUpload;