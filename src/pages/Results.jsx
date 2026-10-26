import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import RevealCountdown, { Confetti } from '../components/RevealCountdown'
import BallotBox from '../components/BallotBox'
import { getElection, getClass, getBallots, tally, decideWinners , modeLabel } from '../lib/elections'
import TieNotice from '../components/TieNotice'

// 결과 집계 화면
export default function Results() {
  const { id, classId } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [klass, setKlass] = useState(null)
  const [rows, setRows] = useState(null)
  const [phase, setPhase] = useState('gate') // gate(발표 전) | counting | shown
  const [confetti, setConfetti] = useState(false)
  const [ballots, setBallots] = useState([]) // 투표함·수개표용 원본 투표지
  const [showBox, setShowBox] = useState(false)

  async function load() {
    const [e, k, b] = await Promise.all([
      getElection(id),
      getClass(id, classId),
      getBallots(id, classId),
    ])
    setElection(e)
    setKlass(k)
    setBallots(b)
    setRows(tally(e, b))
  }

  useEffect(() => {
    load()
  }, [id, classId])

  if (!election || !rows) return <Page title="집계 중…" />

  const ranked = election.voteMode === 'ranked'
  const { seats, sorted, tied, rule } = decideWinners(election, rows)
  const maxPoints = Math.max(1, ...rows.map((r) => r.points))
  const voted = klass?.voters?.filter((v) => v.hasVoted).length || 0
  const total = klass?.voters?.length || 0

  // ── 발표 전 대기 화면 ──
  if (phase === 'gate') {
    return (
      <Page
        title="투표 결과"
        subtitle={`${election.name}${klass ? ' · ' + klass.name : ''} · ${voted}/${total} 투표`}
      >
        <div className="card p-10 text-center">
          <div className="text-6xl mb-4">🗳️</div>
          <h2 className="text-2xl font-black">현재까지의 투표를 집계했어요</h2>
          <p className="text-slate-500 mt-2">
            준비되면 아래 버튼을 눌러 결과를 발표하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-8">
            <button
              className="btn-accent text-lg px-8 py-4"
              onClick={() => setPhase('counting')}
            >
              🥁 결과 발표하기
            </button>
            <button className="btn-ghost" onClick={() => setPhase('shown')}>
              바로 보기
            </button>
          </div>
        </div>
      </Page>
    )
  }

  // ── 3·2·1 카운트다운 ──
  if (phase === 'counting') {
    return (
      <RevealCountdown
        title={`${election.name}${klass ? ' · ' + klass.name : ''}`}
        onDone={() => {
          setPhase('shown')
          setConfetti(true)
          setTimeout(() => setConfetti(false), 6000)
        }}
      />
    )
  }

  return (
    <Page
      title="투표 결과"
      subtitle={`${election.name}${klass ? ' · ' + klass.name : ''} · ${voted}/${total} 투표`}
    >
      {confetti && <Confetti />}

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {modeLabel(election)} ·{' '}
          <b className="text-ink">상위 {seats}개 비교</b>
        </p>
        <button className="btn-ghost" onClick={load}>
          ↻ 새로고침
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map((r, i) => {
          const isWinner = ballots.length > 0 && i < seats && !tied.some(t => t.candidate.id === r.candidate.id)
          return (
          <div
            key={r.candidate.id}
            className={`card p-5 ${isWinner ? 'ring-2 ring-accent animate-winner' : 'opacity-75'}`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-black text-lg ${
                  isWinner ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-lg truncate">
                    <span className="text-slate-500 text-sm mr-1">기호{r.candidate.number}</span>
                    {r.candidate.name}
                    {isWinner && (
                      <span className="ml-2 text-accent text-sm font-bold">
                        {seats === 1 ? '✓ 상위 선택지' : `👑 선정 (${i + 1}위)`}
                      </span>
                    )}
                  </h3>
                  <span className="font-black text-xl">
                    {r.points}
                    <span className="text-sm text-slate-500 font-normal ml-0.5">
                      {ranked ? '점' : '표'}
                    </span>
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWinner ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${(r.points / maxPoints) * 100}%` }}
                  />
                </div>
                {ranked && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    {r.rankCounts.map((n, k) => `${k + 1}등 ${n}`).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {/* 동점 안내 */}
      {ballots.length > 0 && <TieNotice tied={tied} rule={rule} note={election.tieRule?.note} seats={seats} />}

      {/* 투표함 열어보기 — 부정투표가 아님을 눈으로 확인 */}
      <div className="card p-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="font-bold text-lg">🗳️ 투표함 열어보기 · 수개표</p>
          <p className="text-slate-500 text-sm mt-0.5">
            투표용지 {ballots.length}장을 한 장씩 꺼내 세어 봅니다. 이름은 적혀 있지 않아요.
          </p>
        </div>
        <button
          className="btn-accent w-full sm:w-auto px-6 py-3"
          disabled={ballots.length === 0}
          onClick={() => setShowBox(true)}
        >
          투표함 열기
        </button>
      </div>

      {showBox && (
        <BallotBox election={election} ballots={ballots} onClose={() => setShowBox(false)} />
      )}

      <div className="flex gap-2 mt-8">
        <button className="btn-ghost flex-1" onClick={() => nav('/elections')}>
          투표 목록으로
        </button>
        <button
          className="btn-primary flex-1"
          onClick={() => nav(`/elections/${id}/class/${classId}/vote`)}
        >
          투표 화면으로
        </button>
      </div>

      <div className="mt-4 text-center">
        <button className="btn-ghost" onClick={() => nav(`/elections/${id}/results`)}>
          🧮 전체 반 합산 결과 보기
        </button>
      </div>
    </Page>
  )
}
