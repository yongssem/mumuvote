import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { templates } from '../lib/templates'
export default function Landing() {
 return <div className="landing min-h-full">
  <a href="#main" className="skip-link">본문으로 건너뛰기</a>
  <header className="landing-header max-w-6xl mx-auto px-5 py-5 flex justify-between items-center gap-3">
   <Link to="/" className="flex items-center gap-2 font-black text-xl"><span className="brand-mark">✓</span>무무투표</Link>
   <nav aria-label="주 메뉴" className="flex gap-4 text-sm font-bold"><Link to="/guide">사용 가이드</Link><Link to="/elections" className="text-primary">내 투표 →</Link></nav>
  </header>
  <main id="main">
   <section className="hero-surface relative overflow-hidden">
    <div className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/bg-landing.png')" }} />
    <div className="relative max-w-6xl mx-auto px-5 py-14 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
     <div><p className="eyebrow">우리 반의 생각이 모이는 곳</p>
      <h1 className="text-[2.65rem] sm:text-6xl font-black leading-[1.22] tracking-tight mt-5">작은 선택도,<br/><span className="text-primary">우리 함께</span> 정해요.</h1>
      <p className="text-slate-600 text-base sm:text-lg mt-6 leading-relaxed max-w-md">학급 활동부터 우리 반 약속, 대표 선거까지.<br/>서로의 생각을 살펴보고 투표로 의견을 모아요.</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-8"><Link className="btn-primary" to="/elections/new">새 투표 만들기 <span aria-hidden="true">↗</span></Link><Link className="btn-ghost" to="/elections">코드로 투표 찾기</Link></div>
      <Link to="/guide" className="inline-block mt-6 text-sm font-bold text-slate-600 underline underline-offset-4">처음이라면? 연습 투표로 배워요 →</Link>
     </div>
     <div className="sample-board" aria-label="학급 활동 투표 화면 예시">
      <div className="flex justify-between items-center gap-2"><span className="text-xs font-bold text-primary bg-indigo-50 rounded-full px-3 py-1.5">이렇게 의견을 모아요</span><span className="text-xs text-slate-500">화면 예시</span></div>
      <h2 className="text-xl sm:text-2xl font-extrabold mt-6">금요일에 무엇을 할까요?</h2>
      <p className="text-sm text-slate-500 mt-2">친구들과 하고 싶은 활동을 골라요.</p>
      <div className="space-y-3 mt-6">{[['01','보드게임','함께 웃고 생각하는 시간'],['02','협동 체육','힘을 모아 미션에 도전'],['03','영화 감상','한 편의 이야기를 함께']].map(([n,t,d],i)=><div key={n} className={'sample-choice ' + (i===0?'sample-selected':'')}><span className="text-xs font-black opacity-60">{n}</span><div className="flex-1"><p className="font-bold">{t}</p><p className="text-xs text-slate-500 mt-1">{d}</p></div><span className="text-primary font-bold" aria-hidden="true">{i===0?'✓':'○'}</span></div>)}</div>
      <div className="flex items-center gap-2 mt-6 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500"/>한 대로 돌아가며 · 각자 기기로 참여</div>
     </div>
    </div>
   </section>
   <section className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
    <div className="flex flex-wrap justify-between items-end gap-4 mb-7"><div><p className="eyebrow">매일의 교실에 맞게</p><h2 className="text-2xl sm:text-3xl font-extrabold mt-3">오늘은 무엇을 정할까요?</h2></div><p className="text-sm text-slate-500">예시를 고르면 새 투표에 내용이 채워져요.</p></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{templates.map(t=><Link to={'/elections/new?template='+t.id} className="topic-card" key={t.id}><span className="topic-icon" aria-hidden="true">{t.icon}</span><h3 className="font-extrabold mt-5">{t.label}</h3><p className="text-sm text-slate-600 leading-relaxed mt-2">{t.detail}</p><span className="text-primary text-sm font-bold mt-6 inline-block">이 예시로 만들기 ↗</span></Link>)}</div>
   </section>
   <section className="landing-process"><div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-3 gap-8">{[['01','주제와 선택지 만들기','함께 결정할 질문과 선택지를 적어요.'],['02','우리 반과 투표 방식 정하기','명단을 등록하고, 한 대 또는 각자 기기로 참여해요.'],['03','결과를 보고 함께 이야기하기','득표수나 순위 점수를 확인하고 다음 행동을 정해요.']].map(([n,t,d])=><div key={n}><p className="eyebrow-number text-primary font-black text-sm">{n}</p><h3 className="font-extrabold text-lg mt-3">{t}</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">{d}</p></div>)}</div></section>
   <section className="max-w-6xl mx-auto px-5 py-14 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center"><div><h2 className="font-extrabold text-2xl">첫 투표도 어렵지 않게.</h2><p className="text-slate-600 mt-2">저장 없이 해보는 튜토리얼과 선생님용 PDF 설명서.</p></div><Link className="btn-primary shrink-0" to="/guide">가이드 살펴보기 →</Link></section>
  </main>
  <Footer/><div className="text-center pb-6"><Link to="/admin" className="text-xs text-slate-500 underline underline-offset-4">관리자</Link></div>
 </div>
}
