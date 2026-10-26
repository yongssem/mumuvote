import test from 'node:test'
import assert from 'node:assert/strict'
import { tally, decideWinners, ballotPicks } from '../src/lib/tally.js'
const candidates = ['a','b','c'].map((id,i)=>({id,number:i+1,name:id}))
test('순위 선택에 N점부터 1점까지 부여',()=>{
 const e={candidates,voteMode:'ranked',picks:3}
 const rows=tally(e,[{picks:['a','b','c']},{picks:['b','a','c']}])
 assert.deepEqual(rows.map(r=>[r.candidate.id,r.points]),[['a',5],['b',5],['c',2]])
})
test('복수 단순 선택은 각각 한 표',()=>{
 const rows=tally({candidates,voteMode:'single',picks:2},[{picks:['a','c']}])
 assert.deepEqual(rows.map(r=>r.points),[1,1,0])
})
test('기존 투표지 형식을 계속 읽음',()=>{
 assert.deepEqual(ballotPicks({first:'a',second:'b',third:'c'}),['a','b','c'])
 assert.deepEqual(ballotPicks({choice:'b'}),['b'])
})
test('선정 경계 동점은 최종 확정하지 않고 동점 목록에 포함',()=>{
 const e={candidates,voteMode:'single',picks:1,seats:1}
 const result=decideWinners(e,tally(e,[{choice:'a'},{choice:'b'}]))
 assert.deepEqual(result.tied.map(r=>r.candidate.id),['a','b'])
})
test('순위 동점에서 1등표 기준으로 가림',()=>{
 const e={candidates,voteMode:'ranked',picks:3,seats:1,tieRule:{type:'firstVotes'}}
 const rows=[{candidate:candidates[0],points:5,rankCounts:[1,1,0]},{candidate:candidates[1],points:5,rankCounts:[0,2,1]}]
 const result=decideWinners(e,rows)
 assert.equal(result.sorted[0].candidate.id,'a')
 assert.equal(result.tied.length,0)
})
