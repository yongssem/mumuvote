// 일반 페이지 레이아웃 (상단 바 + 콘텐츠 + 푸터)
import { Link } from 'react-router-dom'
import Footer from './Footer'

export default function Page({ title, subtitle, children, maxWidth = 'max-w-3xl' }) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="inline-flex w-7 h-7 rounded-lg bg-primary text-white items-center justify-center text-sm">
              ✓
            </span>
            무무보트
          </Link>
          <span className="text-xs text-slate-400">학교 선거 · MUMUVOTE</span>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className={`${maxWidth} mx-auto px-4 py-8`}>
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
              {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
