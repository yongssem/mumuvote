// 이미지 업로드 헬퍼
// 기본값(무료 요금제): 이미지를 브라우저에서 압축해 dataURL로 문서에 바로 저장 → 즉시 완료.
// Firebase Storage는 요금제(Blaze) 업그레이드가 필요해 기본 미사용.
//   나중에 Blaze로 올려 Storage를 쓰려면 USE_STORAGE를 true로 바꾸면 됨(선명·용량 무제한).
import { storage } from '../firebase'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { compressImage } from './image'
import { uid } from './elections'

// Storage 사용 여부 — Blaze 요금제 + Storage 규칙 설정 시 true (선명·용량 무제한)
const USE_STORAGE = true

// 지정 시간 안에 끝나지 않으면 거부 (Storage가 응답 없이 매달리는 상황 방지)
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

// 이미지 파일 → 표시용 문자열(Storage URL 또는 압축 dataURL) 반환
export async function uploadCandidateImage(file) {
  // 무료 요금제: Storage 시도 없이 곧바로 압축 dataURL 반환 (즉시 완료, 멈춤 없음)
  if (!USE_STORAGE) {
    return await compressImage(file, { maxDim: 900, maxBytes: 160 * 1024 })
  }

  // (Storage 사용 시) 선명하게 압축 후 업로드, 15초 초과하면 압축 dataURL로 폴백
  const bigDataUrl = await compressImage(file, { maxDim: 1600, maxBytes: 1200 * 1024 })
  try {
    const url = await withTimeout(
      (async () => {
        const r = ref(storage, `mumuvote_images/${uid()}.jpg`)
        await uploadString(r, bigDataUrl, 'data_url')
        return await getDownloadURL(r)
      })(),
      15000
    )
    return url
  } catch (e) {
    console.warn('Storage 업로드 실패·지연, dataURL로 폴백합니다:', e?.message)
    return await compressImage(file, { maxDim: 720, maxBytes: 150 * 1024 })
  }
}
