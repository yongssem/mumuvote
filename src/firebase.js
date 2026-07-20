// Firebase 초기화
// 딸깍(dd-catch) 프로젝트를 공유하되, 무무보트 데이터는 별도 컬렉션(mumuvote_elections)으로 분리한다.
// 참고: 웹 config의 apiKey는 비밀키가 아니라 공개용 식별자다.
import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyCL2d94hAMMaT-4YvlfxP4XGdgVWz0aXxU',
  authDomain: 'dd-catch.firebaseapp.com',
  projectId: 'dd-catch',
  storageBucket: 'dd-catch.firebasestorage.app',
  messagingSenderId: '289282525985',
  appId: '1:289282525985:web:0a2aa7ba653d5a2cfa0c60',
}

const app = initializeApp(firebaseConfig)

// 학교 네트워크/프록시·샌드박스 환경에서 WebChannel 스트리밍이 막히는 경우가 있어
// long-polling 자동 감지를 켜서 연결 안정성을 확보한다.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
})

// 이미지(포스터·공약) 저장용 — Storage 사용 불가 시 앱은 dataURL 폴백으로 동작
export const storage = getStorage(app)

