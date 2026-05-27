'use client'

interface AvatarUnlockModalProps {
  avatar: { avatarId: string; title: string; description: string; file: string }
  onClose: () => void
}

export default function AvatarUnlockModal({ avatar, onClose }: AvatarUnlockModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="animate-fade-in-up bg-nx-surface border border-nx-yellow/40 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-glow-yellow">
        <p className="text-nx-yellow text-2xl font-bold mb-4 tracking-wide">🎉 Avatar débloqué !</p>
        <img
          src={`/avatars/${avatar.file}`}
          alt={avatar.title}
          className="w-40 h-40 object-contain mx-auto mb-4"
          style={{ mixBlendMode: 'screen' }}
        />
        <p className="text-white text-xl font-bold mb-2">{avatar.title}</p>
        <p className="text-nx-text-dim text-sm mb-6">{avatar.description}</p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-nx-yellow text-nx-bg font-bold rounded-xl hover:bg-yellow-400 hover:shadow-glow-yellow-sm transition-all duration-200"
        >
          Super !
        </button>
      </div>
    </div>
  )
}
