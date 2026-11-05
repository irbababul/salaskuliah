/**
 * api/public.js
 * Handles all public read-only endpoints:
 * /api/public/semesters, courses, materials, assignments,
 * notes, literature, announcements, dashboard, search, file-proxy
 */
const { readSheet } = require('./lib/sheets.js')
const { streamFile, getFileMetadata } = require('./lib/drive.js')
const { setCorsHeaders, sendJson, sendError } = require('./lib/auth.js')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed')

  const urlPath = (req.url || '').split('?')[0]
  const segments = urlPath.split('/').filter(s => s.length > 0)
  const action = segments[segments.length - 1] || ''
  console.log('[public] url:', req.url, '| action:', action)
  const q = req.query || {}

  try {
    // ── semesters ──────────────────────────────────────────────
    if (action === 'semesters') {
      let data = await readSheet('semesters')
      data = data.filter(r => r.is_active !== 'false' && !r.deleted_at)
      return sendJson(res, 200, { success: true, data })
    }

    // ── courses ────────────────────────────────────────────────
    if (action === 'courses') {
      let data = await readSheet('courses')
      data = data.filter(r => r.is_active !== 'false' && !r.deleted_at)
      if (q.semester_id) data = data.filter(r => r.semester_id === q.semester_id)
      return sendJson(res, 200, { success: true, data })
    }

    // ── materials ──────────────────────────────────────────────
    if (action === 'materials') {
      let data = await readSheet('materials')
      data = data.filter(r => r.is_published === 'true' && !r.deleted_at)
      if (q.course_id) data = data.filter(r => r.course_id === q.course_id)
      return sendJson(res, 200, { success: true, data })
    }

    // ── assignments ────────────────────────────────────────────
    if (action === 'assignments') {
      let data = await readSheet('assignments')
      data = data.filter(r => r.is_published === 'true' && !r.deleted_at)
      if (q.course_id) data = data.filter(r => r.course_id === q.course_id)
      return sendJson(res, 200, { success: true, data })
    }

    // ── notes ──────────────────────────────────────────────────
    if (action === 'notes') {
      let data = await readSheet('notes')
      data = data.filter(r => r.is_published === 'true' && !r.deleted_at)
      if (q.course_id) data = data.filter(r => r.course_id === q.course_id)
      if (q.semester_id) data = data.filter(r => r.semester_id === q.semester_id)
      return sendJson(res, 200, { success: true, data })
    }

    // ── literature ─────────────────────────────────────────────
    if (action === 'literature') {
      let data = await readSheet('literature')
      data = data.filter(r => r.is_published === 'true' && !r.deleted_at)
      if (q.type) data = data.filter(r => r.type === q.type)
      return sendJson(res, 200, { success: true, data })
    }

    // ── announcements ──────────────────────────────────────────
    if (action === 'announcements') {
      let data = await readSheet('announcements')
      data = data.filter(r => {
        if (r.is_published !== 'true') return false
        if (r.deleted_at) return false
        if (r.expires_at && new Date(r.expires_at) < new Date()) return false
        return true
      })
      return sendJson(res, 200, { success: true, data })
    }

    // ── dashboard ──────────────────────────────────────────────
    if (action === 'dashboard') {
      const [semesters, courses, materials, assignments, notes, literature, announcements] = await Promise.all([
        readSheet('semesters'), readSheet('courses'), readSheet('materials'),
        readSheet('assignments'), readSheet('notes'), readSheet('literature'), readSheet('announcements'),
      ])
      const now = new Date()
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const pubAssignments = assignments.filter(r => r.is_published === 'true' && !r.deleted_at)
      const upcoming = pubAssignments
        .filter(a => a.due_date && new Date(a.due_date) >= now && new Date(a.due_date) <= in7Days)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5)
      const pubMaterials = materials.filter(r => r.is_published === 'true' && !r.deleted_at)
      const recentMaterials = [...pubMaterials].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
      const activeAnn = announcements.filter(r => r.is_published === 'true' && !r.deleted_at && !(r.expires_at && new Date(r.expires_at) < now))
      return sendJson(res, 200, {
        success: true,
        data: {
          stats: {
            semesters: semesters.filter(r => r.is_active !== 'false').length,
            courses: courses.filter(r => r.is_active !== 'false').length,
            materials: pubMaterials.length,
            assignments: pubAssignments.length,
            notes: notes.filter(r => r.is_published === 'true' && !r.deleted_at).length,
            literature: literature.filter(r => r.is_published === 'true' && !r.deleted_at).length,
          },
          announcements: activeAnn.slice(0, 3),
          upcoming_deadlines: upcoming,
          recent_materials: recentMaterials,
        },
      })
    }

    // ── search ─────────────────────────────────────────────────
    if (action === 'search') {
      const searchQ = (q.q || '').toLowerCase().trim()
      const type = q.type || 'all'
      if (!searchQ) return sendJson(res, 200, { success: true, data: [], total: 0 })

      const results = []
      const matches = (row, fields) => fields.some(f => (row[f] || '').toLowerCase().includes(searchQ))

      if (type === 'all' || type === 'materials') {
        const rows = await readSheet('materials')
        rows.filter(r => r.is_published === 'true' && !r.deleted_at && matches(r, ['title','description','tags']))
          .forEach(r => results.push({ ...r, _type: 'material' }))
      }
      if (type === 'all' || type === 'assignments') {
        const rows = await readSheet('assignments')
        rows.filter(r => r.is_published === 'true' && !r.deleted_at && matches(r, ['title','description','tags']))
          .forEach(r => results.push({ ...r, _type: 'assignment' }))
      }
      if (type === 'all' || type === 'notes') {
        const rows = await readSheet('notes')
        rows.filter(r => r.is_published === 'true' && !r.deleted_at && matches(r, ['title','content','tags']))
          .forEach(r => results.push({ ...r, _type: 'note' }))
      }
      if (type === 'all' || type === 'literature') {
        const rows = await readSheet('literature')
        rows.filter(r => r.is_published === 'true' && !r.deleted_at && matches(r, ['title','author','topic','summary','tags']))
          .forEach(r => results.push({ ...r, _type: 'literature' }))
      }
      return sendJson(res, 200, { success: true, data: results, total: results.length, query: searchQ })
    }

    // ── assignment-attachments
    if (action === 'assignment-attachments') {
      let data = await readSheet('assignment_attachments')
      if (q.assignment_id) data = data.filter(r => r.assignment_id === q.assignment_id)
      return sendJson(res, 200, { success: true, data })
    }

    // ── file-proxy ─────────────────────────────────────────────
    if (action === 'file-proxy') {
      const fileId = q.id
      if (!fileId) return sendError(res, 400, 'id diperlukan')
      const meta = await getFileMetadata(fileId)
      res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream')
      res.setHeader('Content-Disposition', 'inline; filename="' + meta.name + '"')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      const stream = await streamFile(fileId)
      return stream.pipe(res)
    }

    sendError(res, 404, 'Not found: ' + action)
  } catch (err) {
    console.error('[/api/public/' + action + ']', err.message)
    sendError(res, 500, 'Gagal mengambil data', err.message)
  }
}