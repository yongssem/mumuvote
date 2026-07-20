// 이미지 업로드 헬퍼
// 1순위: Firebase Storage에 올리고 다운로드 URL(짧은 링크) 반환 → 선명하고 문서 용량 부담 없음
// 폴백: Storage를 못 쓰면(규칙 차단 등) 작게 압축한 dataURL을 그대로 반환 → 문서에 직접 저장
import { storage } from '../firebase'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { compressImage } from './image'
import { uid } from './elections'

// 지정 시간 안에 끝나지 않으면 거부 (Storage가 응답 없이 매달리는 상황 방지)
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

// 이미지 파일 → 표시용 문자열(Storage URL 또는 dataURL) 반환
export async function uploadCandidateImage(file) {
  // Storage용: 선명하게(글씨 있는 공약도 읽히도록) 적당히 큰 크기로 압축
  const bigDataUrl = await compressImage(file, { maxDim: 1280, maxBytes: 500 * 1024 })
  try {
    // 10초 안에 업로드+URL 획득이 안 되면 폴백으로 넘어간다 (UI 멈춤 방지)
    const url = await withTimeout(
      (async () => {
        const r = ref(storage, `mumuvote_images/${uid()}.jpg`)
        await uploadString(r, bigDataUrl, 'data_url')
        return await getDownloadURL(r)
      })(),
      10000
    )
    return url
  } catch (e) {
    // Storage 불가/지연 → 문서에 담을 수 있게 더 작게 압축한 dataURL로 폴백
    console.warn('Storage 업로드 실패·지연, dataURL로 폴백합니다:', e?.message)
    return await compressImage(file, { maxDim: 720, maxBytes: 150 * 1024 })
  }
}
