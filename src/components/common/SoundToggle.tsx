import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { sound } from '@/utils/sound'

/**
 * Floating mute/unmute control. Fixed position so it never affects page layout.
 */
export function SoundToggle() {
  const [muted, setMuted] = useState(() => sound.isMuted())

  useEffect(() => sound.subscribe(setMuted), [])

  return (
    <button
      type="button"
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      onClick={() => {
        sound.unlock()
        sound.setMuted(!muted)
      }}
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-lg backdrop-blur transition hover:bg-white/15"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  )
}
