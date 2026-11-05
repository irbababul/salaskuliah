import Fuse from 'fuse.js'

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function getFileIcon(mimeType) {
  if (mimeType?.includes('pdf')) return '📄'
  if (mimeType?.includes('image')) return '🖼️'
  if (mimeType?.includes('video')) return '🎬'
  if (mimeType?.includes('presentation') || mimeType?.includes('pptx')) return '📊'
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('xlsx')) return '📈'
  if (mimeType?.includes('document') || mimeType?.includes('docx')) return '📝'
  return '📁'
}

export function createSearchIndex(data) {
  const items = []

  data.semesters.forEach(sem => {
    sem.courses.forEach(course => {
      const addItems = (list, type) => {
        list.forEach(item => {
          items.push({
            ...item,
            semester: sem.name,
            semesterId: sem.id,
            course: course.name,
            courseId: course.id,
            category: type
          })
        })
      }
      addItems(course.materials, 'materi')
      addItems(course.assignments, 'tugas')
    })
  })

  data.notes.forEach(note => {
    items.push({ ...note, category: 'catatan' })
  })

  const litTypes = { journals: 'jurnal', books: 'buku', articles: 'artikel' }
  Object.entries(litTypes).forEach(([key, cat]) => {
    ;(data.literacy[key] || []).forEach(item => {
      items.push({ ...item, category: cat })
    })
  })

  const fuse = new Fuse(items, {
    keys: ['title', 'tags', 'course', 'semester', 'author', 'topic', 'content', 'summary'],
    threshold: 0.3,
    includeScore: true
  })

  return { items, fuse }
}

export function filterItems(items, filters) {
  return items.filter(item => {
    if (filters.semester && item.semester !== filters.semester) return false
    if (filters.course && item.course !== filters.course) return false
    if (filters.category && item.category !== filters.category) return false
    if (filters.tag && !(item.tags || []).includes(filters.tag)) return false
    return true
  })
}

export function getAllTags(items) {
  const tagSet = new Set()
  items.forEach(item => (item.tags || []).forEach(t => tagSet.add(t)))
  return [...tagSet].sort()
}

export function getAllCourses(data) {
  const courses = []
  data.semesters.forEach(sem => {
    sem.courses.forEach(c => {
      courses.push({ id: c.id, name: c.name, semester: sem.name })
    })
  })
  return courses
}
