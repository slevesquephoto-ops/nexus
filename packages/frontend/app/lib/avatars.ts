const AVATAR_FILES: Record<string, string> = {
  noob:          'default.png',
  debutant:      'avatar-debutant.png',
  default:       'avatar-default.png',
  stagiaire:     'avatar-stagiaire.png',
  technicien:    'avatar-technicien.png',
  admin:         'avatar-admin.png',
  ingenieur:     'avatar-ingenieur.png',
  securite:      'avatar-securite.png',
  hacker:        'avatar-hacker.png',
  'nexus-agent': 'avatar-nexus-agent.png',
}

export function getAvatarFile(avatarId?: string | null): string {
  return AVATAR_FILES[avatarId ?? 'noob'] ?? 'default.png'
}
