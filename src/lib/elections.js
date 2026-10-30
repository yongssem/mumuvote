// 무무보트 데이터 계층 — Firestore CRUD
// 컬렉션 구조:
//   mumuvote_elections/{electionId}
//     name, code(4자리), voteMode("ranked"|"single"), candidates[], createdAt
//     classes/{classId}
//       name, voters[{id,name,order,hasVoted}], createdAt
//       ballots/{ballotId}
//         voterId, voterName, first/second/third | choice, createdAt
import { db } from '../firebase'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

const ROOT = 'mumuvote_elections'
const MINE_KEY = 'mumuvote_my_elections' // 이 기기에서 만든 투표 id 목록

// 4자리 코드 무작위 생성 (앞자리 0 유지)
export function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// 아직 쓰이지 않은 4자리 코드 생성 (중복 방지)
// 4자리는 경우의 수가 9000뿐이라, 투표가 100개만 넘어도 우연히 겹칠 확률이 꽤 높다.
export async function randomUnusedCode(tries = 12) {
  for (let i = 0; i < tries; i++) {
    const c = randomCode()
    if (!(await isCodeTaken(c))) return c
  }
  return randomCode() // 극단적인 경우엔 그냥 반환(생성 시 최종 검사에서 걸러짐)
}

// 해당 코드를 쓰는 투표들 조회 (코드로 찾기 · 중복 검사)
export async function findElectionsByCode(code) {
  const snap = await getDocs(query(collection(db, ROOT), where('code', '==', code)))
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return rows
}

export async function isCodeTaken(code) {
  return (await findElectionsByCode(code)).length > 0
}

// ── 이 기기에서 만든 투표 (localStorage) ───────────────
function readMineIds() {
  try {
    const raw = localStorage.getItem(MINE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeMineIds(ids) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(ids))
  } catch {
    /* 저장 실패해도 앱 동작에는 지장 없음 */
  }
}

export function rememberMyElection(id) {
  const ids = readMineIds()
  if (!ids.includes(id)) writeMineIds([id, ...ids])
}

export function forgetMyElection(id) {
  writeMineIds(readMineIds().filter((x) => x !== id))
}

// 이 기기에서 만든 투표 목록. 삭제된 투표는 자동으로 정리한다.
export async function listMyElections() {
  const ids = readMineIds()
  if (ids.length === 0) return []
  const rows = await Promise.all(ids.map((id) => getElection(id).catch(() => null)))
  const alive = rows.filter(Boolean)
  if (alive.length !== ids.length) writeMineIds(alive.map((e) => e.id))
  return alive
}

// 고유 id 생성
export function uid() {
  return crypto.randomUUID()
}

// ── 투표 ──────────────────────────────────────────────
export async function createElection({ name, code, voteMode, candidates, seats, tieRule, picks }) {
  const ref = await addDoc(collection(db, ROOT), {
    name,
    code,
    voteMode, // "ranked" | "single"
    candidates, // [{ id, number, name, slogan, pledges, posterUrl }]
    picks: picks || (voteMode === 'ranked' ? 3 : 1), // 한 사람이 고르는 선택지 수
    seats: seats || 1, // 선정할 선택지 수 (몇 명을 뽑는지)
    tieRule: tieRule || { type: 'none', note: '' }, // 동점 처리 기준 (사전 약속)
    createdAt: serverTimestamp(),
  })
  rememberMyElection(ref.id) // 이 기기의 "내 투표" 목록에 추가
  return ref.id
}

export async function listElections() {
  const snap = await getDocs(collection(db, ROOT))
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  // 최신순 정렬 (createdAt 없을 수 있어 방어적으로)
  rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return rows
}

