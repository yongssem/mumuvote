// 효과음 — 오디오 파일 없이 Web Audio API로 합성 (용량 0, 오프라인 동작)
// 자동재생 정책상 소리는 사용자 제스처(탭) 안에서만 울린다.

let ctx = null
let muted = localStorage.getItem('mumuvote_muted') === '1'

function ac() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function isMuted() {
  return muted
}
export function setMuted(v) {
  muted = v
  localStorage.setItem('mumuvote_muted', v ? '1' : '0')
}
// 토글 후 켜졌으면 확인용 짧은 소리
export function toggleMuted() {
  setMuted(!muted)
  if (!muted) tone(880, 0, 0.08, 'sine', 0.08)
  return muted
}

// 단일 톤 재생
function tone(freq, start, dur, type = 'sine', gain = 0.12) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  o.connect(g)
  g.connect(c.destination)
  const t = c.currentTime + start
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.start(t)
  o.stop(t + dur + 0.03)
}

// 버튼 딸깍
export function playClick() {
  if (muted) return
  tone(300, 0, 0.05, 'triangle', 0.05)
}
// 후보 선택
export function playSelect() {
  if (muted) return
  tone(523, 0, 0.07, 'sine', 0.08)
  tone(784, 0.05, 0.09, 'sine', 0.08)
}
// 투표 제출 성공 (도-미-솔)
export function playSuccess() {
  if (muted) return
  ;[523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.18, 'sine', 0.1))
}
// 전원 투표 완료 (상승 아르페지오 + 반짝)
export function playComplete() {
  if (muted) return
  ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.28, 'triangle', 0.11))
  tone(1568, 0.5, 0.4, 'sine', 0.06)
}
// 오류/불일치
export function playError() {
  if (muted) return
  tone(180, 0, 0.16, 'sawtooth', 0.07)
  tone(130, 0.09, 0.2, 'sawtooth', 0.06)
}

// 모든 버튼 클릭에 딸깍음을 붙인다 (한 번만 등록)
let inited = false
export function initButtonSfx() {
  if (inited) return
  inited = true
  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = e.target
      if (!el || !el.closest) return
      const btn = el.closest('button, a.btn, label.btn')
      if (btn && !btn.disabled) playClick()
    },
    { passive: true }
  )
}
