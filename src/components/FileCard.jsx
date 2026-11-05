import { FiExternalLink, FiDownload, FiFileText, FiImage, FiVideo, FiPieChart, FiFile } from 'react-icons/fi'
import { formatFileSize, formatDate } from '../utils/helpers'

function getFileIcon(mimeType) {
  if (mimeType?.includes('pdf'))                             return <FiFileText size={17} />
  if (mimeType?.includes('image'))                          return <FiImage size={17} />
  if (mimeType?.includes('video'))                          return <FiVideo size={17} />
  if (mimeType?.includes('presentation') || mimeType?.includes('pptx')) return <FiPieChart size={17} />
  if (mimeType?.includes('spreadsheet')  || mimeType?.includes('xlsx'))  return <FiPieChart size={17} />
  return <FiFile size={17} />
}

function getColor(mimeType) {
  if (mimeType?.includes('pdf'))        return 'var(--danger)'
  if (mimeType?.includes('image'))      return 'var(--success)'
  if (mimeType?.includes('video'))      return 'var(--purple)'
  if (mimeType?.includes('presentation') || mimeType?.includes('pptx')) return 'var(--warning)'
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('xlsx'))  return 'var(--success)'
  return 'var(--accent)'
}

export default function FileCard({ item }) {
  const isDummy = (!item.driveUrl || item.driveUrl === '#') && !item.drive_view_url
  const color = getColor(item.mimeType || item.mime_type)

  return (
    <div className="sk-card sk-card-interactive group" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
        }}>
          {getFileIcon(item.mimeType || item.mime_type)}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
            <h3 style={{
              fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)',
              flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
            }}>{item.title}</h3>
            {isDummy && <span className="dummy-badge" style={{ flexShrink: 0, marginTop: 1 }}>Demo</span>}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 8px', marginBottom: 8 }}>
            {item.course && (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{item.course}</span>
            )}
            {item.semester && !item.course && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.semester}</span>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
              {item.size && <span>{formatFileSize(item.size)}</span>}
              {item.lastModified && <span>· {formatDate(item.lastModified)}</span>}
            </div>
            {/* Action buttons — show on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ display: 'flex', gap: 4 }}>
              {!isDummy ? (
                <>
                  <a href={item.drive_view_url || item.driveUrl} target="_blank" rel="noopener noreferrer"
                    title="Buka"
                    style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)', transition: 'all 0.15s' }}>
                    <FiExternalLink size={12} />
                  </a>
                  <a href={item.drive_view_url || item.driveUrl} target="_blank" rel="noopener noreferrer"
                    title="Download"
                    style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-hover)', transition: 'all 0.15s' }}>
                    <FiDownload size={12} />
                  </a>
                </>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Segera hadir</span>
              )}
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 99,
                  backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)',
                }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
