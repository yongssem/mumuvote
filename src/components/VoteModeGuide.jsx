import { picksOf } from '../lib/elections'

// 투표 방식 안내 — 몇 명을 고르고 어떻게 점수가 매겨지는지 설명
// election을 받아 실제 설정(고르는 수·순위 여부)에 맞춰 문구가 바뀐다.
// variant: 'full'(카드형 상세) | 'compact'(한 줄 요약 배너)
export default function VoteModeGuide({ election, voteMode, variant = 'full' }) {
  // voteMode만 넘어온 예전 호출도 지원
  const e = election || { voteMode, picks: voteMode === 'ranked' ? 3 : 1 }
  const ranked = e.voteMode === 'ranked'
  const n = picksOf(e)
  // 순위투표 배점: 1등 n점 … 마지막 1점
  const ranks = Array.from({ length: n }, (_, i) => ({ label: `${i + 1}등`, point: n - i }))

  if (variant === 'compact') {
    return (
      <div className="rounded-xl bg-primary/5 border-2 border-primary/20 px-4 py-2.5 text-sm text-ink">
        {ranked ? (
          <>
            <b className="text-primary">순위투표</b> · 선택지 <b>{n}개</b>을 순서대로 골라요.{' '}
            {ranks.map((r, i) => (
              <span key={r.label}>
                {i > 0 && ', '}
                {r.label} <b>{r.point}점</b>
              </span>
            ))}{' '}
            — 점수를 모두 더해 점수 순으로 비교해요.
          </>
        ) : n === 1 ? (
          <>
            <b className="text-primary">단순 선택</b> · 선택지 <b>한 개</b>만 골라요. 표를 가장 많이
            받은 선택지부터 비교해요.
          </>
        ) : (
          <>
            <b className="text-primary">단순 선택</b> · <b>서로 다른 선택지 {n}개</b>에게 한 표씩
            줘요. 표를 가장 많이 받은 선택지부터 비교해요.
          </>
        )}
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🧮</span>
        <h3 className="font-black text-lg">
          {ranked ? '순위투표는 이렇게 계산해요' : '이렇게 투표해요'}
        </h3>
      </div>

      {ranked ? (
        <>
          <p className="text-slate-600 text-sm">
            좋아하는 선택지를 <b>{ranks.map((r) => r.label).join(' · ')}</b> 순서대로 골라요. 등수마다
            점수가 다릅니다.
          </p>
          <div className={`grid gap-2 mt-4 grid-cols-${Math.min(n, 3)}`} style={{ gridTemplateColumns: `repeat(${Math.min(n, 4)}, minmax(0, 1fr))` }}>
            {ranks.map((r, i) => (
              <div key={r.label} className="rounded-xl border-2 border-ink p-3 text-center">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-black ${
                    i === 0
                      ? 'bg-accent text-white'
                      : i === 1
                      ? 'bg-primary text-white'
                      : 'bg-slate-200 text-ink'
                  }`}
                >
                  {r.label}
                </span>
                <p className="text-2xl font-black mt-2">{r.point}점</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 mt-4">
            반 학생 모두의 점수를 <b>전부 더해서</b>, 합계가 높은 선택지부터 비교해요. 그래서
            1등을 적게 받아도 아래 등수를 골고루 받으면 순위가 올라갈 수 있어요.
          </p>
        </>
      ) : (
        <>
          <p className="text-slate-600 text-sm">
            {n === 1 ? (
              <>
                선택지 <b>한 개</b>만 고르는 방식이에요. 고른 선택지가 <b>1표</b>를 받습니다.
              </>
            ) : (
              <>
                <b>서로 다른 선택지 {n}개</b>을 고르는 방식이에요. 고른 선택지마다 <b>1표씩</b>{' '}
                받습니다. 등수 구분은 없어요.
              </>
            )}
          </p>
          <p className="text-sm text-slate-600 mt-3">표를 가장 많이 받은 선택지부터 비교해요.</p>
        </>
      )}
    </div>
  )
}
