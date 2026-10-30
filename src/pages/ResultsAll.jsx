import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import RevealCountdown, { Confetti } from '../components/RevealCountdown'
import { getElection, getAllBallots, tally, decideWinners , modeLabel } from '../lib/elections'
import TieNotice from '../components/TieNotice'

// 전체 결과 — 반별 집계 + 원하는 반만 골라 합산
export default function ResultsAll() {
  const { id } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [groups, setGroups] = useState(null) // [{ klass, ballots }]
  const [included, setIncluded] = useState({}) // classId -> bool (합산 포함 여부)
  const [phase, setPhase] = useState('gate') // gate(발표 전) | counting | shown
  const [confetti, setConfetti] = useState(false)

  async function load() {
    const [e, g] = await Promise.all([getElection(id), getAllBallots(id)])
    setElection(e)
    setGroups(g)
    setIncluded((prev) => {
      const next = { ...prev }
      for (const grp of g) if (!(grp.klass.id in next)) next[grp.klass.id] = true
      return next
    })
  }

  useEffect(() => {
    load()
  }, [id])

  const ranked = election?.voteMode === 'ranked'

  // 선택된 반들의 투표지를 합쳐 합산 집계
  const combined = useMemo(() => {
    if (!election || !groups) return null
    const merged = groups
      .filter((g) => included[g.klass.id])
      .flatMap((g) => g.ballots)
    return tally(election, merged)
  }, [election, groups, included])

  if (!election || !groups) return <Page title="집계 중…" />

  const includedCount = groups.filter((g) => included[g.klass.id]).length
  const combinedBallots = groups.filter((g) => included[g.klass.id]).reduce((s, g) => s + g.ballots.length, 0)
  const totalBallots = groups.reduce((s, g) => s + g.ballots.length, 0)

  // 합산 결과가 곧 최종 결과 → 여기서만 선정자를 가린다 (반별은 부분 결과라 순위만 표시)
  const { seats: cSeats, sorted: cSorted, tied: cTied, rule: cRule } = decideWinners(
    election,
    combined || []
  )

  // ── 발표 전 대기 화면 ──
  if (phase === 'gate' && groups.length > 0) {
    return (
      <Page title="전체 결과 · 반별 집계" subtitle={election.name}>
        <div className="card p-10 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-black">전체 현재까지의 투표를 집계했어요</h2>
          <p className="text-slate-500 mt-2">
            {groups.length}개 반 · 총 {totalBallots}표 · 준비되면 결과를 발표하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-8">
            <button className="btn-accent text-lg px-8 py-4" onClick={() => setPhase('counting')}>
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
        title={election.name}
        onDone={() => {
          setPhase('shown')
          setConfetti(true)
          setTimeout(() => setConfetti(false), 6000)
        }}
      />
    )
  }

  return (
    <Page title="전체 결과 · 반별 집계" subtitle={election.name}>
      {confetti && <Confetti />}

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {modeLabel(election)}
        </p>
        <button className="btn-ghost" onClick={load}>↻ 새로고침</button>
      </div>

      {groups.length === 0 && (
        <div className="card p-10 text-center text-slate-500">아직 등록된 반이 없어요.</div>
      )}

      {/* 합산 결과 */}
      {groups.length > 0 && (
        <div className="card p-5 mb-6 ring-2 ring-primary/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-lg">🧮 합산 결과</h2>
            <span className="text-sm text-slate-500">
              {includedCount}개 반 · {combinedBallots}표 · <b className="text-ink">상위 {cSeats}개 비교</b>
            </span>
          </div>
          <ResultBars election={election} rows={cSorted} ranked={ranked} seats={combinedBallots > 0 ? cSeats : 0} tied={cTied} />
          <p className="text-xs text-slate-500 mt-3">
            아래 반 목록의 체크박스로 합산에 포함할 반을 고를 수 있어요.
          </p>
        </div>
      )}

      {/* 동점 안내 (합산 기준) */}
      {combinedBallots > 0 && <TieNotice tied={cTied} rule={cRule} note={election.tieRule?.note} seats={cSeats} />}

      {/* 반별 결과 */}
      <div className="space-y-4">
        {groups.map((g) => {
          const rows = tally(election, g.ballots)
          const votedCount = g.ballots.length // 개별 투표는 ballots 기준이 정확
          const total = g.klass.voters?.length || 0
          return (
            <div key={g.klass.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#4F46E5]"
                    checked={!!included[g.klass.id]}
                    onChange={(e) =>
                      setIncluded((prev) => ({ ...prev, [g.klass.id]: e.target.checked }))
                    }
                  />
                  <span className="font-bold text-lg">{g.klass.name}</span>
                </label>
                <span className="text-sm text-slate-500">{votedCount}/{total} 투표</span>
              </div>
              <ResultBars election={election} rows={rows} ranked={ranked} compact />
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 mt-8">
        <button className="btn-ghost flex-1" onClick={() => nav('/elections')}>투표 목록으로</button>
      </div>
    </Page>
  )
}

// 결과 막대 목록
function ResultBars({ rows, ranked, compact, seats, tied = [] }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-slate-500">집계할 표가 없어요.</p>
  const maxPoints = Math.max(1, ...rows.map((r) => r.points))
  const winnerCount = seats || 0
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {rows.map((r, i) => (
        <div key={r.candidate.id} className="flex items-center gap-3">
          <span
            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${
              i < winnerCount && !tied.some(t => t.candidate.id === r.candidate.id) ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold truncate">
                <span className="text-slate-500 text-xs mr-1">기호{r.candidate.number}</span>
                {r.candidate.name}
                {i < winnerCount && !tied.some(t => t.candidate.id === r.candidate.id) && <span className="ml-1.5 text-accent text-xs font-bold">👑</span>}
              </span>
              <span className="font-black">
                {r.points}
                <span className="text-xs text-slate-500 font-normal ml-0.5">{ranked ? '점' : '표'}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${i < winnerCount && !tied.some(t => t.candidate.id === r.candidate.id) ? 'bg-accent' : 'bg-primary'}`}
                style={{ width: `${(r.points / maxPoints) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
