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
      className="fixed bottom-4 left-4 z-40 w-11 h-11 rounded-full bg-white border-2 border-ink shadow-[3px_3px_0_0_#0F172A] flex items-center justify-center text-lg transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#0F172A] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_0_#0F172A]"
      title={muted ? '효과음 켜기' : '효과음 끄기'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
