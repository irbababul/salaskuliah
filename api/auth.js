/**
 * api/auth.js
 * Handles: /api/auth/login, /api/auth/logout, /api/auth/me
 */
const {
  setSessionCookie, clearSessionCookie, getSession,
  isAdminRequest, setCorsHeaders, sendJson, sendError, ADMIN_EMAILS
} = require('./lib/auth.js')
const crypto = require('crypto')

const ADMIN_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'

module.exports = async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const urlPath = (req.url || '').split('?')[0]
  const segments = urlPath.split('/').filter(s => s.length > 0)
  const action = segments[segments.length - 1] || '' // login | logout | me

  if (action === 'login') {
    if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed')
    const { password } = req.body || {}
    if (!password) return sendError(res, 400, 'Password diperlukan')
    const hash = crypto.createHash('sha256').update(password).digest('hex')
    if (hash !== ADMIN_HASH) return sendError(res, 401, 'Password salah')
    const adminEmail = ADMIN_EMAILS[0] || 'admin@salaskuliah.com'
    setSessionCookie(res, adminEmail)
    return sendJson(res, 200, { success: true, user: { email: adminEmail } })
  }

  if (action === 'logout') {
    clearSessionCookie(res)
    return sendJson(res, 200, { success: true, message: 'Logged out' })
  }

  if (action === 'me') {
    const session = getSession(req)
    if (!session) return sendJson(res, 200, { loggedIn: false, isAdmin: false, user: null })
    return sendJson(res, 200, { loggedIn: true, isAdmin: isAdminRequest(req), user: { email: session.email } })
  }

  sendError(res, 404, 'Not found')
}