import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

// 랜딩 페이지 — 히어로 배경(public/bg-landing.png, 없으면 그라데이션 fallback)
export default function Landing() {
  const nav = useNavigate()

  return (
    <div className="min-h-full flex flex-col">
      <section className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* 배경: 이미지가 없으면 브랜드 색 그라데이션으로 자동 대체 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/bg-landing.png'), linear-gradient(135deg, #4F46E5 0%, #312e81 60%, #1e1b4b 100%)",
          }}
        />
        {/* 가독성 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

        {/* 콘텐츠 */}
        <div className="relative z-10 text-center px-6 py-24 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-white/90 text-sm font-semibold mb-6">
            🗳️ 학교 선거를 링크 하나로
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            무무보트
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-white/85 leading-relaxed">
            학급·전교학생회 선거를 만들고, 후보 공약을 살펴보고,
            <br className="hidden sm:block" />
            태블릿 한 대로 순서대로 투표하세요.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn-accent text-lg px-8 py-4" onClick={() => nav('/elections')}>
              시작하기 →
            </button>
            <button
              className="btn text-lg px-8 py-4 bg-white/15 text-white backdrop-blur hover:bg-white/25"
              onClick={() => nav('/elections/new')}
            >
              새 선거 등록
            </button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 max-w-lg mx-auto text-white/90">
            {[
              ['1', '선거 선택·등록', '4자리 코드'],
              ['2', '후보 공약 관찰', '포스터·공약'],
              ['3', '순서대로 투표', '실시간 집계'],
            ].map(([n, t, s]) => (
              <div key={n} className="rounded-2xl bg-white/10 backdrop-blur p-3">
                <div className="text-2xl font-black">{n}</div>
                <div className="text-sm font-semibold mt-1">{t}</div>
                <div className="text-xs text-white/70">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
