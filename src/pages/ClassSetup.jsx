import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import { getElection, createClass, uid } from '../lib/elections'

// 반 입력 + 투표인단 명단 등록 (한 줄에 한 명)
export default function ClassSetup() {
  const { id } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [className, setClassName] = useState('')
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getElection(id).then(setElection)
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

  return (
    <Page
      title="우리 반 · 투표인단 등록"
      subtitle={election ? election.name : '불러오는 중…'}
      maxWidth="max-w-2xl"
    >
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
          <button className="btn-ghost" onClick={() => nav('/elections')} type="button">
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
