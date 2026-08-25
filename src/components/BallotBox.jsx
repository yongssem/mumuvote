import { useEffect, useMemo, useRef, useState } from 'react'
import { tally, ballotPicks, picksOf } from '../lib/elections'
import { playTick, playSelect, playFanfare } from '../lib/sound'

// 투표함 · 수개표 — 부정선거가 아님을 눈으로 보여주는 화면
// 1) 봉인된 투표함에 투표용지가 쌓여 있고
// 2) [개표 시작]을 누르면 한 장씩 꺼내 기표 도장을 보여주며
// 3) 옆의 집계판이 실시간으로 올라가고, 마지막에 최종 결과와 일치하는지 확인한다.
// 투표용지에는 누가 넣었는지(이름·학번)를 절대 표시하지 않는다. 순서도 섞는다.
export default function BallotBox({ election, ballots, onClose }) {
  const ranked = election.voteMode === 'ranked'
  const [phase, setPhase] = useState('sealed') // sealed | counting | done
  const [openedCount, setOpenedCount] = useState(0) // 지금까지 꺼낸 표 수
  const [speed, setSpeed] = useState(900) // 한 장당 ms
  const timer = useRef(null)

  // 비밀투표: 이름을 제거하고 순서를 섞는다 (넣은 순서로 누구인지 추측할 수 없도록)
  const anonymous = useMemo(() => {
    // 이름·학번을 지우고 고른 후보만 남긴다
    const rows = ballots.map((b) => ({ picks: ballotPicks(b) }))
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[rows[i], rows[j]] = [rows[j], rows[i]]
    }
    return rows
  }, [ballots, ranked])

  // 지금까지 꺼낸 표만으로 집계 (숫자가 눈앞에서 쌓이는 게 핵심)
  const runningRows = useMemo(
    () => tally(election, anonymous.slice(0, openedCount)),
    [election, anonymous, openedCount]
  )
  const finalRows = useMemo(() => tally(election, anonymous), [election, anonymous])

  // 자동으로 한 장씩 개표
  useEffect(() => {
    if (phase !== 'counting') return
    if (openedCount >= anonymous.length) {
      setPhase('done')
      playFanfare()
      return
    }
    timer.current = setTimeout(() => {
      setOpenedCount((n) => n + 1)
      playSelect()
    }, speed)
    return () => clearTimeout(timer.current)
  }, [phase, openedCount, speed, anonymous.length])

  const total = anonymous.length
  const current = openedCount > 0 ? anonymous[openedCount - 1] : null
  const find = (cid) => election.candidates.find((c) => c.id === cid)

  // 최종 집계와 정식 결과가 같은지 검증 (조작이 없음을 수치로 확인)
  const matches =
    JSON.stringify(finalRows.map((r) => [r.candidate.id, r.points])) ===
    JSON.stringify(tally(election, ballots).map((r) => [r.candidate.id, r.points]))

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 overflow-y-auto">
      <div className="min-h-full max-w-6xl mx-auto px-4 py-6">
        {/* 머리말 */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">🗳️ 투표함 · 수개표</h1>
            <p className="text-white/60 text-sm mt-1">
              투표용지에는 <b className="text-white/90">누가 넣었는지 적혀 있지 않습니다.</b> 순서도
              무작위로 섞어 공개해요.
            </p>
          </div>
          <button className="btn-ghost shrink-0" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* 왼쪽: 투표함 + 꺼낸 용지 */}
          <div className="card p-6">
            {phase === 'sealed' ? (
              <div className="text-center">
                <BoxGraphic count={total} sealed />
                <p className="font-black text-xl mt-5">봉인된 투표함</p>
                <p className="text-slate-500 mt-1">
                  투표용지 <b className="text-primary">{total}장</b>이 들어 있어요.
                </p>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  투표한 사람 수와 투표용지 수가 같은지 먼저 확인하세요.
                  <br />
                  개표를 시작하면 한 장씩 꺼내 모두가 보는 앞에서 세어 봅니다.
                </p>
                <button
                  className="btn-accent text-lg px-8 py-4 mt-6"
                  disabled={total === 0}
                  onClick={() => {
                    setPhase('counting')
                    playTick(3)
                  }}
                >
                  🔓 개표 시작
                </button>
                {total === 0 && (
                  <p className="text-sm text-slate-400 mt-3">아직 투표된 용지가 없어요.</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <BoxGraphic count={Math.max(0, total - openedCount)} />
                <p className="text-slate-500 mt-4">
                  꺼낸 표 <b className="text-ink text-lg">{openedCount}</b> / {total}
                </p>

                {/* 방금 꺼낸 투표용지 */}
                <div className="mt-4 min-h-[210px] flex items-center justify-center">
                  {current ? (
                    <Ballot
                      key={openedCount}
                      ranked={ranked}
                      data={current}
                      find={find}
                      seq={openedCount}
                    />
                  ) : (
                    <p className="text-slate-300">첫 장을 꺼내는 중…</p>
                  )}
                </div>

                {/* 속도 조절 */}
                {phase === 'counting' && (
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <span className="text-xs text-slate-400">속도</span>
                    {[
                      ['느리게', 1400],
                      ['보통', 900],
                      ['빠르게', 350],
                    ].map(([label, ms]) => (
                      <button
                        key={label}
                        className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${
                          speed === ms
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 text-slate-500'
                        }`}
                        onClick={() => setSpeed(ms)}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      className="btn-ghost !py-1.5 !px-3 text-xs"
                      onClick={() => setOpenedCount(total)}
                    >
                      끝까지 ⏭
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽: 실시간 집계판 */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-black text-lg">개표 집계판</h2>
              <span className="text-sm text-slate-500">
                {openedCount} / {total}표 반영
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {ranked
                ? `1등 ${picksOf(election)}점부터 1점씩 낮춰 더합니다.`
                : '고른 후보에 1표씩 더합니다.'}
            </p>

            <div className="space-y-3">
              {runningRows.map((r) => {
                const max = Math.max(1, ...runningRows.map((x) => x.points))
                return (
                  <div key={r.candidate.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold truncate">
                        <span className="text-slate-400 text-xs mr-1">
                          기호{r.candidate.number}
                        </span>
                        {r.candidate.name}
                      </span>
                      <span className="font-black text-lg tabular-nums">
                        {r.points}
                        <span className="text-xs text-slate-400 font-normal ml-0.5">
                          {ranked ? '점' : '표'}
                        </span>
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full mt-1 overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(r.points / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 개표 완료 — 검증 */}
            {phase === 'done' && (
              <div
                className={`mt-6 rounded-xl border-2 p-4 ${
                  matches ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <p className={`font-black ${matches ? 'text-emerald-700' : 'text-red-700'}`}>
                  {matches ? '✅ 개표 완료 — 결과가 일치합니다' : '⚠️ 집계가 일치하지 않습니다'}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {matches
                    ? `투표함에서 꺼낸 ${total}장을 하나씩 세어 나온 값과, 앱이 계산한 최종 결과가 정확히 같습니다.`
                    : '새로고침 후 다시 시도해 주세요.'}
                </p>
                <button className="btn-primary w-full mt-4" onClick={onClose}>
                  결과 화면으로 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 투표함 그림 — 실제 선거처럼 '투명 투표함'이라 안에 든 용지가 그대로 보인다
function BoxGraphic({ count, sealed }) {
  const papers = Math.min(count, 15)
  return (
    <div className="relative w-56 h-48 mx-auto">
      {/* 뚜껑 + 투입구 */}
      <div className="absolute inset-x-2 top-4 h-9 rounded-xl bg-primary border-[3px] border-ink shadow-[4px_4px_0_0_#0F172A] flex items-center justify-center">
        <div className="w-24 h-2.5 rounded-full bg-ink" />
      </div>

      {/* 투명 함 본체 */}
      <div className="absolute inset-x-0 top-12 bottom-0 rounded-2xl border-[3px] border-ink bg-sky-100/60 shadow-[6px_6px_0_0_#0F172A] overflow-hidden">
        <span className="absolute inset-x-0 top-2 text-center text-[11px] font-black tracking-[0.25em] text-ink/35">
          투 표 함
        </span>
        {/* 안에 쌓인 투표용지 */}
        {Array.from({ length: papers }, (_, i) => (
          <div
            key={i}
            className="absolute w-[74px] h-[26px] bg-white border-2 border-slate-300 rounded"
            style={{
              left: `${10 + (i % 3) * 25}%`,
              bottom: 6 + Math.floor(i / 3) * 17,
              transform: `rotate(${(i % 5) * 4 - 8}deg)`,
            }}
          />
        ))}
      </div>

      {sealed && (
        <span className="absolute -right-2 top-8 rotate-12 bg-red-500 text-white text-[11px] font-black px-2 py-1 rounded border-2 border-ink shadow-[2px_2px_0_0_#0F172A]">
          봉인
        </span>
      )}

      {/* 남은 장수 */}
      <span className="absolute -left-2 bottom-2 bg-white border-2 border-ink rounded-full px-2.5 py-0.5 text-xs font-black shadow-[2px_2px_0_0_#0F172A]">
        {count}장
      </span>
    </div>
  )
}

// 투표용지 한 장 — 이름 없이 기표 도장만
function Ballot({ ranked, data, find, seq }) {
  const rows = (data.picks || []).map((cid, i) => [ranked ? `${i + 1}등` : '선택', cid])

  return (
    <div className="animate-ballot bg-white border-[3px] border-ink rounded-xl shadow-[6px_6px_0_0_#0F172A] px-5 py-4 w-full max-w-xs">
      <div className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-2 mb-3">
        <span className="text-[11px] font-black tracking-[0.15em] text-slate-500">투표용지</span>
        <span className="text-[11px] text-slate-400">제 {seq} 호</span>
      </div>

      <div className="space-y-2">
        {rows.map(([label, cid]) => {
          const c = find(cid)
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-xs font-bold text-slate-500">{label}</span>
              <span className="flex-1 text-left font-bold truncate">
                {c ? (
                  <>
                    <span className="text-slate-400 text-xs mr-1">기호{c.number}</span>
                    {c.name}
                  </>
                ) : (
                  <span className="text-slate-300">무효</span>
                )}
              </span>
              {/* 기표 도장 */}
              {c && <Stamp />}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-3 pt-2 border-t border-slate-200">
        기표한 사람의 이름은 적혀 있지 않습니다
      </p>
    </div>
  )
}

// 기표 도장 (붉은 인주 · 卜 모양)
function Stamp() {
  return (
    <span className="shrink-0 w-8 h-8 rounded-full border-[2.5px] border-red-500 text-red-500 flex items-center justify-center font-black text-base rotate-[-8deg] opacity-90">
      卜
    </span>
  )
}
