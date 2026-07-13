import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page'
import { createElection, randomCode, uid } from '../lib/elections'

// 새 선거 등록 — 이름, 4자리 코드, 투표 방식, 후보 목록
export default function ElectionNew() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState(randomCode())
  const [voteMode, setVoteMode] = useState('ranked')
  const [candidates, setCandidates] = useState([blankCandidate(1), blankCandidate(2)])
  const [saving, setSaving] = useState(false)

  function blankCandidate(number) {
    return { id: uid(), number, name: '', slogan: '', pledges: '', posterUrl: '' }
  }

  function addCandidate() {
    setCandidates((cs) => [...cs, blankCandidate(cs.length + 1)])
  }
  function removeCandidate(id) {
    setCandidates((cs) => cs.filter((c) => c.id !== id).map((c, i) => ({ ...c, number: i + 1 })))
  }
  function patch(id, field, value) {
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const valid =
    name.trim() && code.length === 4 && candidates.every((c) => c.name.trim())

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const id = await createElection({
        name: name.trim(),
        code,
        voteMode,
        candidates: candidates.map((c) => ({
          ...c,
          name: c.name.trim(),
          slogan: c.slogan.trim(),
          pledges: c.pledges.trim(),
          posterUrl: c.posterUrl.trim(),
        })),
      })
      nav(`/elections/${id}/class`)
    } catch (e) {
      console.error(e)
      alert('저장 실패: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <Page title="새 선거 등록" subtitle="선거 정보와 후보를 등록하세요.">
      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">선거 이름</label>
            <input
              className="input"
              placeholder="예: 삼향초 5학년 대표선거"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">4자리 접속 코드</label>
              <div className="flex gap-2">
                <input
                  className="input text-center text-xl tracking-[0.4em] font-bold"
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <button className="btn-ghost" onClick={() => setCode(randomCode())} type="button">
                  🎲
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">이 코드를 아는 사람만 선거에 입장할 수 있어요.</p>
            </div>

            <div>
              <label className="label">투표 방식</label>
              <div className="grid grid-cols-2 gap-2">
                <ModeBtn active={voteMode === 'ranked'} onClick={() => setVoteMode('ranked')}>
                  순위투표
                  <span className="block text-xs font-normal opacity-70">1·2·3등 선택</span>
                </ModeBtn>
                <ModeBtn active={voteMode === 'single'} onClick={() => setVoteMode('single')}>
                  단순 선택
                  <span className="block text-xs font-normal opacity-70">한 명만 선택</span>
                </ModeBtn>
              </div>
            </div>
          </div>
        </div>

        {/* 후보 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">입후보자 ({candidates.length})</h2>
            <button className="btn-ghost" onClick={addCandidate} type="button">
              + 후보 추가
            </button>
          </div>

          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-2 font-bold text-primary">
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      {c.number}
                    </span>
                    기호 {c.number}번
                  </span>
                  {candidates.length > 1 && (
                    <button
                      className="text-slate-400 hover:text-red-500 text-sm"
                      onClick={() => removeCandidate(c.id)}
                      type="button"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="후보 이름"
                    value={c.name}
                    onChange={(e) => patch(c.id, 'name', e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="한 줄 슬로건"
                    value={c.slogan}
                    onChange={(e) => patch(c.id, 'slogan', e.target.value)}
                  />
                </div>
                <textarea
                  className="input mt-3 min-h-[80px]"
                  placeholder="공약 (여러 줄 입력 가능)"
                  value={c.pledges}
                  onChange={(e) => patch(c.id, 'pledges', e.target.value)}
                />
                <input
                  className="input mt-3"
                  placeholder="포스터 이미지 URL (선택)"
                  value={c.posterUrl}
                  onChange={(e) => patch(c.id, 'posterUrl', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => nav('/elections')} type="button">
            취소
          </button>
          <button className="btn-primary flex-1" disabled={!valid || saving} onClick={save}>
            {saving ? '저장 중…' : '선거 등록하고 계속 →'}
          </button>
        </div>
      </div>
    </Page>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2.5 text-sm font-semibold border transition ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
