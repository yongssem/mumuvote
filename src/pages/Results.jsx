import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import { getElection, getClass, getBallots, tally } from '../lib/elections'

// 결과 집계 화면
export default function Results() {
  const { id, classId } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [klass, setKlass] = useState(null)
  const [rows, setRows] = useState(null)

  async function load() {
    const [e, k, b] = await Promise.all([
      getElection(id),
      getClass(id, classId),
      getBallots(id, classId),
    ])
    setElection(e)
    setKlass(k)
    setRows(tally(e, b))
  }

  useEffect(() => {
    load()
  }, [id, classId])

  if (!election || !rows) return <Page title="집계 중…" />

  const ranked = election.voteMode === 'ranked'
  const maxPoints = Math.max(1, ...rows.map((r) => r.points))
  const voted = klass?.voters?.filter((v) => v.hasVoted).length || 0
  const total = klass?.voters?.length || 0

  return (
    <Page
      title="투표 결과"
      subtitle={`${election.name}${klass ? ' · ' + klass.name : ''} · ${voted}/${total} 투표`}
    >
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {ranked ? '순위투표 (1등 3점·2등 2점·3등 1점 합산)' : '단순 선택 (득표수)'}
        </p>
        <button className="btn-ghost" onClick={load}>
          ↻ 새로고침
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.candidate.id} className={`card p-5 ${i === 0 ? 'ring-2 ring-accent' : ''}`}>
            <div className="flex items-center gap-4">
              <span
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-black text-lg ${
                  i === 0 ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-lg truncate">
                    <span className="text-slate-400 text-sm mr-1">기호{r.candidate.number}</span>
                    {r.candidate.name}
                    {i === 0 && <span className="ml-2 text-accent text-sm font-bold">👑 1위</span>}
                  </h3>
                  <span className="font-black text-xl">
                    {r.points}
                    <span className="text-sm text-slate-400 font-normal ml-0.5">
                      {ranked ? '점' : '표'}
                    </span>
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-primary'}`}
                    style={{ width: `${(r.points / maxPoints) * 100}%` }}
                  />
                </div>
                {ranked && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    1등 {r.counts.first} · 2등 {r.counts.second} · 3등 {r.counts.third}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-8">
        <button className="btn-ghost flex-1" onClick={() => nav('/elections')}>
          선거 목록으로
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
