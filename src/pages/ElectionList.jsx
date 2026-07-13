import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page'
import { listElections } from '../lib/elections'

// 등록된 선거 목록 → 선택하려면 4자리 코드 입력(잠금장치)
export default function ElectionList() {
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [selected, setSelected] = useState(null) // 코드 입력 대상 선거
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    listElections()
      .then(setRows)
      .catch((e) => {
        console.error(e)
        setRows([])
      })
  }, [])

  function openCode(election) {
    setSelected(election)
    setCode('')
    setErr('')
  }

  function confirmCode() {
    if (code !== selected.code) {
      setErr('코드가 일치하지 않습니다.')
      return
    }
    // 통과 → 반/명단 등록으로
    nav(`/elections/${selected.id}/class`)
  }

  return (
    <Page title="선거 선택" subtitle="참여할 선거를 고르세요. 선택하려면 4자리 코드가 필요해요.">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => nav('/elections/new')}>
          + 새 선거 등록
        </button>
      </div>

      {rows === null && <p className="text-slate-400">불러오는 중…</p>}

      {rows && rows.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-500">아직 등록된 선거가 없어요.</p>
          <button className="btn-primary mt-4" onClick={() => nav('/elections/new')}>
            첫 선거 등록하기
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {rows?.map((e) => (
          <button
            key={e.id}
            onClick={() => openCode(e)}
            className="card p-5 text-left hover:border-primary hover:shadow-md transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-ink group-hover:text-primary">{e.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  후보 {e.candidates?.length || 0}명 ·{' '}
                  {e.voteMode === 'ranked' ? '순위투표(1·2·3등)' : '단순 선택'}
                </p>
              </div>
              <span className="text-slate-300 text-xl">🔒</span>
            </div>
          </button>
        ))}
      </div>

      {/* 코드 입력 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20"
          onClick={() => setSelected(null)}
        >
          <div className="card p-6 w-full max-w-sm" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="font-bold text-lg">{selected.name}</h3>
            <p className="text-sm text-slate-500 mt-1">4자리 코드를 입력하세요.</p>
            <input
              className="input mt-4 text-center text-2xl tracking-[0.5em] font-bold"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={code}
              onChange={(ev) => {
                setErr('')
                setCode(ev.target.value.replace(/\D/g, '').slice(0, 4))
              }}
              onKeyDown={(ev) => ev.key === 'Enter' && confirmCode()}
              placeholder="0000"
            />
            {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1" onClick={() => setSelected(null)}>
                취소
              </button>
              <button
                className="btn-primary flex-1"
                disabled={code.length !== 4}
                onClick={confirmCode}
              >
                입장
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}
