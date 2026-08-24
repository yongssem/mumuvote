import { useEffect, useRef, useState } from 'react'
import { playTick, playDrumroll, playFanfare } from '../lib/sound'

// 결과 발표 연출 — 3 · 2 · 1 → 두구두구 → 공개(팡파레 + 색종이)
// onDone() 호출 시 부모가 결과를 보여준다.
export default function RevealCountdown({ title = '결과 발표', onDone }) {
  const [step, setStep] = useState(3) // 3 → 2 → 1 → 0(두구두구)
  const timers = useRef([])

  useEffect(() => {
    playTick(3)
    const push = (fn, ms) => timers.current.push(setTimeout(fn, ms))
    push(() => {
      setStep(2)
      playTick(2)
    }, 1000)
    push(() => {
      setStep(1)
      playTick(1)
    }, 2000)
    push(() => {
      setStep(0)
      playDrumroll(1.3)
    }, 3000)
    push(() => {
      playFanfare()
      onDone?.()
    }, 4400)
    return () => timers.current.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900">
      <div className="text-center px-6">
        <p className="text-white/80 font-bold tracking-[0.3em] text-sm sm:text-base mb-8">
          {title}
        </p>

        {step > 0 ? (
          // 숫자 카운트다운 (매번 새 key로 애니메이션 재시작)
          <div
            key={step}
            className="animate-count mx-auto w-40 h-40 sm:w-52 sm:h-52 rounded-[2rem] bg-white border-[5px] border-ink shadow-[12px_12px_0_0_#0F172A] flex items-center justify-center"
          >
            <span className="text-8xl sm:text-9xl font-black text-ink tabular-nums">{step}</span>
          </div>
        ) : (
          // 두구두구
          <div className="animate-shake">
            <div className="text-7xl sm:text-8xl mb-4">🥁</div>
            <p className="text-3xl sm:text-4xl font-black text-white">두구두구두구…</p>
          </div>
        )}

        <p className="text-white/50 text-sm font-semibold mt-10">잠시 후 결과가 공개됩니다</p>
      </div>
    </div>
  )
}

// 색종이 — 결과 공개 순간 잠깐 흩날린다 (라이브러리 없이 CSS만)
export function Confetti({ count = 70 }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const colors = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#06B6D4']
    return {
      left: Math.round((i * 137.5) % 100), // 황금각으로 고르게 분포
      delay: (i % 12) * 0.12,
      dur: 2.6 + ((i * 7) % 18) / 10,
      color: colors[i % colors.length],
      size: 8 + (i % 4) * 3,
      round: i % 3 === 0,
    }
  })
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-24px] animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.6),
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  )
}
