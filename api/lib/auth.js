/**
 * Autentikasi Admin — menggunakan Google OAuth untuk verifikasi email.
 * Session disimpan dalam signed cookie.
 * 
 * Catatan: Untuk production, gunakan library session yang proper.
 * Untuk development/awal, kita gunakan simple JWT-like token.
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret'
const SESSION_COOKIE = 'sk_admin'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 hari

/**
 * Buat session token sederhana (base64 encoded JSON + HMAC).
 * Untuk production sebaiknya pakai JWT library.
 */
function createSessionToken(email) {
  const payload = { email, exp: Date.now() + SESSION_MAX_AGE }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  // Simple signature — untuk production ganti dengan proper HMAC
  const sig = Buffer.from(SESSION_SECRET + encoded).toString('base64url').slice(0, 16)
  return encoded + '.' + sig
}

/**
 * Verify session token dan return payload jika valid.
 */
function verifySessionToken(token) {
  if (!token) return null
  try {
    const [encoded, sig] = token.split('.')
    const expectedSig = Buffer.from(SESSION_SECRET + encoded).toString('base64url').slice(0, 16)
    if (sig !== expectedSig) return null

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (payload.exp < Date.now()) return null  // expired

    return payload
  } catch {
    return null
  }
}

/**
 * Parse cookies dari request header.
 */
function parseCookies(req) {
  const cookieHeader = req.headers.cookie || ''
  const cookies = {}
  cookieHeader.split(';').forEach(part => {
    const [key, ...val] = part.trim().split('=')
    if (key) cookies[key.trim()] = decodeURIComponent(val.join('='))
  })
  return cookies
}

/**
 * Set session cookie pada response.
 */
function setSessionCookie(res, email) {
  const token = createSessionToken(email)
  const maxAge = Math.floor(SESSION_MAX_AGE / 1000)
  const isProduction = process.env.NODE_ENV === 'production'

  const cookieValue = [
    SESSION_COOKIE + '=' + token,
    'HttpOnly',
    'Path=/',
    'Max-Age=' + maxAge,
    'SameSite=Lax',
    isProduction ? 'Secure' : '',
  ].filter(Boolean).join('; ')

  res.setHeader('Set-Cookie', cookieValue)
}

/**
 * Clear session cookie (logout).
 */
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', SESSION_COOKIE + '=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
}

/**
 * Ambil session user dari request.
 * Return { email } jika valid, null jika tidak login.
 */
function getSession(req) {
  const cookies = parseCookies(req)
  const token = cookies[SESSION_COOKIE]
  return verifySessionToken(token)
}

/**
 * Cek apakah request berasal dari admin yang login.
 */
function isAdminRequest(req) {
  const session = getSession(req)
  if (!session) return false
  return ADMIN_EMAILS.includes(session.email.toLowerCase())
}

/**
 * Middleware: tolak jika bukan admin.
 * Digunakan di semua /api/admin/* endpoint.
 */
function requireAdmin(req, res) {
  if (!isAdminRequest(req)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin login required',
    })
    return false
  }
  return true
}

/**
 * Helper: set CORS headers untuk development.
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

/**
 * Standard response helper.
 */
function sendJson(res, statusCode, data) {
  res.status(statusCode).json(data)
}

function sendError(res, statusCode, message, details = null) {
  const body = { error: true, message }
  if (details && process.env.NODE_ENV !== 'production') body.details = String(details)
  res.status(statusCode).json(body)
}

module.exports = {
  ADMIN_EMAILS,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  isAdminRequest,
  requireAdmin,
  setCorsHeaders,
  sendJson,
  sendError,
}
