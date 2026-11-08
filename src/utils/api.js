/**
 * API client utility for SalasKuliah.
 * All requests go to /api/* (same domain on Vercel, or proxied in dev).
 */

const BASE = '/api'

async function request(path, options = {}) {
  const url = BASE + path
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  })

  const data = await res.json().catch(() => ({ error: true, message: 'Invalid JSON response' }))
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

// ── Public ────────────────────────────────────────────────────
export const api = {
  // Dashboard
  getDashboard: () => request('/public/dashboard'),

  // Semesters
  getSemesters: () => request('/public/semesters'),

  // Courses
  getCourses: (semesterId) => request('/public/courses' + (semesterId ? `?semester_id=${semesterId}` : '')),

  // Materials
  getMaterials: (courseId) => request('/public/materials' + (courseId ? `?course_id=${courseId}` : '')),

  // Assignments
  getAssignments: (courseId) => request('/public/assignments' + (courseId ? `?course_id=${courseId}` : '')),

  // Notes
  getNotes: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/public/notes' + (qs ? '?' + qs : ''))
  },

  // Literature
  getLiterature: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/public/literature' + (qs ? '?' + qs : ''))
  },

  // Announcements
  getAnnouncements: () => request('/public/announcements'),

  // Assignment attachments (public)
  getAssignmentAttachments: (assignmentId) => request('/public/assignment-attachments?assignment_id=' + assignmentId),

  // Search
  search: (q, type = 'all') => request(`/public/search?q=${encodeURIComponent(q)}&type=${type}`),

  // File proxy URL builder (not a fetch — just a URL)
  fileProxyUrl: (driveFileId) => `${BASE}/public/file-proxy?id=${driveFileId}`,
}

// ── Admin ─────────────────────────────────────────────────────
export const adminApi = {
  // Semesters
  getSemesters: () => request('/admin/semesters'),
  createSemester: (body) => request('/admin/semesters', { method: 'POST', body }),
  updateSemester: (id, body) => request('/admin/semesters', { method: 'PUT', body: { id, ...body } }),
  deleteSemester: (id) => request('/admin/semesters?id=' + id, { method: 'DELETE' }),

  // Courses
  getCourses: (semesterId) => request('/admin/courses' + (semesterId ? `?semester_id=${semesterId}` : '')),
  createCourse: (body) => request('/admin/courses', { method: 'POST', body }),
  updateCourse: (id, body) => request('/admin/courses', { method: 'PUT', body: { id, ...body } }),
  deleteCourse: (id) => request('/admin/courses?id=' + id, { method: 'DELETE' }),

  // Materials
  getMaterials: (courseId) => request('/admin/materials' + (courseId ? `?course_id=${courseId}` : '')),
  createMaterial: (body) => request('/admin/materials', { method: 'POST', body }),
  updateMaterial: (id, body) => request('/admin/materials', { method: 'PUT', body: { id, ...body } }),
  deleteMaterial: (id) => request('/admin/materials?id=' + id, { method: 'DELETE' }),

  // Assignments
  getAssignments: (courseId) => request('/admin/assignments' + (courseId ? `?course_id=${courseId}` : '')),
  createAssignment: (body) => request('/admin/assignments', { method: 'POST', body }),
  updateAssignment: (id, body) => request('/admin/assignments', { method: 'PUT', body: { id, ...body } }),
  deleteAssignment: (id) => request('/admin/assignments?id=' + id, { method: 'DELETE' }),

  // Assignment attachments
  getAssignmentAttachments: (assignmentId) => request('/admin/assignment-attachments?assignment_id=' + assignmentId),
  deleteAssignmentAttachment: (id) => request('/admin/assignment-attachments?id=' + id, { method: 'DELETE' }),

  // Notes
  getNotes: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/admin/notes' + (qs ? '?' + qs : ''))
  },
  createNote: (body) => request('/admin/notes', { method: 'POST', body }),
  updateNote: (id, body) => request('/admin/notes', { method: 'PUT', body: { id, ...body } }),
  deleteNote: (id) => request('/admin/notes?id=' + id, { method: 'DELETE' }),

  // Literature
  getLiterature: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request('/admin/literature' + (qs ? '?' + qs : ''))
  },
  createLiterature: (body) => request('/admin/literature', { method: 'POST', body }),
  updateLiterature: (id, body) => request('/admin/literature', { method: 'PUT', body: { id, ...body } }),
  deleteLiterature: (id) => request('/admin/literature?id=' + id, { method: 'DELETE' }),

  // Announcements
  getAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: (body) => request('/admin/announcements', { method: 'POST', body }),
  updateAnnouncement: (id, body) => request('/admin/announcements', { method: 'PUT', body: { id, ...body } }),
  deleteAnnouncement: (id) => request('/admin/announcements?id=' + id, { method: 'DELETE' }),

  // Upload file – client‑side Google Drive upload (no base64)
  uploadFile: (data) => request('/admin/upload', { method: 'POST', body: data }),

  // Drive files (list files in a folder)
  getDriveFiles: (folderId) => request('/admin/drive-files?folder_id=' + folderId),
  deleteDriveFile: (fileId) => request('/admin/drive-files?file_id=' + fileId, { method: 'DELETE' }),

  // Reading Tracker
  getReadingBooks: () => request('/admin/reading-books'),
  createReadingBook: (b) => request('/admin/reading-books', { method:'POST', body:b }),
  updateReadingBook: (id, b) => request('/admin/reading-books', { method:'PUT', body:{id,...b} }),
  deleteReadingBook: (id) => request('/admin/reading-books?id='+id, { method:'DELETE' }),

  getReadingSessions: (bookId) => request('/admin/reading-sessions'+(bookId?'?bookId='+bookId:'')),
  createReadingSession: (s) => request('/admin/reading-sessions', { method:'POST', body:s }),
  deleteReadingSession: (id) => request('/admin/reading-sessions?id='+id, { method:'DELETE' }),

  getReadingJournals: (bookId) => request('/admin/reading-journals'+(bookId?'?bookId='+bookId:'')),
  createReadingJournal: (j) => request('/admin/reading-journals', { method:'POST', body:j }),
  updateReadingJournal: (id, j) => request('/admin/reading-journals', { method:'PUT', body:{id,...j} }),
  deleteReadingJournal: (id) => request('/admin/reading-journals?id='+id, { method:'DELETE' }),

  getReadingGoals: () => request('/admin/reading-goals'),
  saveReadingGoals: (g) => request('/admin/reading-goals', { method:'POST', body:g }),

  // Schedule
  getScheduleSlots: () => request('/admin/schedule-slots'),
  saveScheduleSlot: (s) => request('/admin/schedule-slots', { method: s.id ? 'PUT' : 'POST', body: s }),
  deleteScheduleSlot: (id) => request('/admin/schedule-slots?id=' + id, { method: 'DELETE' }),
  getScheduleKuliah: () => request('/admin/schedule-kuliah'),
  saveScheduleKuliah: (k) => request('/admin/schedule-kuliah', { method: k.id ? 'PUT' : 'POST', body: k }),
  deleteScheduleKuliah: (id) => request('/admin/schedule-kuliah?id=' + id, { method: 'DELETE' }),

  // Auth
  login: (password) => request('/auth/login', { method: 'POST', body: { password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
}
