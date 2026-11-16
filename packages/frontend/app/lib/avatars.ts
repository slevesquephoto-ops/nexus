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
  'nexus-agent':          'avatar-nexus-agent.png',
  'slyx-classique':       'slyx-classique.png',
  'slyx-apprenti':        'slyx-apprenti.png',
  'slyx-observateur':     'slyx-observateur.png',
  'slyx-analyste-junior': 'slyx-analyste-junior.png',
  'slyx-tech-lab':        'slyx-tech-lab.png',
  'slyx-renonnaissance':  'slyx-renonnaissance.png',
  'red-team-black-cap':   'red-team-black-cap.png',
  'red-team-white-cap':  'red-team-white-cap.png',
  'blue-team-black-cap':  'blue-team-black-cap.png',
  'blue-team-white-cap': 'blue-team-white-cap.png',
}

export function getAvatarFile(avatarId?: string | null): string {
  return AVATAR_FILES[avatarId ?? 'noob'] ?? 'default.png'
}
