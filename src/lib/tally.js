// ── 결과 집계 ────────────────────────────────────────
// ranked: 1등 3점 / 2등 2점 / 3등 1점, single: 1표당 1점
// 한 사람이 몇 명을 고르는지 (기본: 순위투표 3명, 단순 선택 1명)
export function picksOf(election) {
  return Math.max(1, election?.picks || (election?.voteMode === 'ranked' ? 3 : 1))
}

// 투표지에서 고른 선택지 id를 순서대로 꺼낸다.
// 예전 형식(first/second/third, choice)도 그대로 읽어 하위 호환을 지킨다.
export function ballotPicks(ballot) {
  if (Array.isArray(ballot?.picks)) return ballot.picks.filter(Boolean)
  if (ballot?.choice) return [ballot.choice]
  return [ballot?.first, ballot?.second, ballot?.third].filter(Boolean)
}

// 순위별 배점 — 순위투표는 N등이 (뽑는수 - 등수 + 1)점, 단순 선택은 모두 1점
export function weightAt(election, index) {
  return election?.voteMode === 'ranked' ? picksOf(election) - index : 1
}

export function tally(election, ballots) {
  const n = picksOf(election)
  const scores = {}
  for (const c of election.candidates) {
    scores[c.id] = { candidate: c, points: 0, rankCounts: Array(n).fill(0) }
  }
  for (const b of ballots) {
    ballotPicks(b).forEach((id, i) => {
      if (i >= n || !scores[id]) return
      scores[id].points += weightAt(election, i)
      scores[id].rankCounts[i]++
    })
  }
  return Object.values(scores).sort((a, b) => b.points - a.points)
}

// ── 선정자 판정 ──────────────────────────────────────
// 상위 seats명을 선정으로 본다. 커트라인에 동점이 걸리면 사전에 정한 기준으로 처리.
export const TIE_RULES = {
  none: '정하지 않음',
  firstVotes: '1등표를 더 많이 받은 선택지',
  runoff: '해당 선택지들만 재투표(결선)',
  lottery: '추첨(제비뽑기)',
  elder: '생일이 빠른 선택지',
  custom: '직접 정한 기준',
}

export function decideWinners(election, rows) {
  const seats = Math.max(1, Math.min(election.seats || 1, rows.length))
  const rule = election.tieRule?.type || 'none'
  const ranked = election.voteMode === 'ranked'

  // 자동으로 가릴 수 있는 기준(1등표 비교)은 여기서 반영한다.
  const sorted = [...rows]
  if (rule === 'firstVotes' && ranked) {
    sorted.sort((a, b) => b.points - a.points || b.rankCounts[0] - a.rankCounts[0])
  }

  const winners = sorted.slice(0, seats)
  const boundary = sorted[seats - 1]
  const next = sorted[seats]

  // 커트라인(마지막 선정자 ↔ 첫 낙선자)이 같은 점수면 동점 상황
  let tied = []
  if (boundary && next && boundary.points === next.points) {
    const brokeByFirst =
      rule === 'firstVotes' && ranked && boundary.rankCounts[0] !== next.rankCounts[0]
    if (!brokeByFirst) {
      tied = sorted.filter((r) => r.points === boundary.points)
    }
  }

  return { seats, sorted, winners, tied, rule }
}

// 결과 화면 등에 쓰는 방식 요약 문구
export function modeLabel(election) {
  const n = picksOf(election)
  if (election?.voteMode === 'ranked') {
    const w = Array.from({ length: n }, (_, i) => `${i + 1}등 ${n - i}점`).join('·')
    return `순위투표 ${n}개 선택 (${w} 합산)`
  }
  return n === 1 ? '단순 선택 (득표수)' : `단순 선택 ${n}개 (각 1표)`
}
