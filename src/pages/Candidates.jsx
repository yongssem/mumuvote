import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Page from '../components/Page'
import CandidateDetailModal from '../components/CandidateDetailModal'
import VoteModeGuide from '../components/VoteModeGuide'
import { getElection, getClass, modeLabel } from '../lib/elections'

// 선택지 관찰 화면 — 카드 클릭 시 상세 설명·포스터 상세 보기, 하단에 투표시작
export default function Candidates() {
  const { id, classId } = useParams()
  const nav = useNavigate()
  const [election, setElection] = useState(null)
  const [klass, setKlass] = useState(null)
  const [detail, setDetail] = useState(null)
  const [copied, setCopied] = useState(false)

  // 개별 투표(자기 기기) 개인 참여 링크
  const selfLink = `${window.location.origin}/self/${id}/${classId}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(selfLink)
    } catch {
      // clipboard 미지원 환경 대비 fallback
      const ta = document.createElement('textarea')
      ta.value = selfLink
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    getElection(id).then(setElection)
    getClass(id, classId).then(setKlass)
  }, [id, classId])

  if (!election) return <Page title="불러오는 중…" />

  const remaining = klass?.voters?.filter((v) => !v.hasVoted).length ?? 0

  return (
    <Page
      title="선택지 살펴보기"
      subtitle={`${election.name}${klass ? ' · ' + klass.name : ''}`}
    >
      <p className="text-slate-500 mb-4">
        선택지 카드를 눌러 <b>설명과 이미지</b>를 확인하세요.
      </p>

      {/* 투표 방식 설명 — 투표 전에 방식을 이해하도록 */}
      <div className="mb-5">
        <VoteModeGuide election={election} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {election.candidates.map((c) => (
          <button
            key={c.id}
            onClick={() => setDetail(c)}
            className="card overflow-hidden text-left hover:border-primary hover:shadow-md transition group"
          >
            <div className="aspect-[4/3] bg-slate-100 relative flex items-center justify-center overflow-hidden">
              {c.posterUrl ? (
                <img src={c.posterUrl} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-300 text-5xl font-black">{c.number}</div>
              )}
              <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold rounded-full px-2.5 py-1">
                선택지 {c.number}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg group-hover:text-primary">{c.name}</h3>
              {c.slogan && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.slogan}</p>}
              <span className="inline-block mt-3 text-sm text-primary font-semibold">
                자세히 보기 →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 개별 투표(자기 기기) 링크 공유 — 공개수업 당일 각자 태블릿으로 투표 */}
      <div className="card p-5 mt-8 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg">개별 투표 (자기 기기)</p>
            <p className="text-slate-500 text-sm mt-0.5">
              이 <b>개인 참여 링크</b>를 학생들에게 공유하면, 각자 자기 태블릿으로 이름을 선택해 
              투표를 합니다. 결과는 이 반으로 집계돼요.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input
                className="input flex-1 text-sm font-mono bg-paper"
                readOnly
                value={selfLink}
                onFocus={(e) => e.target.select()}
              />
              <button className="btn-primary whitespace-nowrap" onClick={copyLink}>
                {copied ? '✓ 복사됨' : '링크 복사'}
              </button>
              <button
                className="btn-ghost whitespace-nowrap"
                onClick={() => window.open(selfLink, '_blank')}
              >
                열어보기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="font-bold text-lg">한 대로 진행 (키오스크)</p>
          <p className="text-slate-500 text-sm">
            투표 방식: {modeLabel(election)} · 남은
            투표자 {remaining}명
          </p>
        </div>
        <button
          className="btn-accent text-lg px-8 py-4 w-full sm:w-auto"
          onClick={() => nav(`/elections/${id}/class/${classId}/vote`)}
        >
          🗳️ 투표 시작
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          className="btn-ghost"
          onClick={() => nav(`/elections/${id}/results`)}
        >
          🧮 전체 반 합산 결과 보기
        </button>
      </div>

      {/* 선택지 상세 모달 */}
      <CandidateDetailModal candidate={detail} onClose={() => setDetail(null)} />
    </Page>
  )
}
