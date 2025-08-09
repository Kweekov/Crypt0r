import { encryptText, decryptText, type CryptoProgressEvent } from '../utils/crypto'

export interface ApiProgressEvent extends CryptoProgressEvent {
  ts?: number
}

interface EncryptRequest {
  plaintext: string
  passphrase: string
  salt?: string
  iterations?: number
  onProgress?: (e: ApiProgressEvent) => void
}

interface EncryptResponse {
  success: boolean
  data?: { ciphertext: string }
  error?: string
}

interface DecryptRequest {
  ciphertext: string
  passphrase: string
  onProgress?: (e: ApiProgressEvent) => void
}

interface DecryptResponse {
  success: boolean
  data?: { plaintext: string }
  error?: string
}

function emit(on?: (e: ApiProgressEvent) => void, e?: ApiProgressEvent) {
  if (on && e) on({ ...e, ts: Date.now() })
}

export async function postEncrypt(req: EncryptRequest): Promise<EncryptResponse> {
  const { plaintext, passphrase, salt, iterations, onProgress } = req
  emit(onProgress, { stage: 'validate', label: 'Проверка входных данных', percent: 10 })
  if (!passphrase || passphrase.length < 4) return { success: false, error: 'Парольная фраза слишком короткая' }
  if (!plaintext) return { success: false, error: 'Пустой текст шифровать нельзя' }

  try {
    const ciphertext = await encryptText(plaintext, passphrase, {
      salt,
      iterations,
      onProgress: e => emit(onProgress, e)
    })
    emit(onProgress, { stage: 'done', label: 'Готово', percent: 100 })
    return { success: true, data: { ciphertext } }
  } catch (e) {
    emit(onProgress, { stage: 'error', label: 'Ошибка шифрования', info: String(e) })
    return { success: false, error: String(e) }
  }
}

export async function postDecrypt(req: DecryptRequest): Promise<DecryptResponse> {
  const { ciphertext, passphrase, onProgress } = req
  emit(onProgress, { stage: 'validate', label: 'Проверка входных данных', percent: 10 })
  if (!passphrase || passphrase.length < 4) return { success: false, error: 'Парольная фраза слишком короткая' }
  if (!ciphertext) return { success: false, error: 'Пустой шифртекст' }

  try {
    const plaintext = await decryptText(ciphertext, passphrase, {
      onProgress: e => emit(onProgress, e)
    })
    emit(onProgress, { stage: 'done', label: 'Готово', percent: 100 })
    return { success: true, data: { plaintext } }
  } catch (e) {
    emit(onProgress, { stage: 'error', label: 'Ошибка расшифровки', info: String(e) })
    return { success: false, error: String(e) }
  }
}

export interface ApiShape {
  postEncrypt: typeof postEncrypt
  postDecrypt: typeof postDecrypt
}

export const cryptoApi: ApiShape = { postEncrypt, postDecrypt } 