// 이미지 파일 → 축소·압축된 dataURL 문자열
// 별도 저장소(스토리지) 없이 Firestore 문서에 바로 담기 위해,
// 브라우저 canvas로 리사이즈 + JPEG 압축해 용량을 크게 줄인다.
// (Firestore 문서 1MB 한도가 있어 포스터 1장을 넉넉히 이 아래로 맞춘다.)

// dataURL(base64) 문자열의 대략적 바이트 수
function approxBytes(dataUrl) {
  const i = dataUrl.indexOf(',')
  return Math.ceil(((dataUrl.length - i - 1) * 3) / 4)
}

// 파일을 읽어 최대 변(maxDim) 이하로 줄이고, 목표 용량(maxBytes) 아래가 되도록 품질을 낮춰가며 JPEG로 인코딩
export function compressImage(file, { maxDim = 640, maxBytes = 140 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type?.startsWith('image/')) {
      reject(new Error('이미지 파일만 올릴 수 있어요.'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    // 디코딩이 끝나지 않는 파일(일부 HEIC 등)에서 멈추지 않도록 안전 타임아웃
    const guard = setTimeout(() => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 처리하지 못했어요. jpg/png 파일로 시도해 주세요.'))
    }, 20000)
    img.onload = () => {
      clearTimeout(guard)
      URL.revokeObjectURL(url)
      try {
        let { width, height } = img
        const scale = Math.min(1, maxDim / Math.max(width, height))
        width = Math.round(width * scale)
        height = Math.round(height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        // 투명 배경(PNG)이 검게 나오지 않도록 흰 배경을 깔고 그린다
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // 목표 용량을 넘으면 품질을 단계적으로 낮춘다
        let quality = 0.82
        let out = canvas.toDataURL('image/jpeg', quality)
        while (approxBytes(out) > maxBytes && quality > 0.4) {
          quality -= 0.12
          out = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(out)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      clearTimeout(guard)
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.'))
    }
    img.src = url
  })
}
