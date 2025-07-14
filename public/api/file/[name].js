const path = require('path')
const fs = require('fs')
module.exports = (req, res) => {
  const { name } = req.query
  const filePath = path.join(__dirname, '..', 'public', 'uploads', name)
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('No encontrado')
  }
  res.sendFile(filePath)
}
