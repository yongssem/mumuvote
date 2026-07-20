// 이미지 업로드 헬퍼
// 1순위: Firebase Storage에 올리고 다운로드 URL(짧은 링크) 반환 → 선명하고 문서 용량 부담 없음
// 폴백: Storage를 못 쓰면(규칙 차단 등) 작게 압축한 dataURL을 그대로 반환 → 문서에 직접 저장
import { storage } from '../firebase'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { compressImage } from './image'
import { uid } from './elections'

// 이미지 파일 → 표시용 문자열(Storage URL 또는 dataURL) 반환
export async function uploadCandidateImage(file) {
  // Storage용: 선명하게(글씨 있는 공약도 읽히도록) 적당히 큰 크기로 압축
  const bigDataUrl = await compressImage(file, { maxDim: 1280, maxBytes: 500 * 1024 })
  try {
    const r = ref(storage, `mumuvote_images/${uid()}.jpg`)
    await uploadString(r, bigDataUrl, 'data_url')
    return await getDownloadURL(r)
  } catch (e) {
    // Storage 불가 → 문서에 담을 수 있게 더 작게 압축한 dataURL로 폴백
    console.warn('Storage 업로드 실패, dataURL로 폴백합니다:', e?.message)
    return await compressImage(file, { maxDim: 720, maxBytes: 150 * 1024 })
  }
}
