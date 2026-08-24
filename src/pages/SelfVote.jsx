import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getElection, getClass, submitSelfBallot, subscribeVotedIds } from '../lib/elections'
import Footer from '../components/Footer'
import CandidateDetailModal from '../components/CandidateDetailModal'
import VoteModeGuide from '../components/VoteModeGuide'
import { playComplete, playError } from '../lib/sound'

// 개별 투표 — 학생이 자기 태블릿에서 비밀 링크로 접속해 각자 투표
// 흐름: 이름 선택 → 후보 관찰 → 투표 → 완료
export default function SelfVote() {
  const { id, classId } = useParams()
  const [election, setElection] = useState(null)
  const [klass, setKlass] = useState(null)
  const [votedIds, setVotedIds] = useState(new Set())
  const [voter, setVoter] = useState(null) // 선택된 본인
  const [phase, setPhase] = useState('pick') // pick | observe | vote | done
  const [detail, setDetail] = useState(null) // 후보 상세 모달
  const [pending, setPending] = useState(null) // 학번 확인 대기 중인 후보
  const [codeInput, setCodeInput] = useState('')
  const [codeErr, setCodeErr] = useState('')

  const storeKey = `mumuvote_self_${classId}`

  useEffect(() => {
    getElection(id).then(setElection)
    getClass(id, classId).then(setKlass)
    const unsub = subscribeVotedIds(id, classId, setVotedIds)
    return unsub
  }, [id, classId])

  // 이 기기에서 이미 투표한 기록이 있으면 완료 화면으로
  useEffect(() => {
    if (!klass) return
    const saved = localStorage.getItem(storeKey)
    if (saved) {
      const me = klass.voters?.find((v) => v.id === saved)
      if (me) {
        setVoter(me)
        setPhase('done')
      }
    }
  }, [klass])

  const voters = useMemo(
    () => (klass?.voters || []).slice().sort((a, b) => a.order - b.order),
    [klass]
  )
  const votedCount = voters.filter((v) => votedIds.has(v.id)).length

  if (!election || !klass) return <Centered>불러오는 중…</Centered>

  // 이름을 눌렀을 때: 학번이 있으면 본인 확인 모달, 없으면 바로 진행
  function tapName(v) {
    if (v.studentNo) {
      setPending(v)
      setCodeInput('')
      setCodeErr('')
    } else {
      setVoter(v)
      setPhase('observe')
    }
  }

  // 학번 확인
  function confirmCode() {
    if (codeInput !== pending.studentNo) {
      setCodeErr('학번이 일치하지 않습니다.')
      playError()
      return
    }
    setVoter(pending)
    setPending(null)
    setPhase('observe')
  }

  // ── 완료 화면 ──
  if (phase === 'done') {
    return (
      <Shell election={election} klass={klass} done={votedCount} total={voters.length}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-black">투표 완료!</h1>
            <p className="text-slate-500 mt-2">
              {voter?.name}님, 소중한 한 표 감사합니다.
            </p>
            <p className="text-slate-400 text-sm mt-1">이 태블릿은 다음 사람에게 넘겨주세요.</p>
            <button
              className="btn-ghost mt-8"
              onClick={() => {
                localStorage.removeItem(storeKey)
                setVoter(null)
                setPhase('pick')
              }}
            >
              다른 학생이 이 기기로 투표하기
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  // ── 이름 선택 화면 ──
  if (phase === 'pick') {
    return (
      <Shell election={election} klass={klass} done={votedCount} total={voters.length}>
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          <h1 className="text-2xl font-black text-center">내 이름을 선택하세요</h1>
          <p className="text-slate-500 text-center mt-1 mb-6">
            {klass.name} · 이름을 누르면 <b>학번</b>으로 본인 확인을 해요. 이미 투표한 이름은
            선택할 수 없어요.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {voters.map((v) => {
              const voted = votedIds.has(v.id)
              return (
                <button
                  key={v.id}
                  disabled={voted}
                  onClick={() => tapName(v)}
                  className={`card p-4 text-center font-bold transition ${
                    voted
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-primary hover:ring-2 hover:ring-primary/30'
                  }`}
                >
                  <span className="block text-xs text-slate-400 font-normal">
                    {v.studentNo ? `학번 ${v.studentNo}` : `${v.order}번`}
                  </span>
                  <span className="text-lg">{v.name}</span>
                  {voted && <span className="block text-xs text-emerald-500 mt-1">투표함</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 학번 본인 확인 모달 */}
        {pending && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20"
            onClick={() => setPending(null)}
          >
            <div className="card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-black text-lg">{pending.name} 님 맞나요?</h3>
              <p className="text-sm text-slate-500 mt-1">
                본인 <b>학번</b>을 입력해야 투표할 수 있어요. (실수 방지)
              </p>
              <input
                className="input mt-4 text-center text-2xl tracking-[0.3em] font-bold"
                inputMode="numeric"
                autoFocus
                value={codeInput}
                onChange={(e) => {
                  setCodeErr('')
                  setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 8))
                }}
                onKeyDown={(e) => e.key === 'Enter' && confirmCode()}
                placeholder="학번"
              />
              {codeErr && <p className="text-red-500 text-sm mt-2">{codeErr}</p>}
              <div className="flex gap-2 mt-5">
                <button className="btn-ghost flex-1" onClick={() => setPending(null)}>
                  취소
                </button>
                <button className="btn-primary flex-1" disabled={!codeInput} onClick={confirmCode}>
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </Shell>
    )
  }

  // 안전장치: 내가 고른 이름이 그새 투표되면 이름 선택으로 되돌림
  if (voter && votedIds.has(voter.id) && phase !== 'done') {
    return (
      <Shell election={election} klass={klass} done={votedCount} total={voters.length}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🔒</div>
            <p className="font-bold text-lg">{voter.name}님은 이미 투표했어요.</p>
            <button className="btn-primary mt-6" onClick={() => { setVoter(null); setPhase('pick') }}>
              이름 다시 선택
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  // ── 후보 관찰 화면 ──
  if (phase === 'observe') {
    return (
      <Shell election={election} klass={klass} done={votedCount} total={voters.length}>
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
          <p className="text-slate-400 font-semibold text-center">{voter.name}님</p>
          <h1 className="text-2xl font-black text-center mt-1">후보를 살펴보세요</h1>
          <p className="text-slate-500 text-center mt-1 mb-4">
            카드를 눌러 공약과 포스터를 확인한 뒤, 아래 버튼으로 투표를 시작하세요.
          </p>
          {/* 투표 방식 설명 */}
          <div className="mb-5">
            <VoteModeGuide voteMode={election.voteMode} />
          </div>
          <CandidateGrid candidates={election.candidates} onPick={(cid) => setDetail(election.candidates.find((c) => c.id === cid))} />
          <div className="sticky bottom-4 mt-8 flex flex-col items-center gap-2">
            <button className="btn-accent text-lg px-10 py-4 shadow-lg" onClick={() => setPhase('vote')}>
              🗳️ 투표하러 가기 →
            </button>
            <button
              className="btn-ghost text-sm"
              onClick={() => { setVoter(null); setPhase('pick') }}
            >
              내가 아니에요 · 이름 다시 선택
            </button>
          </div>
        </div>
        <CandidateDetailModal candidate={detail} onClose={() => setDetail(null)} />
      </Shell>
    )
  }

  // ── 투표 화면 ──
  return (
    <Shell election={election} klass={klass} done={votedCount} total={voters.length}>
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <p className="text-slate-400 font-semibold text-center">{voter.name}님의 투표</p>
        <VoteBox
          election={election}
          onCancel={() => setPhase('observe')}
          onSubmit={async (ballotData) => {
            await submitSelfBallot(id, classId, voter, ballotData)
            localStorage.setItem(storeKey, voter.id)
            playComplete()
            setPhase('done')
          }}
        />
      </div>
    </Shell>
  )
}

// 투표 UI (순위/단순 선택) — 제출 시 onSubmit(ballotData)
function VoteBox({ election, onSubmit, onCancel }) {
  const ranked = election.voteMode === 'ranked'
  const [picks, setPicks] = useState({ first: null, second: null, third: null })
  const [busy, setBusy] = useState(false)

  const currentRank = !picks.first ? 'first' : !picks.second ? 'second' : !picks.third ? 'third' : 'confirm'
  const rankLabel = { first: '1등', second: '2등', third: '3등' }
  const chosenIds = [picks.first, picks.second, picks.third].filter(Boolean)
  const reset = () => setPicks({ first: null, second: null, third: null })

  async function submit(data) {
    setBusy(true)
    try {
      await onSubmit(data)
    } catch (e) {
      console.error(e)
      alert('투표 저장 실패: ' + e.message)
      setBusy(false)
    }
  }

  if (ranked && currentRank === 'confirm') {
    const find = (cid) => election.candidates.find((c) => c.id === cid)
    return (
      <div className="max-w-md mx-auto mt-4">
        <h1 className="text-2xl font-black mb-1 text-center">선택 확인</h1>
        <p className="text-slate-500 mb-6 text-center">이대로 투표할까요?</p>
        <div className="space-y-3">
          {[['first', picks.first], ['second', picks.second], ['third', picks.third]].map(([rank, cid]) => {
            const c = find(cid)
            return (
              <div key={rank} className="card p-4 flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center">
                  {rankLabel[rank]}
                </span>
                <div>
                  <p className="font-bold text-lg">{c?.name}</p>
                  <p className="text-sm text-slate-500">기호 {c?.number}번</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 mt-6">
          <button className="btn-ghost flex-1" onClick={reset} disabled={busy}>다시 선택</button>
          <button
            className="btn-primary flex-1"
            disabled={busy}
            onClick={() => submit({ first: picks.first, second: picks.second, third: picks.third })}
          >
            {busy ? '제출 중…' : '투표 제출'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {ranked ? (
        <>
          <h1 className="text-2xl font-black mb-1 text-center">
            <span className="text-primary">{rankLabel[currentRank]}</span> 후보를 선택하세요
          </h1>
          <p className="text-slate-500 mb-3 text-center">
            이미 고른 후보는 제외됩니다. {chosenIds.length > 0 && `(${chosenIds.length}/3 선택)`}
          </p>
          <div className="mb-5">
            <VoteModeGuide voteMode="ranked" variant="compact" />
          </div>
          <CandidateGrid
            candidates={election.candidates.filter((c) => !chosenIds.includes(c.id))}
            onPick={(cid) => setPicks((p) => ({ ...p, [currentRank]: cid }))}
          />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-black mb-1 text-center">지지하는 후보를 선택하세요</h1>
          <p className="text-slate-500 mb-5 text-center">한 명만 선택할 수 있어요.</p>
          <CandidateGrid
            candidates={election.candidates}
            disabled={busy}
            onPick={(cid) => submit({ choice: cid })}
          />
        </>
      )}
      <div className="flex justify-center mt-6">
        <button className="btn-ghost" onClick={chosenIds.length > 0 ? reset : onCancel} disabled={busy}>
          {chosenIds.length > 0 ? '처음부터 다시' : '후보 다시 보기'}
        </button>
      </div>
    </div>
  )
}

// 후보 선택 그리드
function CandidateGrid({ candidates, onPick, disabled }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {candidates.map((c) => (
        <button
          key={c.id}
          disabled={disabled}
          onClick={() => onPick(c.id)}
          className="card overflow-hidden text-left hover:border-primary hover:ring-2 hover:ring-primary/30 transition disabled:opacity-50"
        >
          <div className="aspect-[4/3] bg-slate-100 relative flex items-center justify-center overflow-hidden">
            {c.posterUrl ? (
              <img src={c.posterUrl} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-300 text-5xl font-black">{c.number}</div>
            )}
            <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold rounded-full px-2.5 py-1">
              기호 {c.number}번
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-lg">{c.name}</h3>
            {c.slogan && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{c.slogan}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}

// 상단 진행바 + 레이아웃 (Page와 별개로, 학생 전용 몰입 레이아웃)
function Shell({ election, klass, done, total, children }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="min-h-full flex flex-col bg-gradient-to-b from-indigo-50 to-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">
              {election.name} <span className="text-slate-400 font-normal">· {klass.name}</span>
            </span>
            <span className="text-slate-500">{done} / {total} 투표</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
      <Footer />
    </div>
  )
}
