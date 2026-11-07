/**
 * api/admin.js
 * Handles all admin CRUD endpoints:
 * /api/admin/semesters, courses, materials, assignments, notes, literature, announcements
 */
const { readSheet, appendRow, updateRowById, deleteRowById, findOneByField, findByField } = require('./lib/sheets.js')
const { createFolder, getRootFolderId } = require('./lib/drive.js')
const { requireAdmin, setCorsHeaders, sendJson, sendError } = require('./lib/auth.js')
const { uid, now } = require('./lib/utils.js')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!requireAdmin(req, res)) return

  // Parse action - handle both /api/admin/upload and /upload
  const urlPath = (req.url || req.path || '').split('?')[0]
  const segments = urlPath.split('/').filter(s => s.length > 0)
  // action is always the last non-empty segment
  const action = segments[segments.length - 1] || ''
  console.log('[admin] url:', req.url, '| action:', action)
  const q = req.query || {}
  const body = req.body || {}

  try {
    // ── semesters ──────────────────────────────────────────────
    if (action === 'semesters') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { success: true, data: await readSheet('semesters') })
      }
      if (req.method === 'POST') {
        const { name, academic_year, is_active, order_index } = body
        if (!name) return sendError(res, 400, 'name diperlukan')
        let driveFolderId = ''
        try {
          const rootId = getRootFolderId()
          const semNum = name.match(/\d+/)?.[0]
          const existing = semNum ? await findOneByField('drive_folders', 'id', `df_sem${semNum}`) : null
          if (existing) {
            driveFolderId = existing.drive_folder_id
          } else {
            driveFolderId = await createFolder(name.toUpperCase(), rootId)
            await appendRow('drive_folders', {
              id: semNum ? `df_sem${semNum}` : uid('df'),
              drive_folder_id: driveFolderId, folder_name: name.toUpperCase(),
              parent_folder_id: rootId, semester_id: '', course_id: '',
              folder_type: 'semester', created_at: now(),
            })
          }
        } catch (e) { console.warn('Drive folder skip:', e.message) }
        const semId = uid('sem')
        const record = { id: semId, name: name.trim(), academic_year: academic_year || '',
          drive_folder_id: driveFolderId, is_active: String(is_active ?? 'true'),
          order_index: String(order_index || 0), created_at: now(), updated_at: now() }
        await appendRow('semesters', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        return sendJson(res, 200, { success: true, data: await updateRowById('semesters', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('semesters', id, false)
        return sendJson(res, 200, { success: true, message: 'Semester dihapus' })
      }
    }

    // ── courses ────────────────────────────────────────────────
    if (action === 'courses') {
      if (req.method === 'GET') {
        let data = await readSheet('courses')
        if (q.semester_id) data = data.filter(r => r.semester_id === q.semester_id)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'POST') {
        const { semester_id, name, code, credits, lecturer, description } = body
        if (!semester_id || !name) return sendError(res, 400, 'semester_id dan name diperlukan')
        let driveFolderId = ''
        try {
          const semester = await findOneByField('semesters', 'id', semester_id)
          if (semester?.drive_folder_id) {
            const folderName = code ? `${code} - ${name}` : name
            driveFolderId = await createFolder(folderName.toUpperCase(), semester.drive_folder_id)
            await appendRow('drive_folders', {
              id: uid('df'), drive_folder_id: driveFolderId,
              folder_name: folderName.toUpperCase(), parent_folder_id: semester.drive_folder_id,
              semester_id, course_id: '', folder_type: 'course', created_at: now(),
            })
          }
        } catch (e) { console.warn('Drive folder skip:', e.message) }
        const record = { id: uid('crs'), semester_id, name: name.trim(), code: code || '',
          credits: String(credits || 3), lecturer: lecturer || '', description: description || '',
          drive_folder_id: driveFolderId, is_active: 'true', created_at: now(), updated_at: now() }
        await appendRow('courses', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        return sendJson(res, 200, { success: true, data: await updateRowById('courses', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('courses', id, false)
        return sendJson(res, 200, { success: true, message: 'Mata kuliah dihapus' })
      }
    }

    // ── materials ──────────────────────────────────────────────
    if (action === 'materials') {
      if (req.method === 'GET') {
        let data = await readSheet('materials')
        if (q.course_id) data = data.filter(r => r.course_id === q.course_id)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'POST') {
        const { course_id, title, description, order_index, tags } = body
        if (!course_id || !title) return sendError(res, 400, 'course_id dan title diperlukan')
        const record = { id: uid('mat'), course_id, title: title.trim(), description: description || '',
          order_index: String(order_index || 0), is_published: 'false',
          tags: Array.isArray(tags) ? tags.join(',') : (tags || ''), created_at: now(), updated_at: now() }
        await appendRow('materials', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        if (Array.isArray(updates.tags)) updates.tags = updates.tags.join(',')
        return sendJson(res, 200, { success: true, data: await updateRowById('materials', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        // Cari material dulu untuk dapat drive_file_id
        try {
          await deleteRowById('materials', id, true)
          return sendJson(res, 200, { success: true, message: 'Materi dihapus' })
        } catch(delErr) {
          console.error('[DELETE materials] error:', delErr.message)
          return sendError(res, 500, delErr.message)
        }
      }
    }

    // ── assignments ────────────────────────────────────────────
    if (action === 'assignments') {
      if (req.method === 'GET') {
        let data = await readSheet('assignments')
        if (q.course_id) data = data.filter(r => r.course_id === q.course_id)
        data = data.filter(r => !r.deleted_at)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'POST') {
        const { course_id, title, description, due_date, assignment_type, tags } = body
        if (!course_id || !title) return sendError(res, 400, 'course_id dan title diperlukan')
        // Buat subfolder 'Tugas' di dalam folder mata kuliah
        let driveFolderId = ''
        try {
          const course = await findOneByField('courses', 'id', course_id)
          if (course?.drive_folder_id) {
            // Cek apakah subfolder Tugas sudah ada
            const existingTugasFolder = await findOneByField('drive_folders', 'folder_name', 'TUGAS')
            const parentMatch = existingTugasFolder?.parent_folder_id === course.drive_folder_id
            if (parentMatch) {
              driveFolderId = existingTugasFolder.drive_folder_id
            } else {
              driveFolderId = await createFolder('TUGAS', course.drive_folder_id)
              await appendRow('drive_folders', { id: uid('df'), drive_folder_id: driveFolderId,
                folder_name: 'TUGAS', parent_folder_id: course.drive_folder_id,
                semester_id: '', course_id, folder_type: 'tugas', created_at: now() })
            }
          }
        } catch(e) { console.warn('Drive tugas folder skip:', e.message) }
        const record = { id: uid('asg'), course_id, title: title.trim(), description: description || '',
          due_date: due_date || '', assignment_type: assignment_type || 'individual', is_published: 'true',
          tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
          drive_folder_id: driveFolderId, created_at: now(), updated_at: now() }
        await appendRow('assignments', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        if (Array.isArray(updates.tags)) updates.tags = updates.tags.join(',')
        return sendJson(res, 200, { success: true, data: await updateRowById('assignments', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('assignments', id, true)
        return sendJson(res, 200, { success: true, message: 'Tugas dihapus' })
      }
    }

    // ── notes ──────────────────────────────────────────────────
    if (action === 'notes') {
      if (req.method === 'GET') {
        let data = await readSheet('notes')
        if (q.course_id) data = data.filter(r => r.course_id === q.course_id)
        if (q.semester_id) data = data.filter(r => r.semester_id === q.semester_id)
        data = data.filter(r => !r.deleted_at)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'POST') {
        const { course_id, semester_id, title, content, tags } = body
        if (!title) return sendError(res, 400, 'title diperlukan')
        const record = { id: uid('nte'), course_id: course_id || '', semester_id: semester_id || '',
          title: title.trim(), content: content || '',
          tags: Array.isArray(tags) ? tags.join(',') : (tags || ''), is_published: 'true',
          created_at: now(), updated_at: now() }
        await appendRow('notes', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        if (Array.isArray(updates.tags)) updates.tags = updates.tags.join(',')
        return sendJson(res, 200, { success: true, data: await updateRowById('notes', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('notes', id, true)
        return sendJson(res, 200, { success: true, message: 'Catatan dihapus' })
      }
    }

    // ── literature ─────────────────────────────────────────────
    if (action === 'literature') {
      if (req.method === 'GET') {
        let data = await readSheet('literature')
        if (q.type) data = data.filter(r => r.type === q.type)
        data = data.filter(r => !r.deleted_at)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'POST') {
        const { title, author, year, type, topic, summary, source_url, drive_file_id, drive_view_url, tags } = body
        if (!title) return sendError(res, 400, 'title diperlukan')
        const record = { id: uid('lit'), title: title.trim(), author: author || '', year: String(year || ''),
          type: type || 'article', topic: topic || '', summary: summary || '',
          source_url: source_url || '', drive_file_id: drive_file_id || '', drive_view_url: drive_view_url || '',
          tags: Array.isArray(tags) ? tags.join(',') : (tags || ''), is_published: 'true',
          created_at: now(), updated_at: now() }
        await appendRow('literature', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        if (Array.isArray(updates.tags)) updates.tags = updates.tags.join(',')
        return sendJson(res, 200, { success: true, data: await updateRowById('literature', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('literature', id, true)
        return sendJson(res, 200, { success: true, message: 'Literasi dihapus' })
      }
    }

    // ── announcements ──────────────────────────────────────────
    if (action === 'announcements') {
      if (req.method === 'GET') {
        let data = await readSheet('announcements')
        data = data.filter(r => !r.deleted_at)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'POST') {
        const { title, content, priority, expires_at } = body
        if (!title || !content) return sendError(res, 400, 'title dan content diperlukan')
        const ts = now()
        const record = { id: uid('ann'), title: title.trim(), content: content.trim(),
          priority: priority || 'normal', is_published: 'true', published_at: ts,
          expires_at: expires_at || '', created_at: ts, updated_at: ts }
        await appendRow('announcements', record)
        return sendJson(res, 201, { success: true, data: record })
      }
      if (req.method === 'PUT') {
        const { id, ...updates } = body
        if (!id) return sendError(res, 400, 'id diperlukan')
        return sendJson(res, 200, { success: true, data: await updateRowById('announcements', id, updates) })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('announcements', id, true)
        return sendJson(res, 200, { success: true, message: 'Pengumuman dihapus' })
      }
    }


    // ─── upload ────────────────────────────────────────────────
    if (action === 'upload') {
      if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed')
      const { material_id, assignment_id, file_name, mime_type, file_data, folder_drive_id, drive_file_id, drive_view_url, file_type } = body
      if (!file_name) return sendError(res, 400, 'file_name diperlukan')
      if (!material_id && !assignment_id) return sendError(res, 400, 'material_id atau assignment_id diperlukan')

      // Jika file_data ada (metode lama), upload via backend
      if (file_data) {
        let targetFolderId = folder_drive_id
        if (!targetFolderId && material_id) {
          try {
            const mat = await findOneByField('materials', 'id', material_id)
            if (mat?.course_id) {
              const course = await findOneByField('courses', 'id', mat.course_id)
              if (course?.drive_folder_id) targetFolderId = course.drive_folder_id
            }
          } catch(e) { console.warn('folder lookup skip:', e.message) }
        }
        if (!targetFolderId) return sendError(res, 400, 'folder_drive_id tidak ditemukan')

        const { uploadFile } = require('./lib/drive.js')
        const buffer = Buffer.from(file_data, 'base64')
        const driveFile = await uploadFile({ name: file_name, mimeType: mime_type || 'application/octet-stream', buffer, folderId: targetFolderId })

        if (material_id) {
          const att = { id: uid('matt'), material_id, drive_file_id: driveFile.id, drive_file_name: driveFile.name, drive_view_url: driveFile.webViewLink || '', mime_type: driveFile.mimeType, size_bytes: String(buffer.length), created_at: now() }
          await appendRow('material_attachments', att)
          await updateRowById('materials', material_id, { drive_view_url: driveFile.webViewLink || '', mime_type: driveFile.mimeType, is_published: 'true' })
          return sendJson(res, 201, { success: true, data: att })
        }
        return sendJson(res, 201, { success: true, data: { drive_file_id: driveFile.id } })
      } else {
        // Metode baru: client sudah upload ke Drive, simpan metadata saja
        if (!drive_file_id) return sendError(res, 400, 'drive_file_id diperlukan')
        if (material_id) {
          const att = { id: uid('matt'), material_id, drive_file_id, drive_file_name: file_name, drive_view_url: drive_view_url || '', mime_type: mime_type || '', size_bytes: '', created_at: now() }
          await appendRow('material_attachments', att)
          await updateRowById('materials', material_id, { drive_view_url: drive_view_url || '', mime_type: mime_type || '', is_published: 'true' })
          return sendJson(res, 201, { success: true, data: att })
        }
        if (assignment_id) {
          const att = { id: uid('asga'), assignment_id, drive_file_id, drive_file_name: file_name, drive_view_url: drive_view_url || '', mime_type: mime_type || '', size_bytes: '', file_type: file_type || 'lainnya', created_at: now() }
          await appendRow('assignment_attachments', att)
          await updateRowById('assignments', assignment_id, { drive_view_url: drive_view_url || '', mime_type: mime_type || '', is_published: 'true' })
          return sendJson(res, 201, { success: true, data: att })
        }
        return sendJson(res, 201, { success: true, data: { drive_file_id } })
      }
    }
    // ── assignment_attachments ─────────────────────────────────
    if (action === 'assignment-attachments') {
      if (req.method === 'GET') {
        let data = await readSheet('assignment_attachments')
        if (q.assignment_id) data = data.filter(r => r.assignment_id === q.assignment_id)
        return sendJson(res, 200, { success: true, data })
      }
      if (req.method === 'DELETE') {
        const id = q.id || body.id
        if (!id) return sendError(res, 400, 'id diperlukan')
        await deleteRowById('assignment_attachments', id, false)
        return sendJson(res, 200, { success: true, message: 'File dihapus' })
      }
    }

    // ?? reading_books ??????????????????????????????????????????
    if (action === 'reading-books') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { success:true, data: await readSheet('reading_books') })
      }
      if (req.method === 'POST') {
        const b = body; if (!b.id) b.id = uid('rb'); b.createdAt = b.createdAt||now(); b.updatedAt = now()
        await appendRow('reading_books', b); return sendJson(res, 201, { success:true, data:b })
      }
      if (req.method === 'PUT') {
        const { id, ...u } = body; if (!id) return sendError(res, 400, 'id required')
        return sendJson(res, 200, { success:true, data: await updateRowById('reading_books', id, u) })
      }
      if (req.method === 'DELETE') {
        const id = q.id||body.id; if (!id) return sendError(res, 400, 'id required')
        await deleteRowById('reading_books', id, false); return sendJson(res, 200, { success:true })
      }
    }

    // ?? reading_sessions ????????????????????????????????????????
    if (action === 'reading-sessions') {
      if (req.method === 'GET') {
        let data = await readSheet('reading_sessions')
        if (q.bookId) data = data.filter(r=>r.bookId===q.bookId)
        return sendJson(res, 200, { success:true, data })
      }
      if (req.method === 'POST') {
        const s = body; if (!s.id) s.id = uid('rs'); s.createdAt = s.createdAt||now()
        await appendRow('reading_sessions', s); return sendJson(res, 201, { success:true, data:s })
      }
      if (req.method === 'DELETE') {
        const id = q.id||body.id; if (!id) return sendError(res, 400, 'id required')
        await deleteRowById('reading_sessions', id, false); return sendJson(res, 200, { success:true })
      }
    }

    // ?? reading_journals ????????????????????????????????????????
    if (action === 'reading-journals') {
      if (req.method === 'GET') {
        let data = await readSheet('reading_journals')
        if (q.bookId) data = data.filter(r=>r.bookId===q.bookId)
        return sendJson(res, 200, { success:true, data })
      }
      if (req.method === 'POST') {
        const j = body; if (!j.id) j.id = uid('rj'); j.createdAt = j.createdAt||now()
        await appendRow('reading_journals', j); return sendJson(res, 201, { success:true, data:j })
      }
      if (req.method === 'PUT') {
        const { id, ...u } = body; if (!id) return sendError(res, 400, 'id required')
        return sendJson(res, 200, { success:true, data: await updateRowById('reading_journals', id, u) })
      }
      if (req.method === 'DELETE') {
        const id = q.id||body.id; if (!id) return sendError(res, 400, 'id required')
        await deleteRowById('reading_journals', id, false); return sendJson(res, 200, { success:true })
      }
    }

    // ?? reading_goals ???????????????????????????????????????????
    if (action === 'reading-goals') {
      if (req.method === 'GET') {
        const data = await readSheet('reading_goals')
        return sendJson(res, 200, { success:true, data: data[0]||{} })
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        const g = {...body, updatedAt: now()}
        const existing = await readSheet('reading_goals')
        if (existing.length > 0) {
          await updateRowById('reading_goals', existing[0].id||'goals', g)
        } else {
          if (!g.id) g.id = 'goals'
          await appendRow('reading_goals', g)
        }
        return sendJson(res, 200, { success:true, data:g })
      }
    }

    sendError(res, 404, 'Not found: ' + action)
  } catch (err) {
    console.error('[/api/admin/' + action + ']', err.message)
    sendError(res, 500, err.message)
  }
}