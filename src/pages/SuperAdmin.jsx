import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page'
import { listElections, getElectionStats, deleteElection, deleteClass } from '../lib/elections'

const ADMIN_PW = '6006'
const AUTH_KEY = 'mumuvote_admin'

// 슈퍼 관리자 — 등록된 선거 관리 (코드 열람 · 현황 확인 · 삭제)
export default function SuperAdmin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')

  if (!authed) return <Gate onPass={() => setAuthed(true)} />
  return <AdminBoard />
}

// 비밀번호 잠금 화면
function Gate({ onPass }) {
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function submit() {
    if (pw === ADMIN_PW) {
      sessionStorage.setItem(AUTH_KEY, '1')
      onPass()
    } else {
      setErr('비밀번호가 일치하지 않습니다.')
    }
  }

  return (
    <Page title="슈퍼 관리자" subtitle="관리자 비밀번호를 입력하세요." maxWidth="max-w-md">
      <div className="card p-6">
        <label className="label">관리자 비밀번호</label>
        <input
          className="input mt-1 text-center text-2xl tracking-[0.4em] font-bold"
          type="password"
          inputMode="numeric"
          autoFocus
          value={pw}
          onChange={(e) => {
            setErr('')
            setPw(e.target.value.replace(/\D/g, '').slice(0, 8))
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="••••"
        />
        {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
        <div className="flex gap-2 mt-5">
          <button className="btn-ghost flex-1" onClick={() => nav('/')}>
            취소
          </button>
          <button className="btn-primary flex-1" disabled={!pw} onClick={submit}>
            입장
          </button>
        </div>
      </div>
    </Page>
  )
}

// 관리 대시보드
function AdminBoard() {
  const nav = useNavigate()
  const [rows, setRows] = useState(null) // [{ election, stats }]
  const [confirm, setConfirm] = useState(null) // 삭제 확인 대상
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setRows(null)
    const elections = await listElections()
    const withStats = await Promise.all(
      elections.map(async (e) => ({ election: e, stats: await getElectionStats(e.id) }))
    )
    setRows(withStats)
  }

  useEffect(() => {
    load()
  }, [])

  async function doDeleteElection(election) {
    setBusyId(election.id)
    try {
      await deleteElection(election.id)
      setConfirm(null)
      await load()
    } catch (e) {
      console.error(e)
      alert('삭제 실패: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  async function doDeleteClass(electionId, classId) {
    setBusyId(classId)
    try {
      await deleteClass(electionId, classId)
      setConfirm(null)
      await load()
    } catch (e) {
      console.error(e)
      alert('삭제 실패: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Page
      title="슈퍼 관리자"
      subtitle="등록된 선거의 코드·현황을 확인하고 삭제할 수 있어요."
      maxWidth="max-w-4xl"
    >
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">
          {rows === null ? '불러오는 중…' : `선거 ${rows.length}개`}
        </p>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={load}>
            ↻ 새로고침
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              sessionStorage.removeItem(AUTH_KEY)
              nav('/')
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {rows && rows.length === 0 && (
        <div className="card p-10 text-center text-slate-500">등록된 선거가 없습니다.</div>
      )}

      <div className="space-y-4">
        {rows?.map(({ election, stats }) => (
          <div key={election.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black text-lg text-ink">{election.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {election.voteMode === 'ranked' ? '순위투표(1·2·3등)' : '단순 선택'} · 후보{' '}
                  {election.candidates?.length || 0}명 · {fmtDate(election.createdAt)}
                </p>
              </div>
              {/* 4자리 코드 열람 */}
              <div className="text-right">
                <span className="block text-xs text-slate-400">접속 코드</span>
                <span className="font-mono font-black text-2xl tracking-[0.3em] text-primary">
                  {election.code}
                </span>
              </div>
            </div>

            {/* 현황 요약 */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Stat label="반" value={stats.classCount} />
              <Stat label="투표인단" value={stats.voterCount} />
              <Stat label="투표 완료" value={stats.voteCount} />
            </div>

            {/* 반별 현황 + 개별 삭제 */}
            {stats.groups.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                {stats.groups.map((g) => (
                  <div key={g.klass.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{g.klass.name}</span>
                    <span className="text-slate-500">
                      {g.ballots.length}/{g.klass.voters?.length || 0} 투표
                    </span>
                    <button
                      className="text-slate-400 hover:text-red-500 text-xs"
                      disabled={busyId === g.klass.id}
                      onClick={() =>
                        setConfirm({
                          kind: 'class',
                          electionId: election.id,
                          classId: g.klass.id,
                          label: `${election.name} · ${g.klass.name}`,
                        })
                      }
                    >
                      반 삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 액션 */}
            <div className="flex gap-2 mt-4">
              <button
                className="btn-ghost flex-1"
                onClick={() => nav(`/elections/${election.id}/results`)}
              >
                🧮 결과 보기
              </button>
              <button
                className="btn flex-1 bg-red-50 text-red-600 hover:bg-red-100"
                disabled={busyId === election.id}
                onClick={() =>
                  setConfirm({ kind: 'election', election, label: election.name })
                }
              >
                🗑️ 선거 삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 삭제 확인 모달 */}
      {confirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20"
          onClick={() => setConfirm(null)}
        >
          <div className="card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg text-red-600">정말 삭제할까요?</h3>
            <p className="text-sm text-slate-600 mt-2">
              <b>{confirm.label}</b>
              {confirm.kind === 'election'
                ? ' 선거와 모든 반·투표 기록이 영구 삭제됩니다.'
                : ' 반과 해당 반의 투표 기록이 영구 삭제됩니다.'}
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1" onClick={() => setConfirm(null)}>
                취소
              </button>
              <button
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={busyId != null}
                onClick={() =>
                  confirm.kind === 'election'
                    ? doDeleteElection(confirm.election)
                    : doDeleteClass(confirm.electionId, confirm.classId)
                }
              >
                {busyId != null ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-2xl font-black text-ink">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
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
