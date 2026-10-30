// 선택지 상세 모달 — 왼쪽 포스터 / 오른쪽 상세 설명(2단). 모바일에서는 세로로 쌓임.
export default function CandidateDetailModal({ candidate: c, onClose }) {
  if (!c) return null
  const hasPoster = !!c.posterUrl

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-30"
      onClick={onClose}
    >
      <div
        className={`card detail-dialog w-full ${hasPoster ? 'max-w-5xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto md:overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={hasPoster ? 'md:grid md:grid-cols-2 md:max-h-[90vh]' : ''}>
          {/* 좌: 포스터 (잘림 없이 전체) */}
          {hasPoster && (
            <div className="bg-slate-50 flex items-center justify-center p-3 md:overflow-hidden md:max-h-[90vh]">
              <img
                src={c.posterUrl}
                alt={c.name}
                className="w-full max-h-[45vh] md:max-h-[86vh] object-contain rounded-xl"
              />
            </div>
          )}

          {/* 우: 선택지 정보 + 상세 설명 */}
          <div className="p-6 md:overflow-y-auto md:max-h-[90vh]">
            <span className="inline-block bg-primary text-white text-xs font-bold rounded-full px-2.5 py-1">
              선택지 {c.number}
            </span>
            <h2 className="text-2xl font-black mt-2">{c.name}</h2>
            {c.slogan && <p className="text-primary font-semibold mt-1">“{c.slogan}”</p>}

            <div className="mt-4">
              <h3 className="font-bold text-sm text-slate-500 mb-1">상세 설명</h3>
              {c.pledgeImageUrl && (
                <img src={c.pledgeImageUrl} alt="상세 설명 이미지" className="w-full rounded-xl mb-3" />
              )}
              {c.pledges ? (
                <p className="whitespace-pre-wrap text-ink leading-relaxed">{c.pledges}</p>
              ) : (
                !c.pledgeImageUrl && <p className="text-slate-400">등록된 상세 설명이 없습니다.</p>
              )}
            </div>

            <button className="btn-ghost w-full mt-6" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
