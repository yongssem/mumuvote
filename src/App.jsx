import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ElectionList from './pages/ElectionList'
import ElectionNew from './pages/ElectionNew'
import ClassSetup from './pages/ClassSetup'
import Candidates from './pages/Candidates'
import Voting from './pages/Voting'
import Results from './pages/Results'

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
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
