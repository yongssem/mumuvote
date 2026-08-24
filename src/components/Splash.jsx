import { useEffect, useState } from 'react'

// 앱 진입 스플래시 — 부르탈리즘 카드가 팝인 → 잠시 후 페이드아웃 (탭하면 즉시 건너뛰기)
export default function Splash() {
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1700)
    const t2 = setTimeout(() => setGone(true), 2250)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (gone) return null

  return (
    <div
      className={`splash ${leaving ? 'splash-out' : ''}`}
      onClick={() => setLeaving(true)}
      role="button"
      aria-label="시작"
    >
      {/* 떠다니는 배경 도형 (부르탈리즘 하드 그림자) */}
      <div className="absolute -left-8 top-16 w-24 h-24 rounded-2xl bg-accent border-2 border-ink shadow-[6px_6px_0_0_#0F172A] animate-blob" />
      <div
        className="absolute right-6 bottom-24 w-16 h-16 rounded-full bg-white border-2 border-ink shadow-[6px_6px_0_0_#0F172A] animate-blob"
        style={{ animationDelay: '1.2s' }}
      />

      <div className="animate-pop relative bg-white border-[3px] border-ink rounded-[28px] shadow-[10px_10px_0_0_#0F172A] px-10 py-12 text-center max-w-[86vw]">
        <div className="animate-stamp inline-flex w-20 h-20 rounded-2xl bg-accent border-[3px] border-ink items-center justify-center text-4xl shadow-[4px_4px_0_0_#0F172A]">
          🗳️
        </div>
        <h1 className="text-5xl font-black mt-6 tracking-tight text-ink">무무투표</h1>
        <p className="text-slate-500 font-bold mt-2">학교 선거, 링크 하나로</p>

        {/* 로딩 바 */}
        <div className="mt-7 h-3 w-44 mx-auto bg-slate-100 rounded-full overflow-hidden border-2 border-ink">
          <div className="h-full bg-primary animate-load" />
        </div>
        <p className="text-[11px] text-slate-400 font-semibold mt-3">탭하면 바로 시작</p>
      </div>
    </div>
  )
}
