export interface CryptoProgressEvent {
  stage: string
  label: string
  percent?: number
  info?: string
}

function emit(on?: (e: CryptoProgressEvent) => void, e?: CryptoProgressEvent) {
  if (on && e) on(e)
}

export function generateSalt(len = 12) {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return toBase64Url(bytes.buffer)
}

function u32ToBytesBE(n: number) {
  const a = new Uint8Array(4)
  a[0] = (n >>> 24) & 0xff
  a[1] = (n >>> 16) & 0xff
  a[2] = (n >>> 8) & 0xff
  a[3] = n & 0xff
  return a
}

function bytesToU32BE(b: Uint8Array, offset = 0) {
  return (b[offset] << 24) | (b[offset + 1] << 16) | (b[offset + 2] << 8) | b[offset + 3]
}

export function toBase64Url(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  const base64 = btoa(binary)
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string) {
  let b64 = s.replaceAll('-', '+').replaceAll('_', '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function deriveKeyBytes(
  passphrase: string,
  saltBuf: ArrayBuffer,
  iterations = 120_000,
  lengthBytes = 32
) {
  const enc = new TextEncoder()
  const passKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations, hash: 'SHA-256' },
    passKey,
    lengthBytes * 8
  )
  return new Uint8Array(bits)
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, data)
  return new Uint8Array(sig)
}

function xorBytes(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i]
  return out
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function encryptText(
  plaintext: string,
  passphrase: string,
  opts?: { salt?: string; iterations?: number; onProgress?: (e: CryptoProgressEvent) => void }
) {
  const onProgress = opts?.onProgress
  const iterations = opts?.iterations ?? 120_000
  const saltStr = opts?.salt ?? toBase64Url(crypto.getRandomValues(new Uint8Array(12)).buffer)
  const saltBuf = fromBase64Url(saltStr)
  const saltBytes = new Uint8Array(saltBuf)
  const nonce = crypto.getRandomValues(new Uint8Array(12))

  emit(onProgress, { stage: 'deriveKey', label: 'PBKDF2: выработка ключа', percent: 0 })
  const keyBytes = await deriveKeyBytes(passphrase, saltBuf, iterations, 32)
  emit(onProgress, { stage: 'deriveKey', label: 'PBKDF2: ключ готов', percent: 100 })

  const ptBytes = new TextEncoder().encode(plaintext)
  const blocks = Math.ceil(ptBytes.length / 32)
  const keystream = new Uint8Array(blocks * 32)
  emit(onProgress, { stage: 'keystream', label: `HMAC-поток: 0/${blocks} блоков`, percent: 0 })
  for (let i = 0; i < blocks; i++) {
    const counter = u32ToBytesBE(i)
    const data = new Uint8Array([...saltBytes, ...nonce, ...counter])
    const block = await hmacSha256(keyBytes, data)
    keystream.set(block, i * 32)
    const p = Math.round(((i + 1) / blocks) * 100)
    emit(onProgress, { stage: 'keystream', label: `HMAC-поток: ${i + 1}/${blocks} блоков`, percent: p })
  }

  const ctBytes = xorBytes(ptBytes, keystream.subarray(0, ptBytes.length))
  emit(onProgress, { stage: 'xor', label: 'XOR с потоком выполнен', percent: 100 })

  const version = 1
  const header = new Uint8Array([
    version,
    ...u32ToBytesBE(iterations),
    saltBytes.length & 0xff,
    ...saltBytes,
    nonce.length & 0xff,
    ...nonce
  ])
  const tagInput = new Uint8Array(header.length + ctBytes.length)
  tagInput.set(header, 0)
  tagInput.set(ctBytes, header.length)
  const tag = await hmacSha256(keyBytes, tagInput)
  emit(onProgress, { stage: 'hmacTag', label: 'HMAC-тег подсчитан', percent: 100 })

  const out = new Uint8Array(header.length + ctBytes.length + tag.length)
  out.set(header, 0)
  out.set(ctBytes, header.length)
  out.set(tag, header.length + ctBytes.length)
  emit(onProgress, { stage: 'assemble', label: 'Собран итоговый буфер', percent: 100 })

  emit(onProgress, { stage: 'done', label: 'Готово', percent: 100 })
  return toBase64Url(out.buffer)
}

export async function decryptText(ciphertextBase64Url: string, passphrase: string, opts?: { onProgress?: (e: CryptoProgressEvent) => void }) {
  const onProgress = opts?.onProgress
  const dataBuf = fromBase64Url(ciphertextBase64Url)
  const data = new Uint8Array(dataBuf)
  let pos = 0

  const version = data[pos++]
  if (version !== 1) throw new Error('Unsupported version')

  const iterations = bytesToU32BE(data, pos)
  pos += 4

  const saltLen = data[pos++]
  const salt = data.slice(pos, pos + saltLen)
  pos += saltLen

  const nonceLen = data[pos++]
  const nonce = data.slice(pos, pos + nonceLen)
  pos += nonceLen

  const tagLen = 32
  const ctLen = data.length - pos - tagLen
  if (ctLen < 0) throw new Error('Malformed ciphertext')

  const ct = data.slice(pos, pos + ctLen)
  pos += ctLen

  const tag = data.slice(pos, pos + tagLen)

  emit(onProgress, { stage: 'parse', label: 'Заголовок прочитан', percent: 100 })

  emit(onProgress, { stage: 'deriveKey', label: 'PBKDF2: выработка ключа', percent: 0 })
  const keyBytes = await deriveKeyBytes(passphrase, salt.buffer, iterations, 32)
  emit(onProgress, { stage: 'deriveKey', label: 'PBKDF2: ключ готов', percent: 100 })

  const header = new Uint8Array([version, ...u32ToBytesBE(iterations), saltLen, ...salt, nonceLen, ...nonce])
  const tagInput = new Uint8Array(header.length + ct.length)
  tagInput.set(header, 0)
  tagInput.set(ct, header.length)
  const expectedTag = await hmacSha256(keyBytes, tagInput)
  if (!constantTimeEqual(expectedTag, tag)) throw new Error('Tag mismatch — wrong passphrase or tampered')
  emit(onProgress, { stage: 'verifyTag', label: 'HMAC-тег проверен', percent: 100 })

  const blocks = Math.ceil(ct.length / 32)
  const keystream = new Uint8Array(blocks * 32)
  emit(onProgress, { stage: 'keystream', label: `HMAC-поток: 0/${blocks} блоков`, percent: 0 })
  for (let i = 0; i < blocks; i++) {
    const counter = u32ToBytesBE(i)
    const dataForH = new Uint8Array([...salt, ...nonce, ...counter])
    const block = await hmacSha256(keyBytes, dataForH)
    keystream.set(block, i * 32)
    const p = Math.round(((i + 1) / blocks) * 100)
    emit(onProgress, { stage: 'keystream', label: `HMAC-поток: ${i + 1}/${blocks} блоков`, percent: p })
  }
  const ptBytes = xorBytes(ct, keystream.subarray(0, ct.length))
  emit(onProgress, { stage: 'xor', label: 'XOR с потоком выполнен', percent: 100 })

  emit(onProgress, { stage: 'done', label: 'Готово', percent: 100 })
  return new TextDecoder().decode(ptBytes)
} 