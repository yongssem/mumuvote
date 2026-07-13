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
  getDoc,
  getDocs,
  updateDoc,
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
