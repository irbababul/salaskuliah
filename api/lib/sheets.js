const { getSheetsClient } = require('./google-auth.js')

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID

// ── Sheet names ───────────────────────────────────────────────
const SHEETS = {
  SEMESTERS:             'semesters',
  COURSES:               'courses',
  MATERIALS:             'materials',
  MATERIAL_ATTACHMENTS:  'material_attachments',
  ASSIGNMENTS:           'assignments',
  ASSIGNMENT_ATTACHMENTS:'assignment_attachments',
  NOTES:                 'notes',
  LITERATURE:            'literature',
  ANNOUNCEMENTS:         'announcements',
  DRIVE_FOLDERS:         'drive_folders',
}

// ── Column definitions per sheet ─────────────────────────────
const COLUMNS = {
  semesters:              ['id','name','academic_year','drive_folder_id','is_active','order_index','created_at','updated_at'],
  courses:                ['id','semester_id','name','code','credits','lecturer','description','drive_folder_id','is_active','created_at','updated_at','deleted_at'],
  materials:              ['id','course_id','title','description','order_index','is_published','tags','drive_view_url','mime_type','created_at','updated_at','deleted_at'],
  material_attachments:   ['id','material_id','drive_file_id','drive_file_name','drive_view_url','mime_type','size_bytes','created_at'],
  assignments:            ['id','course_id','title','description','due_date','assignment_type','is_published','tags','drive_view_url','mime_type','drive_folder_id','created_at','updated_at','deleted_at','status'],
  assignment_attachments: ['id','assignment_id','drive_file_id','drive_file_name','drive_view_url','mime_type','size_bytes','file_type','created_at'],
  notes:                  ['id','course_id','semester_id','title','content','tags','is_published','created_at','updated_at','deleted_at'],
  literature:             ['id','title','author','year','type','topic','summary','source_url','drive_file_id','drive_view_url','tags','is_published','created_at','updated_at','deleted_at'],
  announcements:          ['id','title','content','priority','is_published','published_at','expires_at','created_at','updated_at','deleted_at'],
  drive_folders:          ['id','drive_folder_id','folder_name','parent_folder_id','semester_id','course_id','folder_type','created_at'],
  reading_books:          ['id','title','author','category','status','totalPages','currentPage','startDate','targetDate','finishedDate','cover','rating','notes','publisher','year','createdAt','updatedAt'],
  reading_sessions:       ['id','bookId','date','startPage','endPage','pagesRead','duration','notes','createdAt'],
  reading_journals:       ['id','bookId','date','title','content','mood','tags','createdAt'],
  reading_goals:          ['id','yearlyTarget','dailyPages','startDate','endDate','updatedAt'],
  schedule_slots:         ['id','hari','type','mulai','selesai','catatan'],
  schedule_kuliah:        ['id','hari','nama','kode','mulai','selesai','ruang'],
}

// ── Helper: baris header → object ────────────────────────────
function rowToObject(headers, row) {
  const obj = {}
  headers.forEach((h, i) => { obj[h] = row[i] || '' })
  return obj
}

// ── Helper: object → baris ───────────────────────────────────
function objectToRow(headers, obj) {
  return headers.map(h => obj[h] !== undefined ? String(obj[h]) : '')
}

// ── Baca semua data dari sheet ────────────────────────────────
async function readSheet(sheetName) {
  const sheets = await getSheetsClient()
  const cols = COLUMNS[sheetName]
  if (!cols) throw new Error('Unknown sheet: ' + sheetName)

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName + '!A1:Z',
  })

  const rows = res.data.values || []
  if (rows.length <= 1) return []  // hanya header atau kosong

  const headers = rows[0]
  return rows.slice(1).map(row => rowToObject(headers, row))
}

// ── Append satu baris baru ────────────────────────────────────
async function appendRow(sheetName, obj) {
  const sheets = await getSheetsClient()
  const cols = COLUMNS[sheetName]
  const row = objectToRow(cols, obj)

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName + '!A1',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  })
}

