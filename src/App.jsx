import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ElectionList from './pages/ElectionList'
import ElectionNew from './pages/ElectionNew'
import ClassSetup from './pages/ClassSetup'
import Candidates from './pages/Candidates'
import Voting from './pages/Voting'
import SelfVote from './pages/SelfVote'
import Results from './pages/Results'
import ResultsAll from './pages/ResultsAll'
import SuperAdmin from './pages/SuperAdmin'

// 무무보트 라우팅
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
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
  )
}
