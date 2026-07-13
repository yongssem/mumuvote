import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getElection, getClass, submitBallot, updateVoters } from '../lib/elections'
import Footer from '../components/Footer'

// 투표 진행 — 투표인단이 순서대로 등장해 투표
export default function Voting() {
  const { id, classId } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [voters, setVoters] = useState(null) // 로컬 가변 사본
  const [phase, setPhase] = useState('ready') // ready | voting
  const [picks, setPicks] = useState({ first: null, second: null, third: null })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getElection(id).then(setElection)
    getClass(id, classId).then((k) => setVoters(k?.voters || []))
  }, [id, classId])

  const currentVoter = useMemo(
    () => voters?.slice().sort((a, b) => a.order - b.order).find((v) => !v.hasVoted),
    [voters]
  )
  const total = voters?.length || 0
  const done = voters?.filter((v) => v.hasVoted).length || 0

  if (!election || !voters) {
    return <Centered>불러오는 중…</Centered>
  }

  // 모든 투표 완료
  if (!currentVoter) {
    return (
      <Centered>
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-black">투표 완료!</h1>
          <p className="text-slate-500 mt-2">
            {total}명 전원이 투표를 마쳤습니다.
          </p>
          <button
            className="btn-primary text-lg px-8 py-4 mt-8"
            onClick={() => nav(`/elections/${id}/class/${classId}/results`)}
          >
            📊 결과 보기
          </button>
        </div>
      </Centered>
    )
  }

  const ranked = election.voteMode === 'ranked'

  // 현재 단계(순위투표에서 몇 등을 뽑는 중인지)
  const currentRank = !picks.first ? 'first' : !picks.second ? 'second' : !picks.third ? 'third' : 'confirm'
  const rankLabel = { first: '1등', second: '2등', third: '3등' }
  const chosenIds = [picks.first, picks.second, picks.third].filter(Boolean)

  function pickRanked(candidateId) {
    setPicks((p) => ({ ...p, [currentRank]: candidateId }))
  }

  function resetPicks() {
    setPicks({ first: null, second: null, third: null })
  }

  async function finishVote(ballotData) {
    setBusy(true)
    try {
      await submitBallot(id, classId, { voterId: currentVoter.id, voterName: currentVoter.name, ...ballotData })
      const next = voters.map((v) => (v.id === currentVoter.id ? { ...v, hasVoted: true } : v))
      await updateVoters(id, classId, next)
      setVoters(next)
      resetPicks()
      setPhase('ready')
    } catch (e) {
      console.error(e)
      alert('투표 저장 실패: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  // ── 준비(핸드오프) 화면 ──
  if (phase === 'ready') {
    return (
      <div className="min-h-full flex flex-col bg-gradient-to-b from-indigo-50 to-slate-50">
        <ProgressBar done={done} total={total} name={election.name} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-slate-400 font-semibold">
              {currentVoter.order}번째 투표자
            </p>
            <h1 className="text-5xl font-black mt-2">{currentVoter.name}</h1>
            <p className="text-slate-500 mt-3">
              님, 투표할 차례입니다. 준비되면 시작하세요.
            </p>
            <button
              className="btn-accent text-xl px-10 py-5 mt-10"
              onClick={() => setPhase('voting')}
            >
              투표 시작하기 →
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ── 투표 화면 ──
  return (
    <div className="min-h-full flex flex-col">
      <ProgressBar done={done} total={total} name={election.name} />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-slate-400 font-semibold">{currentVoter.order}번째 · {currentVoter.name}</p>
        </div>

        {ranked ? (
          currentRank === 'confirm' ? (
            <RankConfirm
              election={election}
              picks={picks}
              rankLabel={rankLabel}
              busy={busy}
              onReset={resetPicks}
              onSubmit={() => finishVote({ first: picks.first, second: picks.second, third: picks.third })}
            />
          ) : (
            <>
              <h1 className="text-2xl font-black mb-1">
                <span className="text-primary">{rankLabel[currentRank]}</span> 후보를 선택하세요
              </h1>
              <p className="text-slate-500 mb-5">
                이미 고른 후보는 제외됩니다. {chosenIds.length > 0 && `(${chosenIds.length}/3 선택)`}
              </p>
              <CandidateGrid
                candidates={election.candidates.filter((c) => !chosenIds.includes(c.id))}
                onPick={pickRanked}
              />
              {chosenIds.length > 0 && (
                <button className="btn-ghost mt-5" onClick={resetPicks}>
                  처음부터 다시
                </button>
              )}
            </>
          )
        ) : (
          <>
            <h1 className="text-2xl font-black mb-1">지지하는 후보를 선택하세요</h1>
            <p className="text-slate-500 mb-5">한 명만 선택할 수 있어요.</p>
            <CandidateGrid
              candidates={election.candidates}
              disabled={busy}
              onPick={(cid) => finishVote({ choice: cid })}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

// 진행 바
function ProgressBar({ done, total, name }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">{name}</span>
          <span className="text-slate-500">
            {done} / {total} 완료
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
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

// 순위투표 최종 확인
function RankConfirm({ election, picks, rankLabel, onReset, onSubmit, busy }) {
  const find = (cid) => election.candidates.find((c) => c.id === cid)
  const rows = [
    ['first', picks.first],
    ['second', picks.second],
    ['third', picks.third],
  ]
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-black mb-1 text-center">선택 확인</h1>
      <p className="text-slate-500 mb-6 text-center">이대로 투표할까요?</p>
      <div className="space-y-3">
        {rows.map(([rank, cid]) => {
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
        <button className="btn-ghost flex-1" onClick={onReset} disabled={busy}>
          다시 선택
        </button>
        <button className="btn-primary flex-1" onClick={onSubmit} disabled={busy}>
          {busy ? '제출 중…' : '투표 제출'}
        </button>
      </div>
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
