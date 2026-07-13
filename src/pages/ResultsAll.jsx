import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import { getElection, getAllBallots, tally } from '../lib/elections'

// 전체 결과 — 반별 집계 + 원하는 반만 골라 합산
export default function ResultsAll() {
  const { id } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [groups, setGroups] = useState(null) // [{ klass, ballots }]
  const [included, setIncluded] = useState({}) // classId -> bool (합산 포함 여부)

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

  return (
    <Page title="전체 결과 · 반별 집계" subtitle={election.name}>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {ranked ? '순위투표 (1등 3점·2등 2점·3등 1점 합산)' : '단순 선택 (득표수)'}
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
              {includedCount}개 반 · {combinedBallots}표
            </span>
          </div>
          <ResultBars election={election} rows={combined} ranked={ranked} />
          <p className="text-xs text-slate-400 mt-3">
            아래 반 목록의 체크박스로 합산에 포함할 반을 고를 수 있어요.
          </p>
        </div>
      )}

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
        <button className="btn-ghost flex-1" onClick={() => nav('/elections')}>선거 목록으로</button>
      </div>
    </Page>
  )
}

// 결과 막대 목록
function ResultBars({ rows, ranked, compact }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-slate-400">집계할 표가 없어요.</p>
  const maxPoints = Math.max(1, ...rows.map((r) => r.points))
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {rows.map((r, i) => (
        <div key={r.candidate.id} className="flex items-center gap-3">
          <span
            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${
              i === 0 ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold truncate">
                <span className="text-slate-400 text-xs mr-1">기호{r.candidate.number}</span>
                {r.candidate.name}
                {i === 0 && <span className="ml-1.5 text-accent text-xs font-bold">👑</span>}
              </span>
              <span className="font-black">
                {r.points}
                <span className="text-xs text-slate-400 font-normal ml-0.5">{ranked ? '점' : '표'}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-primary'}`}
                style={{ width: `${(r.points / maxPoints) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
