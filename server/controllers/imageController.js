const path = require('path');
const multer = require('multer');
const fs = require('fs');


const uploadDir = path.join(__dirname, '../../client/public/uploads');


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image téléchargée.' });
    }
    
    res.status(201).json({
      message: 'Image téléchargée avec succès.',
      filename: req.file.filename,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du téléchargement de l\'image.' });
  }
};

module.exports = {
  upload,
  uploadImage,
};
