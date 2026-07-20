import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import { getElection, listClasses, createClass, uid } from '../lib/elections'

// 반 선택/등록 — 이미 만든 반이 있으면 목록에서 이어가고, 없거나 원할 때만 새로 등록
export default function ClassSetup() {
  const { id } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [classes, setClasses] = useState(null)
  const [mode, setMode] = useState('list') // list | new

  // 새 반 등록 폼 상태
  const [className, setClassName] = useState('')
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() {
    const list = await listClasses(id)
    setClasses(list)
    // 등록된 반이 없으면 곧바로 새 반 등록 화면으로
    setMode(list.length === 0 ? 'new' : 'list')
  }

  useEffect(() => {
    getElection(id).then(setElection)
    reload()
  }, [id])

  const names = raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  async function save() {
    if (!className.trim() || names.length === 0) return
    setSaving(true)
    try {
      const voters = names.map((n, i) => ({
        id: uid(),
        name: n,
        order: i + 1,
        hasVoted: false,
      }))
      const classId = await createClass(id, { name: className.trim(), voters })
      nav(`/elections/${id}/class/${classId}/candidates`)
    } catch (e) {
      console.error(e)
      alert('저장 실패: ' + e.message)
      setSaving(false)
    }
  }

  if (!election || classes === null) {
    return <Page title="불러오는 중…" subtitle={election?.name} />
  }

  // ── 새 반 등록 화면 ──
  if (mode === 'new') {
    return (
      <Page title="우리 반 · 투표인단 등록" subtitle={election.name} maxWidth="max-w-2xl">
        <div className="space-y-5">
          <div className="card p-5">
            <label className="label">반 이름</label>
            <input
              className="input"
              placeholder="예: 5학년 3반"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">투표인단 명단</label>
              <span className="text-sm font-semibold text-primary">{names.length}명</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              한 줄에 한 명씩 이름을 입력하세요. 입력한 <b>순서대로</b> 투표를 진행해요.
            </p>
            <textarea
              className="input min-h-[240px] font-mono text-sm"
              placeholder={'김민준\n이서연\n박도윤\n최지우\n…'}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="btn-ghost"
              onClick={() => (classes.length > 0 ? setMode('list') : nav('/elections'))}
              type="button"
            >
              뒤로
            </button>
            <button
              className="btn-primary flex-1"
              disabled={!className.trim() || names.length === 0 || saving}
              onClick={save}
            >
              {saving ? '저장 중…' : '명단 등록하고 후보 보기 →'}
            </button>
          </div>
        </div>
      </Page>
    )
  }

  // ── 반 선택 화면 (이미 등록된 반이 있을 때) ──
  return (
    <Page
      title="반 선택"
      subtitle={`${election.name} · 이어서 진행할 반을 고르거나 새 반을 등록하세요.`}
      maxWidth="max-w-2xl"
    >
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setMode('new')}>
          + 새 반 등록
        </button>
      </div>

      <div className="space-y-3">
        {classes.map((k) => {
          const total = k.voters?.length || 0
          return (
            <button
              key={k.id}
              onClick={() => nav(`/elections/${id}/class/${k.id}/candidates`)}
              className="card p-5 w-full text-left hover:border-primary hover:shadow-md transition group flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-lg text-ink group-hover:text-primary">{k.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">투표인단 {total}명</p>
              </div>
              <span className="text-primary font-semibold text-sm whitespace-nowrap">
                이어서 진행 →
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-8">
        <button className="btn-ghost flex-1" onClick={() => nav('/elections')}>
          선거 목록으로
        </button>
        <button className="btn-ghost flex-1" onClick={() => nav(`/elections/${id}/results`)}>
          🧮 전체 결과 보기
        </button>
      </div>
    </Page>
  )
}