export async function getElection(id) {
  const snap = await getDoc(doc(db, ROOT, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── 반(투표인단) ──────────────────────────────────────
export async function createClass(electionId, { name, voters }) {
  const ref = await addDoc(collection(db, ROOT, electionId, 'classes'), {
    name,
    voters, // [{ id, name, order, hasVoted:false }]
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getClass(electionId, classId) {
  const snap = await getDoc(doc(db, ROOT, electionId, 'classes', classId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// 한 투표의 모든 반 목록 (합산 결과용)
export async function listClasses(electionId) {
  const snap = await getDocs(collection(db, ROOT, electionId, 'classes'))
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  rows.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
  return rows
}

export async function updateVoters(electionId, classId, voters) {
  await updateDoc(doc(db, ROOT, electionId, 'classes', classId), { voters })
}

// ── 투표(ballot) ─────────────────────────────────────
export async function submitBallot(electionId, classId, ballot) {
  await addDoc(
    collection(db, ROOT, electionId, 'classes', classId, 'ballots'),
    { ...ballot, createdAt: serverTimestamp() }
  )
}

export async function getBallots(electionId, classId) {
  const snap = await getDocs(
    collection(db, ROOT, electionId, 'classes', classId, 'ballots')
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── 개별 투표(자기 기기 · 비밀 링크) ────────────────────
// 학생이 각자 태블릿으로 투표. 문서 id를 voterId로 고정해 1인 1표를 보장하고,
// voters 배열(공유 상태)을 건드리지 않아 동시 투표에도 유실이 없다.
export async function submitSelfBallot(electionId, classId, voter, ballot) {
  await setDoc(
    doc(db, ROOT, electionId, 'classes', classId, 'ballots', voter.id),
    { voterId: voter.id, voterName: voter.name, ...ballot, createdAt: serverTimestamp() }
  )
}

// 이미 투표한 voterId 집합을 실시간 구독 (중복 방지·진행률). unsubscribe 반환.
export function subscribeVotedIds(electionId, classId, cb) {
  return onSnapshot(
    collection(db, ROOT, electionId, 'classes', classId, 'ballots'),
    (snap) => cb(new Set(snap.docs.map((d) => d.data().voterId || d.id)))
  )
}

// 투표 전체(모든 반)의 투표지를 반별로 수집 (합산 결과용)
export async function getAllBallots(electionId) {
  const classes = await listClasses(electionId)
  const out = []
  for (const k of classes) {
    const ballots = await getBallots(electionId, k.id)
    out.push({ klass: k, ballots })
  }
  return out
}

// ── 슈퍼 관리자 (삭제) ────────────────────────────────
// 한 반의 투표지 전부 + 반 문서 삭제
export async function deleteClass(electionId, classId) {
  const bsnap = await getDocs(
    collection(db, ROOT, electionId, 'classes', classId, 'ballots')
  )
  for (const b of bsnap.docs) await deleteDoc(b.ref)
  await deleteDoc(doc(db, ROOT, electionId, 'classes', classId))
}

// 투표 삭제 — 하위 반·투표지까지 재귀 정리 후 투표 문서 삭제
// (Firestore는 하위 컬렉션을 자동 삭제하지 않으므로 직접 지운다.)
export async function deleteElection(electionId) {
  const csnap = await getDocs(collection(db, ROOT, electionId, 'classes'))
  for (const c of csnap.docs) await deleteClass(electionId, c.id)
  await deleteDoc(doc(db, ROOT, electionId))
  forgetMyElection(electionId) // 이 기기의 "내 투표" 목록에서도 제거
}

// 관리자용 투표별 현황 요약 (반 수 / 투표인단 수 / 투표 수)
export async function getElectionStats(electionId) {
  const groups = await getAllBallots(electionId)
  const classCount = groups.length
  const voterCount = groups.reduce((s, g) => s + (g.klass.voters?.length || 0), 0)
  const voteCount = groups.reduce((s, g) => s + g.ballots.length, 0)
  return { classCount, voterCount, voteCount, groups }
}

export { picksOf, ballotPicks, weightAt, tally, TIE_RULES, decideWinners, modeLabel } from './tally'
