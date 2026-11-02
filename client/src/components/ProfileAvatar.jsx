import { useState } from 'react'
import { API_ORIGIN } from '../lib/api.js'

function ProfileAvatarImage({ src, initial }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (imageFailed) return <span className="user-avatar-fallback" aria-hidden="true">{initial}</span>
  return <img src={src} alt="" onError={() => setImageFailed(true)} />
}

function ProfileAvatar({ name, src, className = '', sizeClass = '' }) {
  const initial = (name || 'U').trim().slice(0, 1).toUpperCase() || 'U'
  const imageSrc = src?.startsWith('/uploads/') ? `${API_ORIGIN}${src}` : src
  return (
    <span className={`user-avatar ${className} ${sizeClass}`.trim()} role="img" aria-label={name || 'User'}>
      {imageSrc
        ? <ProfileAvatarImage key={imageSrc} src={imageSrc} initial={initial} />
        : <span className="user-avatar-fallback" aria-hidden="true">{initial}</span>}
    </span>
  )
}

export default ProfileAvatar
