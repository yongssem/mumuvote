import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page'
import { listMyElections, findElectionsByCode } from '../lib/elections'

// 투표 선택 — 이 기기에서 만든 투표는 바로 보이고, 다른 투표는 4자리 코드로 찾는다.
export default function ElectionList() {
  const nav = useNavigate()
  const [mine, setMine] = useState(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [searching, setSearching] = useState(false)
  const [found, setFound] = useState(null) // 같은 코드가 여러 개일 때 고르는 목록

  useEffect(() => {
    listMyElections()
      .then(setMine)
      .catch((e) => {
        console.error(e)
        setMine([])
      })
  }, [])

  // 코드로 투표 찾기
  async function search() {
    if (code.length !== 4) return
    setSearching(true)
    setErr('')
    setFound(null)
    try {
      const rows = await findElectionsByCode(code)
      if (rows.length === 0) {
        setErr('그 코드를 가진 투표가 없어요. 코드를 다시 확인해 주세요.')
      } else if (rows.length === 1) {
        nav(`/elections/${rows[0].id}/class`)
      } else {
        // 드물게 같은 코드가 여럿일 수 있어 직접 고르게 한다
        setFound(rows)
      }
    } catch (e) {
      console.error(e)
      setErr('찾는 중 문제가 생겼어요: ' + e.message)
    } finally {
      setSearching(false)
    }
  }

  return (
    <Page
      title="투표 선택"
      subtitle="이 기기에서 만든 투표가 보여요. 다른 투표는 4자리 코드로 찾을 수 있어요."
    >
      {/* 코드로 찾기 */}
      <div className="card p-5">
        <label className="label">4자리 코드로 투표 찾기</label>
        <p className="text-xs text-slate-500 mb-2">
          다른 기기에서 만든 투표는 선생님께 받은 <b>4자리 코드</b>를 입력해 들어갑니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input text-center text-2xl tracking-[0.5em] font-bold sm:max-w-[220px]"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => {
              setErr('')
              setFound(null)
              setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
            }}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            aria-label="4자리 접속 코드"
            placeholder="0000"
          />
          <button
            className="btn-primary flex-1 sm:flex-none sm:px-8"
            disabled={code.length !== 4 || searching}
            onClick={search}
          >
            {searching ? '찾는 중…' : '입장'}
          </button>
        </div>
        {err && <p className="text-red-500 text-sm mt-2">{err}</p>}

        {/* 같은 코드가 여러 개일 때 */}
        {found && (
          <div className="mt-4">
            <p className="text-sm text-slate-500 mb-2">
              같은 코드의 투표가 {found.length}개 있어요. 들어갈 투표를 골라주세요.
            </p>
            <div className="space-y-2">
              {found.map((e) => (
                <button
                  key={e.id}
                  className="card p-4 w-full text-left"
                  onClick={() => nav(`/elections/${e.id}/class`)}
                >
                  <h3 className="font-bold">{e.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    선택지 {e.candidates?.length || 0}개 ·{' '}
                    {e.voteMode === 'ranked' ? '순위투표' : '단순 선택'} ·{' '}
                    {fmtDate(e.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 내가 만든 투표 */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="font-bold text-lg">이 기기에서 만든 투표</h2>
        <button className="btn-primary" onClick={() => nav('/elections/new')}>
          + 새 투표 만들기
        </button>
      </div>

      {mine === null && <p className="text-slate-500">불러오는 중…</p>}

      {mine && mine.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-500">
            이 기기에서 만든 투표가 아직 없어요.
            <br />새 투표를 등록하거나, 위에서 <b>코드로 찾아</b> 들어가세요.
          </p>
          <button className="btn-primary mt-4" onClick={() => nav('/elections/new')}>
            첫 투표 등록하기
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {mine?.map((e) => (
          <button
            key={e.id}
            onClick={() => nav(`/elections/${e.id}/class`)}
            className="card p-5 text-left group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-ink group-hover:text-primary truncate">
                  {e.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  선택지 {e.candidates?.length || 0}개 ·{' '}
                  {e.voteMode === 'ranked' ? '순위투표' : '단순 선택'}
                </p>
              </div>
              {/* 내 투표이므로 코드를 바로 보여준다 (공유용) */}
              <div className="text-right shrink-0">
                <span className="block text-[11px] text-slate-500">코드</span>
                <span className="font-mono font-black text-lg tracking-[0.2em] text-primary">
                  {e.code}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-6">
        ※ 투표는 서버에 저장돼 있어요. 기기를 바꾸거나 목록에서 사라져도{' '}
        <b>4자리 코드로 언제든 다시 들어갈 수 있습니다.</b>
      </p>
    </Page>
  )
}

// Firestore Timestamp → 날짜 문자열
function fmtDate(ts) {
  if (!ts?.seconds) return '날짜 미상'
  const d = new Date(ts.seconds * 1000)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`
}
