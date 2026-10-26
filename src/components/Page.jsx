import { Link } from 'react-router-dom'
import Footer from './Footer'
export default function Page({ title, subtitle, children, maxWidth = 'max-w-3xl' }) {
 return <div className="min-h-full flex flex-col">
  <a href="#main" className="skip-link">본문으로 건너뛰기</a>
  <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-10">
   <nav aria-label="주 메뉴" className="max-w-6xl mx-auto px-4 min-h-16 flex items-center justify-between gap-3">
    <Link to="/" className="flex items-center gap-2 font-extrabold text-lg"><span className="brand-mark">✓</span>무무투표</Link>
    <div className="flex items-center gap-4 text-sm font-bold"><Link to="/elections" className="text-slate-600">내 투표</Link><Link to="/guide" className="text-primary">처음 사용하세요?</Link></div>
   </nav>
  </header>
  <main id="main" className="flex-1 w-full"><div className={maxWidth + ' mx-auto px-4 py-8 sm:py-12'}>
   {title && <div className="mb-7"><h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{title}</h1>{subtitle && <p className="text-slate-600 mt-2 leading-relaxed">{subtitle}</p>}</div>}
   {children}
  </div></main><Footer />
 </div>
}
