import { useEffect, useState } from 'react'
import { isMuted, toggleMuted, initButtonSfx } from '../lib/sound'

// 효과음 음소거 토글 (모든 화면 좌하단 고정) — 교실에서 소리 끄고 켜기
export default function SoundToggle() {
  const [muted, setMuted] = useState(isMuted())

  useEffect(() => {
    initButtonSfx() // 버튼 클릭음 전역 등록
  }, [])

  return (
    <button
      onClick={() => setMuted(toggleMuted())}
      aria-label={muted ? '효과음 켜기' : '효과음 끄기'}
      className="sound-toggle fixed bottom-4 left-4 z-40 w-11 h-11 rounded-full bg-paper border-2 border-ink flex items-center justify-center text-lg"
      title={muted ? '효과음 켜기' : '효과음 끄기'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
