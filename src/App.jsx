import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import SoundToggle from './components/SoundToggle'
import Landing from './pages/Landing'
import Guide from './pages/Guide'
const ElectionList = lazy(() => import('./pages/ElectionList'))
const ElectionNew = lazy(() => import('./pages/ElectionNew'))
const ClassSetup = lazy(() => import('./pages/ClassSetup'))
const Candidates = lazy(() => import('./pages/Candidates'))
const Voting = lazy(() => import('./pages/Voting'))
const SelfVote = lazy(() => import('./pages/SelfVote'))
const Results = lazy(() => import('./pages/Results'))
const ResultsAll = lazy(() => import('./pages/ResultsAll'))
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'))

// 무무보트 라우팅
export default function App() {
  return (
    <>
      <SoundToggle />
      <Suspense fallback={<div className="p-8 text-center" role="status">화면을 불러오는 중…</div>}>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="/elections" element={<ElectionList />} />
      <Route path="/elections/new" element={<ElectionNew />} />
      <Route path="/elections/:id/class" element={<ClassSetup />} />
      <Route path="/elections/:id/class/:classId/candidates" element={<Candidates />} />
      <Route path="/elections/:id/class/:classId/vote" element={<Voting />} />
      <Route path="/elections/:id/class/:classId/results" element={<Results />} />
      {/* 전체 결과(반별 집계·합산) */}
      <Route path="/elections/:id/results" element={<ResultsAll />} />
      {/* 개별 투표(자기 기기·비밀 링크) */}
      <Route path="/self/:id/:classId" element={<SelfVote />} />
      {/* 슈퍼 관리자 */}
      <Route path="/admin" element={<SuperAdmin />} />
      <Route path="*" element={<Landing />} />
      </Routes>
      </Suspense>
    </>
  )
}
