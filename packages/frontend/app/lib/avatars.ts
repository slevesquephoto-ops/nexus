const AVATAR_FILES: Record<string, string> = {
  default:    'default.png',
  debutant:   'avatar-debutant.png',
  tux:        'avatar-default.png',
  technicien: 'avatar-technicien.png',
  stagiaire:  'avatar-stagiaire.png',
  admin:      'avatar-admin.png',
  ingenieur:  'avatar-ingenieur.png',
  securite:   'avatar-securite.png',
  hacker:     'avatar-hacker.png',
}

export function getAvatarFile(avatarId?: string | null): string {
  return AVATAR_FILES[avatarId ?? 'default'] ?? 'default.png'
}
