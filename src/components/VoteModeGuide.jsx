// 투표 방식 안내 — 순위투표/단순 선택이 어떻게 계산되는지 학생·선생님에게 설명
// variant: 'full'(카드형 상세) | 'compact'(한 줄 요약 배너)
export default function VoteModeGuide({ voteMode, variant = 'full' }) {
  const ranked = voteMode === 'ranked'

  if (variant === 'compact') {
    return (
      <div className="rounded-xl bg-primary/5 border-2 border-primary/20 px-4 py-2.5 text-sm text-ink">
        {ranked ? (
          <>
            <b className="text-primary">순위투표</b> · 1등 뽑은 후보 <b>3점</b>, 2등{' '}
            <b>2점</b>, 3등 <b>1점</b> — 점수를 모두 더해 가장 높은 후보가 당선돼요.
          </>
        ) : (
          <>
            <b className="text-primary">단순 선택</b> · 후보 <b>한 명</b>만 골라요. 표를 가장 많이
            받은 후보가 당선돼요.
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
          {ranked ? '순위투표는 이렇게 계산해요' : '단순 선택은 이렇게 계산해요'}
        </h3>
      </div>

      {ranked ? (
        <>
          <p className="text-slate-600 text-sm">
            좋아하는 후보를 <b>1등 · 2등 · 3등</b> 순서대로 골라요. 등수마다 점수가 다릅니다.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              ['1등', 3, 'bg-accent text-white'],
              ['2등', 2, 'bg-primary text-white'],
              ['3등', 1, 'bg-slate-200 text-ink'],
            ].map(([label, pt, cls]) => (
              <div key={label} className="rounded-xl border-2 border-ink p-3 text-center">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-black ${cls}`}
                >
                  {label}
                </span>
                <p className="text-2xl font-black mt-2">{pt}점</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-sm text-slate-600">
              <b>예시</b> — 한 명이 1등에 기호1, 2등에 기호2, 3등에 기호3을 골랐다면
              <br />
              기호1은 <b className="text-accent">3점</b>, 기호2는{' '}
              <b className="text-primary">2점</b>, 기호3은 <b>1점</b>을 받아요.
            </p>
          </div>
          <p className="text-sm text-slate-600 mt-3">
            반 학생 모두의 점수를 <b>전부 더해서</b>, 합계가 가장 높은 후보가 당선됩니다. 그래서
            1등을 적게 받아도 2·3등을 골고루 받으면 순위가 올라갈 수 있어요.
          </p>
        </>
      ) : (
        <>
          <p className="text-slate-600 text-sm">
            후보 <b>한 명</b>만 고르는 방식이에요. 고른 후보가 <b>1표</b>를 받습니다.
          </p>
          <p className="text-sm text-slate-600 mt-3">
            표를 가장 많이 받은 후보가 당선됩니다.
          </p>
        </>
      )}
    </div>
  )
}
