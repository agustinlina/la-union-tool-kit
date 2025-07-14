document.addEventListener('DOMContentLoaded', () => {
  const updateSpan = document.getElementById('lastUpdate')
  const tableBody = document.getElementById('stockBody')
  const filterSelect = document.getElementById('filterSelect')
  const fileSelect = document.getElementById('fileSelect')
  const searchInput = document.getElementById('searchInput')

  // 1. Mostrar fecha de última actualización
  fetch('/last-update')
    .then(res => (res.ok ? res.json() : Promise.reject()))
    .then(data => {
      const d = new Date(data.lastUpdate)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      updateSpan.textContent = `${day}/${month}/${year} ${hours}:${minutes}`
    })
    .catch(() => (updateSpan.textContent = 'Desconocida'))

  // 2. Función para cargar y procesar Excel
  function loadExcel () {
    const selectedFile = `./uploads/${fileSelect.value}`
    tableBody.innerHTML = ''

    fetch(selectedFile)
      .then(res => res.arrayBuffer())
      .then(ab => {
        const data = new Uint8Array(ab)
        const wb = XLSX.read(data, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const range = XLSX.utils.decode_range(sheet['!ref'])
        const startRow = 10

        for (let r = startRow; r <= range.e.r + 1; r++) {
          const descCell = sheet['C' + r]
          const rubroCell = sheet['F' + r]
          const qtyCell = sheet['H' + r]

          if (!descCell || !descCell.v || !rubroCell || !rubroCell.v) continue

          const description = descCell.v.toString()
          const rubro = rubroCell.v.toString().toUpperCase()
          const quantity = qtyCell ? qtyCell.v : ''

          const tr = document.createElement('tr')
          tr.dataset.rubro = rubro

          const tdDesc = document.createElement('td')
          tdDesc.textContent = description
          const tdQty = document.createElement('td')
          tdQty.textContent = quantity

          tr.append(tdDesc, tdQty)
          tableBody.appendChild(tr)
        }

        applyFilter()
      })
      .catch(err => {
        console.error('Error leyendo el Excel:', err)
        updateSpan.textContent = 'Error al cargar'
      })
  }

  // 3. Filtrado según rubro y búsqueda
  function applyFilter () {
    const filter = filterSelect.value.toLowerCase()
    const search = searchInput.value.trim().toLowerCase()

    document.querySelectorAll('#stockBody tr').forEach(tr => {
      const rubro = tr.dataset.rubro.toLowerCase()
      const desc = tr.cells[0].textContent.toLowerCase()
      let show = true

      // Filtro de rubro
      if (filter === 'cubierta_china') {
        show = rubro === 'tercelo' || rubro.startsWith('royal')
      } else if (filter === 'camion_chino') {
        show = rubro === 'direccion' || rubro === 'traccion'
      }
      // Filtro de búsqueda
      if (show && search) {
        show = desc.includes(search)
      }

      tr.style.display = show ? '' : 'none'
    })
  }

  // 4. Eventos de cambio
  fileSelect.addEventListener('change', loadExcel)
  filterSelect.addEventListener('change', applyFilter)
  searchInput.addEventListener('input', applyFilter)

  // Carga inicial
  loadExcel()
})
