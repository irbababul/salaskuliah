const { getDriveClient } = require('./google-auth')
const { appendRow, findByField, findOneByField } = require('./sheets')

/**
 * Cari folder di Drive berdasarkan nama dan parent folder ID.
 */
async function findFolder(name, parentId) {
  const drive = await getDriveClient()
  const escaped = name.replace(/'/g, "\\'")
  const query = parentId
    ? `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const res = await drive.files.list({
    q: query,
    fields: 'files(id,name)',
    pageSize: 5,
  })
  return res.data.files?.[0]?.id || null
}

/**
 * Buat subfolder di dalam parentId.
 * Return Drive folder ID yang baru dibuat.
 */
async function createFolder(name, parentId) {
  const drive = await getDriveClient()
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id,name',
  })
  return res.data.id
}

/**
 * Ambil folder ID root SALASKULIAH dari env var.
 */
function getRootFolderId() {
  const id = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  if (!id) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID not set')
  return id
}

/**
 * Cari drive_folder_id untuk semester dari sheet drive_folders.
 */
async function getSemesterDriveFolderId(semesterNum) {
  const row = await findOneByField('drive_folders', 'id', `df_sem${semesterNum}`)
  return row ? row.drive_folder_id : null
}

/**
 * Scan semua folder Semester di dalam root folder.
 */
async function scanSemesterFolders() {
  const drive = await getDriveClient()
  const rootId = getRootFolderId()

  const res = await drive.files.list({
    q: `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
    orderBy: 'name',
  })

  return (res.data.files || []).map(f => ({
    name: f.name,
    folderId: f.id,
    parentId: rootId,
    type: 'semester',
  }))
}

/**
 * Scan semua folder Mata Kuliah dalam satu folder Semester.
 */
async function scanCourseFolders(semesterFolderId) {
  const drive = await getDriveClient()

  const res = await drive.files.list({
    q: `'${semesterFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)',
    orderBy: 'name',
  })

  return (res.data.files || []).map(f => ({
    name: f.name,
    folderId: f.id,
    parentId: semesterFolderId,
    type: 'course',
  }))
}

/**
 * List semua file dalam sebuah folder Drive.
 */
async function listFilesInFolder(folderId) {
  const drive = await getDriveClient()

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name,mimeType,size,webViewLink,createdTime,modifiedTime)',
    orderBy: 'name',
  })

  return res.data.files || []
}

/**
 * Upload file ke folder Drive tertentu.
 */
async function uploadFile({ name, mimeType, buffer, folderId }) {
  const drive = await getDriveClient()
  const { Readable } = require('stream')

  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id,name,mimeType,size,webViewLink',
  })

  return res.data
}

/**
 * Hapus file dari Drive.
 */
async function deleteFile(driveFileId) {
  const drive = await getDriveClient()
  await drive.files.delete({ fileId: driveFileId })
}

/**
 * Dapatkan metadata file dari Drive.
 */
async function getFileMetadata(driveFileId) {
  const drive = await getDriveClient()
  const res = await drive.files.get({
    fileId: driveFileId,
    fields: 'id,name,mimeType,size,webViewLink,modifiedTime',
  })
  return res.data
}

/**
 * Stream file dari Drive untuk proxy ke browser.
 */
async function streamFile(driveFileId) {
  const drive = await getDriveClient()
  const res = await drive.files.get(
    { fileId: driveFileId, alt: 'media' },
    { responseType: 'stream' }
  )
  return res.data
}

/**
 * Scan dan sinkronisasi struktur folder Drive ke Sheets.
 */
async function syncFolderStructure() {
  const results = { semesters: 0, courses: 0 }
  const semesterFolders = await scanSemesterFolders()

  for (const sem of semesterFolders) {
    const existing = await findOneByField('drive_folders', 'drive_folder_id', sem.folderId)
    if (!existing) {
      await appendRow('drive_folders', {
        id: 'df_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        drive_folder_id: sem.folderId,
        folder_name: sem.name,
        parent_folder_id: sem.parentId,
        semester_id: '',
        course_id: '',
        folder_type: 'semester',
        created_at: new Date().toISOString(),
      })
      results.semesters++
    }

    const courseFolders = await scanCourseFolders(sem.folderId)
    for (const course of courseFolders) {
      const existingCourse = await findOneByField('drive_folders', 'drive_folder_id', course.folderId)
      if (!existingCourse) {
        await appendRow('drive_folders', {
          id: 'df_' + Date.now() + '_' + Math.random().toString(36).slice(2),
          drive_folder_id: course.folderId,
          folder_name: course.name,
          parent_folder_id: course.parentId,
          semester_id: '',
          course_id: '',
          folder_type: 'course',
          created_at: new Date().toISOString(),
        })
        results.courses++
      }
    }
  }

  return results
}

module.exports = {
  findFolder,
  createFolder,
  getRootFolderId,
  getSemesterDriveFolderId,
  scanSemesterFolders,
  scanCourseFolders,
  listFilesInFolder,
  uploadFile,
  deleteFile,
  getFileMetadata,
  streamFile,
  syncFolderStructure,
}
