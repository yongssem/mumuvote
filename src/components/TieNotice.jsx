import { TIE_RULES } from '../lib/elections'

// 동점 안내 — 커트라인에 동점이 걸렸을 때, 투표 전에 정해둔 기준을 함께 보여준다.
export default function TieNotice({ tied, rule, note, seats }) {
  if (!tied || tied.length === 0) return null

  const names = tied.map((r) => `기호${r.candidate.number} ${r.candidate.name}`).join(' · ')
  const label = rule === 'custom' ? note || '직접 정한 기준' : TIE_RULES[rule] || '정하지 않음'
  const decided = rule && rule !== 'none'

  return (
    <div className="card p-5 mt-6 border-amber-400 bg-amber-50">
      <p className="font-black text-lg text-amber-800">⚖️ 동점이 나왔습니다</p>
      <p className="text-sm text-slate-700 mt-1">
        {seats}개를 정하는데 <b>{names}</b> 이(가) 같은 점수예요. 그대로는 최종 선택지를 가릴 수 없습니다.
      </p>

      <div className="mt-3 rounded-xl bg-white border-2 border-amber-300 p-3">
        <p className="text-xs font-bold text-slate-500 mb-0.5">투표 전에 정해둔 기준</p>
        {decided ? (
          <p className="font-bold text-ink">{label}</p>
        ) : (
          <p className="text-slate-500">
            정해둔 기준이 없습니다. 학급에서 합의해 결정하세요.
          </p>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-2">
        {decided
          ? '이 기준에 따라 처리한 뒤 최종 선택지를 확정하세요. (앱이 자동으로 정하지 않습니다)'
          : '다음 투표에서는 투표 전에 기준을 정해두면 뒷말이 없어요.'}
      </p>
    </div>
  )
}