// ── Update baris berdasarkan ID ───────────────────────────────
async function updateRowById(sheetName, id, updates) {
  const sheets = await getSheetsClient()
  const cols = COLUMNS[sheetName]

  // Baca semua data untuk cari index baris
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName + '!A1:Z',
  })

  const rows = res.data.values || []
  if (rows.length <= 1) throw new Error('Row not found: ' + id)

  const headers = rows[0]
  const idColIdx = headers.indexOf('id')
  const dataRows = rows.slice(1)
  const rowIdx = dataRows.findIndex(r => r[idColIdx] === id)

  if (rowIdx === -1) throw new Error('Row not found: ' + id)

  // Baris di sheet: +2 karena 1-indexed dan skip header
  const sheetRowNum = rowIdx + 2

  // Baca nilai lama, merge dengan updates
  const existing = rowToObject(headers, dataRows[rowIdx])
  const merged = { ...existing, ...updates, updated_at: new Date().toISOString() }
  const newRow = objectToRow(headers, merged)

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName + '!A' + sheetRowNum + ':Z' + sheetRowNum,
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] },
  })

  return merged
}

// ── Soft delete (set deleted_at) atau hapus baris ─────────────
async function deleteRowById(sheetName, id, softDelete = false) {
  const sheets = await getSheetsClient()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName + '!A1:Z',
  })

  const rows = res.data.values || []
  if (rows.length <= 1) throw new Error('Row not found: ' + id)

  const headers = rows[0]
  const idColIdx = headers.indexOf('id')
  const dataRows = rows.slice(1)
  const rowIdx = dataRows.findIndex(r => r[idColIdx] === id)
  if (rowIdx === -1) throw new Error('Row not found: ' + id)

  const sheetRowNum = rowIdx + 2

  if (softDelete) {
    // Tandai deleted_at
    await updateRowById(sheetName, id, { deleted_at: new Date().toISOString() })
  } else {
    // Hapus baris fisik
    const spreadsheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties',
    })
    const sheet = spreadsheetMeta.data.sheets.find(s => s.properties.title === sheetName)
    if (!sheet) throw new Error('Sheet not found: ' + sheetName)

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: sheetRowNum - 1,
              endIndex: sheetRowNum,
            },
          },
        }],
      },
    })
  }
}

// ── Cari baris berdasarkan field ──────────────────────────────
async function findByField(sheetName, field, value) {
  const rows = await readSheet(sheetName)
  return rows.filter(r => r[field] === value)
}

async function findOneByField(sheetName, field, value) {
  const rows = await readSheet(sheetName)
  return rows.find(r => r[field] === value) || null
}

// ── Setup: buat sheet jika belum ada ─────────────────────────
async function ensureSheets() {
  const sheets = await getSheetsClient()

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  })

  const existing = meta.data.sheets.map(s => s.properties.title)
  const toCreate = Object.values(SHEETS).filter(name => !existing.includes(name))

  if (toCreate.length === 0) {
    console.log('All sheets already exist')
    return { created: [], existing }
  }

  // Buat sheet yang belum ada
  const requests = toCreate.map(title => ({
    addSheet: { properties: { title } },
  }))

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests },
  })

  // Tambahkan header row ke setiap sheet baru
  const headerUpdates = toCreate.map(sheetName => ({
    range: sheetName + '!A1:Z1',
    values: [COLUMNS[sheetName] || ['id','created_at','updated_at']],
  }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: headerUpdates,
    },
  })

  console.log('Created sheets:', toCreate)
  return { created: toCreate, existing }
}

module.exports = {
  SHEETS,
  COLUMNS,
  readSheet,
  appendRow,
  updateRowById,
  deleteRowById,
  findByField,
  findOneByField,
  ensureSheets,
  rowToObject,
  objectToRow,
}
