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
  serverTimestamp,
} from 'firebase/firestore'

const ROOT = 'mumuvote_elections'

// 4자리 코드 무작위 생성 (앞자리 0 유지)
export function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// 고유 id 생성
export function uid() {
  return crypto.randomUUID()
}

// ── 선거 ──────────────────────────────────────────────
export async function createElection({ name, code, voteMode, candidates }) {
  const ref = await addDoc(collection(db, ROOT), {
    name,
    code,
    voteMode, // "ranked" | "single"
    candidates, // [{ id, number, name, slogan, pledges, posterUrl }]
    createdAt: serverTimestamp(),
  })
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

// 한 선거의 모든 반 목록 (합산 결과용)
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

// 선거 전체(모든 반)의 투표지를 반별로 수집 (합산 결과용)
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

// 선거 삭제 — 하위 반·투표지까지 재귀 정리 후 선거 문서 삭제
// (Firestore는 하위 컬렉션을 자동 삭제하지 않으므로 직접 지운다.)
export async function deleteElection(electionId) {
  const csnap = await getDocs(collection(db, ROOT, electionId, 'classes'))
  for (const c of csnap.docs) await deleteClass(electionId, c.id)
  await deleteDoc(doc(db, ROOT, electionId))
}

// 관리자용 선거별 현황 요약 (반 수 / 투표인단 수 / 투표 수)
export async function getElectionStats(electionId) {
  const groups = await getAllBallots(electionId)
  const classCount = groups.length
  const voterCount = groups.reduce((s, g) => s + (g.klass.voters?.length || 0), 0)
  const voteCount = groups.reduce((s, g) => s + g.ballots.length, 0)
  return { classCount, voterCount, voteCount, groups }
}

// ── 결과 집계 ────────────────────────────────────────
// ranked: 1등 3점 / 2등 2점 / 3등 1점, single: 1표당 1점
export function tally(election, ballots) {
  const scores = {}
  for (const c of election.candidates) scores[c.id] = { candidate: c, points: 0, counts: { first: 0, second: 0, third: 0, choice: 0 } }
  for (const b of ballots) {
    if (election.voteMode === 'ranked') {
      if (b.first && scores[b.first]) { scores[b.first].points += 3; scores[b.first].counts.first++ }
      if (b.second && scores[b.second]) { scores[b.second].points += 2; scores[b.second].counts.second++ }
      if (b.third && scores[b.third]) { scores[b.third].points += 1; scores[b.third].counts.third++ }
    } else {
      if (b.choice && scores[b.choice]) { scores[b.choice].points += 1; scores[b.choice].counts.choice++ }
    }
  }
  return Object.values(scores).sort((a, b) => b.points - a.points)
}
