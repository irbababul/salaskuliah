const crypto = require('crypto')

function uid(prefix = '') {
  const ts = Date.now().toString(36)
  const rand = crypto.randomBytes(4).toString('hex')
  return prefix ? prefix + '_' + ts + rand : ts + rand
}

function now() {
  return new Date().toISOString()
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * Parse multipart/form-data body dari Vercel request.
 * Vercel sudah parse body — ini helper untuk normalize.
 */
function parseBody(req) {
  return req.body || {}
}

module.exports = { uid, now, slugify, parseBody }
