import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page'
import { createElection, randomCode, randomUnusedCode, isCodeTaken, uid } from '../lib/elections'
import { uploadCandidateImage } from '../lib/storage'
import VoteModeGuide from '../components/VoteModeGuide'

// 새 선거 등록 — 이름, 4자리 코드, 투표 방식, 후보 목록
export default function ElectionNew() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState(randomCode())
  const [voteMode, setVoteMode] = useState('ranked')
  const [candidates, setCandidates] = useState([blankCandidate(1), blankCandidate(2)])
  const [saving, setSaving] = useState(false)
  const [codeErr, setCodeErr] = useState('')
  const [rolling, setRolling] = useState(false)

  // 아직 안 쓰인 코드로 새로 뽑기
  async function rollCode() {
    setRolling(true)
    setCodeErr('')
    try {
      setCode(await randomUnusedCode())
    } catch {
      setCode(randomCode())
    } finally {
      setRolling(false)
    }
  }

  function blankCandidate(number) {
    return { id: uid(), number, name: '', slogan: '', pledges: '', posterUrl: '', pledgeImageUrl: '' }
  }

  // 후보 수를 −/+ 로 조절 (1~20명). 늘리면 뒤에 추가, 줄이면 뒤에서 제거.
  function setCount(n) {
    const target = Math.max(1, Math.min(20, n))
    setCandidates((cs) => {
      if (target > cs.length) {
        const add = []
        for (let i = cs.length; i < target; i++) add.push(blankCandidate(i + 1))
        return [...cs, ...add]
      }
      if (target < cs.length) {
        return cs.slice(0, target).map((c, i) => ({ ...c, number: i + 1 }))
      }
      return cs
    })
  }
  function removeCandidate(id) {
    setCandidates((cs) => cs.filter((c) => c.id !== id).map((c, i) => ({ ...c, number: i + 1 })))
  }
  function patch(id, field, value) {
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const [uploadingKey, setUploadingKey] = useState(null) // `${id}:${field}` 업로드 중 표시

  // 이미지 파일 업로드 (포스터/공약 공용) — Storage 우선, 실패 시 압축 dataURL 폴백
  async function uploadImage(id, field, file) {
    if (!file) return
    setUploadingKey(`${id}:${field}`)
    try {
      const value = await uploadCandidateImage(file)
      patch(id, field, value)
    } catch (e) {
      console.error(e)
      alert(e.message || '이미지 처리 실패')
    } finally {
      setUploadingKey(null)
    }
  }

  const valid =
    name.trim() && code.length === 4 && candidates.every((c) => c.name.trim())

  async function save() {
    if (!valid) return
    // Firestore 문서 1MB 한도 방어 — 문서에 직접 담기는 이미지(dataURL 폴백) 총량이 크면 안내
    // (Storage에 올라간 경우는 짧은 URL이라 용량 부담이 없다.)
    const imgBytes = candidates.reduce(
      (s, c) => s + (c.posterUrl?.length || 0) + (c.pledgeImageUrl?.length || 0),
      0
    )
    if (imgBytes > 950 * 1024) {
      alert('이미지 용량이 너무 커요. 일부 이미지를 제거하거나 더 작은 사진으로 바꿔주세요.')
      return
    }
    setSaving(true)
    try {
      // 코드 중복 방지 — 같은 코드가 있으면 코드로 찾을 때 헷갈린다
      if (await isCodeTaken(code)) {
        setCodeErr('이미 사용 중인 코드예요. 🎲 를 눌러 다른 코드를 받아주세요.')
        setSaving(false)
        return
      }
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
                  onChange={(e) => {
                    setCodeErr('')
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }}
                />
                <button className="btn-ghost" onClick={rollCode} type="button" disabled={rolling}>
                  {rolling ? '…' : '🎲'}
                </button>
              </div>
              {codeErr ? (
                <p className="text-xs text-red-500 mt-1">{codeErr}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  이 코드로 다른 기기에서 선거를 찾아 들어와요. 학생·동료 선생님께 알려주세요.
                </p>
              )}
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
              <div className="mt-2">
                <VoteModeGuide voteMode={voteMode} variant="compact" />
              </div>
            </div>
          </div>
        </div>

        {/* 후보 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">입후보자</h2>
            {/* 후보 수 스테퍼 (−/+) */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-semibold mr-1">후보 수</span>
              <button
                type="button"
                className="btn-ghost w-11 h-11 !px-0 text-xl"
                onClick={() => setCount(candidates.length - 1)}
                disabled={candidates.length <= 1}
                aria-label="후보 수 줄이기"
              >
                −
              </button>
              <span className="w-12 text-center text-xl font-black tabular-nums">
                {candidates.length}
              </span>
              <button
                type="button"
                className="btn-ghost w-11 h-11 !px-0 text-xl"
                onClick={() => setCount(candidates.length + 1)}
                disabled={candidates.length >= 20}
                aria-label="후보 수 늘리기"
              >
                +
              </button>
            </div>
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
                  placeholder="공약 (여러 줄 입력 가능 · 아래에 이미지로도 올릴 수 있어요)"
                  value={c.pledges}
                  onChange={(e) => patch(c.id, 'pledges', e.target.value)}
                />

                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <ImageField
                    label="포스터 (선택)"
                    value={c.posterUrl}
                    uploading={uploadingKey === `${c.id}:posterUrl`}
                    onPick={(file) => uploadImage(c.id, 'posterUrl', file)}
                    onClear={() => patch(c.id, 'posterUrl', '')}
                    onUrl={(v) => patch(c.id, 'posterUrl', v)}
                  />
                  <ImageField
                    label="공약 이미지 (선택)"
                    value={c.pledgeImageUrl}
                    uploading={uploadingKey === `${c.id}:pledgeImageUrl`}
                    onPick={(file) => uploadImage(c.id, 'pledgeImageUrl', file)}
                    onClear={() => patch(c.id, 'pledgeImageUrl', '')}
                    onUrl={(v) => patch(c.id, 'pledgeImageUrl', v)}
                  />
                </div>
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

// 이미지 입력 (파일 업로드 + 미리보기 + URL 직접 입력) — 포스터/공약 공용
function ImageField({ label, value, uploading, onPick, onClear, onUrl }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 shrink-0 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
          {value ? (
            <img src={value} alt="미리보기" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-300 text-2xl">🖼️</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            <label className="btn-ghost cursor-pointer">
              {uploading ? '처리 중…' : '📷 파일 선택'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  onPick(e.target.files?.[0])
                  e.target.value = '' // 같은 파일 다시 선택 가능하도록 초기화
                }}
              />
            </label>
            {value && (
              <button type="button" className="btn-ghost text-red-500" onClick={onClear}>
                제거
              </button>
            )}
          </div>
          <input
            className="input mt-2 text-sm"
            placeholder="또는 이미지 URL"
            value={value?.startsWith('data:') ? '' : value || ''}
            onChange={(e) => onUrl(e.target.value)}
          />
        </div>
      </div>
    </div>
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
