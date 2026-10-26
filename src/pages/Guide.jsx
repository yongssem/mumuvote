import { useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page'
const steps = [
 ['주제 만들기', '학생들과 함께 정할 질문을 적어요. 답을 유도하지 않는 질문과 서로 다른 선택지가 좋아요.'],
 ['우리 반 등록', '반 이름과 투표할 학생 명단을 입력해요. 한 줄에 한 명씩, 필요하면 학번도 함께 적어요.'],
 ['한 표 보내기', '한 대로 순서대로 투표하거나, 선생님이 복사한 개인 참여 링크로 각자 접속해요.'],
 ['결과 나누기', '모든 학생이 참여했는지 확인한 뒤 결과를 보고, 함께 실행할 내용을 정해요.'],
]
export default function Guide() {
 const [step, setStep] = useState(0)
 const [topic, setTopic] = useState('금요일에 무엇을 할까요?')
 const [choice, setChoice] = useState('')
 const [sent, setSent] = useState(false)
 const options = ['보드게임', '협동 체육', '영화 감상']
 function restart(){setStep(0);setTopic('금요일에 무엇을 할까요?');setChoice('');setSent(false)}
 return <Page title="첫 투표, 함께 연습해요" subtitle="네 단계로 익히는 무무투표. 이 연습은 서버에 저장되지 않아요." maxWidth="max-w-5xl">
  <div className="flex flex-col sm:flex-row gap-3 justify-between mb-8">
   <p className="text-sm text-slate-600">약 2분 · 실제 학생 정보 없이 연습</p>
   <a className="text-sm text-primary font-bold underline underline-offset-4" href="/mumuvote-guide.pdf" download>선생님용 PDF 설명서 다운로드 ↓</a>
  </div>
  <ol className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6" aria-label="연습 단계">{steps.map(([title],i)=><li key={title}><button onClick={()=>setStep(i)} aria-current={i===step?'step':undefined} className={'guide-step ' + (i===step?'guide-step-active':'')}><span className="text-xs opacity-70">0{i+1}</span><span>{title}</span></button></li>)}</ol>
  <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
   <section className="rounded-3xl bg-indigo-950 text-white p-6 sm:p-8">
    <p className="text-indigo-200 text-sm font-bold">STEP 0{step+1} / 04</p><h2 className="text-2xl font-extrabold mt-5">{steps[step][0]}</h2><p className="text-indigo-100 leading-relaxed mt-4">{steps[step][1]}</p>
    <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed">{[
     '단순 선택은 정해진 개수만큼 고르고, 순위투표는 선호하는 순서대로 골라요. 여러 개를 고르는 경우 모두 골라야 제출할 수 있어요.',
     '4자리 코드는 다른 기기에서 같은 투표를 찾을 때 사용해요. 학생의 개인 참여 링크는 명단 등록 후 선택지 화면에서 복사해요.',
     '이 연습에서는 단순 선택 한 표를 보내요. 실제 투표도 선택 내용을 확인하고 제출하세요.',
     '순위투표는 고르는 개수가 N개일 때 1등 N점부터 마지막 1점까지 더해요. 동점이면 미리 정한 기준을 확인하고 이야기해요.',
    ][step]}</div>
   </section>
   <section className="card p-6 sm:p-8 min-h-[350px]" aria-label="연습 화면">
    <p className="eyebrow mb-5">연습 화면 · 실제 투표와 분리</p>
    {step===0 && <><label htmlFor="practice-topic" className="label">함께 정할 질문</label><input id="practice-topic" className="input" maxLength={100} value={topic} onChange={e=>setTopic(e.target.value)}/><h3 className="font-bold mt-6 mb-3">선택지 예시</h3><div className="flex flex-wrap gap-2">{options.map(o=><span className="rounded-xl px-3 py-2 bg-slate-100 text-sm font-bold" key={o}>{o}</span>)}</div><p className="text-sm text-slate-600 mt-6">실제 투표에서는 선택지를 직접 추가하고 설명·이미지를 넣을 수 있어요.</p></>}
    {step===1 && <><h3 className="font-extrabold text-xl">연습반 · 참여자 3명</h3><p className="text-sm text-slate-600 mt-2">실명 대신 연습용 이름을 사용했어요.</p><div className="mt-5 space-y-2">{['01 연습학생 가','02 연습학생 나','03 연습학생 다'].map(n=><div key={n} className="rounded-xl bg-slate-50 border border-slate-200 p-3">{n}</div>)}</div><p className="text-sm text-slate-600 mt-5">한 대로 진행하면 명단 순서대로 차례가 와요.</p></>}
    {step===2 && <><h3 className="font-extrabold text-xl mb-2">{topic.trim() || '금요일에 무엇을 할까요?'}</h3><fieldset disabled={sent}><legend className="text-sm text-slate-600 mb-4">하고 싶은 활동 한 개를 골라주세요.</legend><div className="space-y-2">{options.map(o=><label className={'practice-option '+(choice===o?'practice-option-active':'')} key={o}><input type="radio" name="practice-choice" value={o} checked={choice===o} onChange={()=>setChoice(o)}/><span>{o}</span></label>)}</div></fieldset><button className="btn-primary w-full mt-5" disabled={!choice||sent} onClick={()=>setSent(true)}>{sent?'✓ 연습 투표 완료':'이 선택으로 연습 투표하기'}</button><p className="text-sm text-primary font-bold mt-3" role="status">{sent?'한 표를 보냈어요. 다음 단계에서 연습 결과를 확인하세요.':''}</p></>}
    {step===3 && <><h3 className="font-extrabold text-xl">연습 결과</h3>{sent?<><p className="text-sm text-slate-600 mt-2 mb-6">연습 참여자 1명의 표만 표시합니다.</p>{options.map(o=><div className="mb-4" key={o}><div className="flex justify-between text-sm font-bold mb-2"><span>{o}</span><span>{choice===o?1:0}표</span></div><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:choice===o?'100%':'0%'}}/></div></div>)}<p className="text-sm text-slate-600 mt-6">실제 투표에서는 반별 결과와 전체 합산 결과를 확인할 수 있어요.</p></>:<div className="mt-8"><p className="text-slate-600">아직 연습 투표를 보내지 않았어요.</p><button className="btn-primary mt-4" onClick={()=>setStep(2)}>한 표 보내러 가기 →</button></div>}</>}
   </section>
  </div>
  <div className="flex flex-wrap justify-between gap-3 mt-6"><button className="btn-ghost" onClick={()=>setStep(s=>s-1)} disabled={step===0}>← 이전</button>{step<3?<button className="btn-primary" disabled={step===2&&!sent} onClick={()=>setStep(s=>s+1)}>다음 단계 →</button>:<div className="flex flex-wrap gap-3"><button className="btn-ghost" onClick={restart}>다시 연습</button><Link className="btn-primary" to="/elections/new?template=activity">내 투표 만들기 →</Link></div>}</div>
  <section className="mt-14"><h2 className="text-xl font-extrabold mb-5">시작 전에 궁금한 점</h2><div className="space-y-3">{[
   ['학생마다 기기가 있어야 하나요?', '아니요. 한 대로 진행하면 명단 순서대로 돌아가며 투표할 수 있어요. 각자 기기가 있다면 선택지 화면의 개인 참여 링크를 복사해 공유하세요.'],
   ['선거에도 쓸 수 있나요?', '네. 대표 선거 예시를 고른 뒤 선택지에 후보 이름, 소개에 슬로건, 상세 설명에 공약을 적으세요. 이미지도 넣을 수 있어요.'],
   ['찬반 투표는 어떻게 만들어요?', '찬반 결정 예시를 고르세요. 찬성·반대에 더해 필요하면 더 이야기해요 같은 선택지를 둘 수 있어요. 단순 선택 한 개로 설정하면 됩니다.'],
   ['동점이거나 아직 투표하지 않은 학생이 있으면요?', '결과 화면은 현재까지 모인 표를 보여줘요. 모두 참여했는지 먼저 확인하세요. 동점은 미리 정한 기준에 따라 재투표·추첨·추가 논의를 진행하세요.'],
   ['개인정보와 접속 코드는 어떻게 다루나요?', '명단과 투표 기록은 서버에 저장돼요. 4자리 코드는 투표를 찾는 용도이며 개인 계정 인증은 아닙니다. 필요한 참여자에게만 코드와 링크를 공유하고, 이름·학번은 수업에 필요한 범위에서 입력하세요.'],
  ].map(([q,a])=><details className="card p-5" key={q}><summary className="cursor-pointer font-bold">{q}</summary><p className="text-sm text-slate-600 leading-relaxed mt-3">{a}</p></details>)}</div></section>
 </Page>
}
