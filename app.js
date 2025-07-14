const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware para parsear formularios
app.use(express.urlencoded({ extended: true }))

// Directorio para archivos subidos
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)

// Archivo para registrar fecha de última actualización
const updateLog = path.join(__dirname, 'last_update.txt')

// Configuración de Multer para dos archivos: stock_cba y stock_olavarria
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    let base = file.fieldname === 'stock_cba' ? 'stock_cba' : 'stock_olavarria'
    cb(null, `${base}${ext}`)
  }
})
const upload = multer({ storage })

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(uploadsDir))

// Rutas front-end
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
)
app.get('/cond-comerciales', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'comercial.html'))
)
app.get('/stock', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'stock.html'))
)

// Endpoint POST /subir que recibe dos archivos y la contraseña
app.post(
  '/subir',
  upload.fields([
    { name: 'stock_cba', maxCount: 1 },
    { name: 'stock_olavarria', maxCount: 1 }
  ]),
  (req, res) => {
    const { password } = req.body
    if (password !== 'cuadrobonito11') {
      return res
        .status(403)
        .send('<p>Contraseña incorrecta. <a href="/subir.html">Volver</a></p>')
    }
    // Verificar que ambos archivos estén
    if (!req.files || !req.files.stock_cba || !req.files.stock_olavarria) {
      return res
        .status(400)
        .send(
          '<p>Debe subir ambos archivos. <a href="/subir.html">Volver</a></p>'
        )
    }

    // Eliminar archivos antiguos que no sean los dos subidos ahora
    const keep = [
      req.files.stock_cba[0].filename,
      req.files.stock_olavarria[0].filename
    ]
    fs.readdirSync(uploadsDir).forEach(file => {
      if (!keep.includes(file)) fs.unlinkSync(path.join(uploadsDir, file))
    })

    // Registrar timestamp de actualización
    const timestamp = new Date().toISOString()
    fs.writeFileSync(updateLog, timestamp, 'utf8')

    res.send(`
    <p>Archivos subidos:</p>
    <ul>
      <li>${req.files.stock_cba[0].filename}</li>
      <li>${req.files.stock_olavarria[0].filename}</li>
    </ul>
    <p>Fecha de actualización: ${timestamp}</p>
    <p><a href="/subir.html">Subir de nuevo</a> | <a href="/">Inicio</a></p>
  `)
  }
)

// Endpoint GET /last-update para recuperar la última actualización
app.get('/last-update', (req, res) => {
  if (!fs.existsSync(updateLog)) {
    return res
      .status(404)
      .json({ error: 'No se ha registrado ninguna actualización aún.' })
  }
  const data = fs.readFileSync(updateLog, 'utf8')
  res.json({ lastUpdate: data })
})

// Iniciar servidor
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
)
