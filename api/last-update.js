const path = require('path')
const fs = require('fs')
const multer = require('multer')

// Carpeta uploads en filesystem montado
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

// Configuración Multer para dos campos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const base =
      file.fieldname === 'stock_cba' ? 'stock_cba' : 'stock_olavarria'
    cb(null, `${base}${ext}`)
  }
})
const upload = multer({ storage })

module.exports = (req, res) => {
  upload.fields([
    { name: 'stock_cba', maxCount: 1 },
    { name: 'stock_olavarria', maxCount: 1 }
  ])(req, res, err => {
    if (err) return res.status(500).send('Error al procesar archivos')
    const pwd = req.body.password
    if (pwd !== 'cuadrobonito11')
      return res.status(403).send('Contraseña inválida')
    if (!req.files.stock_cba || !req.files.stock_olavarria) {
      return res.status(400).send('Faltan ambos archivos')
    }
    // Eliminar otros
    const keep = [
      req.files.stock_cba[0].filename,
      req.files.stock_olavarria[0].filename
    ]
    fs.readdirSync(uploadsDir).forEach(f => {
      if (!keep.includes(f)) fs.unlinkSync(path.join(uploadsDir, f))
    })
    // Guardar timestamp
    const ts = new Date().toISOString()
    fs.writeFileSync(path.join(uploadsDir, 'last_update.txt'), ts)
    res.status(200).json({ updated: ts })
  })
}
