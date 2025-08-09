import { useState, useMemo } from 'react'
import { generateSalt } from '../utils/crypto'
import { cryptoApi, type ApiProgressEvent } from '../services/cryptoApi'
import { ServerVisualizer } from '../components/ServerVisualizer'

export function EncryptPage() {
  const [passphrase, setPassphrase] = useState('correct-horse-battery')
  const [salt, setSalt] = useState(() => generateSalt(12))
  const [iterations, setIterations] = useState(120_000)
  const [plaintext, setPlaintext] = useState('Привет, мир!')
  const [ciphertext, setCiphertext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<ApiProgressEvent[]>([])

  const ptLen = useMemo(() => new TextEncoder().encode(plaintext).length, [plaintext])
  const blocks = useMemo(() => Math.ceil(ptLen / 32) || 1, [ptLen])

  async function onEncryptClick() {
    setError(null)
    setEvents([])
    setIsLoading(true)
    const resp = await cryptoApi.postEncrypt({ plaintext, passphrase, salt, iterations, onProgress: e => setEvents(prev => [...prev, e]) })
    setIsLoading(false)
    if (!resp.success) {
      setError(resp.error ?? 'Не удалось зашифровать')
      return
    }
    setCiphertext(resp.data!.ciphertext)
  }

  return (
    <div className="panel p-6">
      <h2 className="text-xl font-semibold mb-3">Шифрование</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Парольная фраза</label>
            <input className="input w-full mt-1 font-mono" value={passphrase} onChange={e=>setPassphrase(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Соль (base64url)</label>
            <input className="input w-full mt-1 font-mono" value={salt} onChange={e=>setSalt(e.target.value)} />
            <div className="text-xs label-help mt-1">Соль должна быть уникальной для каждой операции</div>
          </div>
          <div>
            <label className="block text-sm">Итерации PBKDF2</label>
            <input type="number" className="input w-full mt-1 font-mono" value={iterations} onChange={e=>setIterations(Number(e.target.value))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn" onClick={()=>setSalt(generateSalt(12))}>Новая соль</button>
            <button className="btn primary" onClick={onEncryptClick} disabled={isLoading}>{isLoading ? 'Шифрую…' : 'Зашифровать'}</button>
          </div>

          <div className="text-xs label-help mt-2">
            Длина открытого текста: <span className="code-tag">{ptLen} байт</span>, блоков HMAC: <span className="code-tag">{blocks}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm">Открытый текст</label>
            <textarea className="textarea w-full mt-1 font-mono" rows={7} value={plaintext} onChange={e=>setPlaintext(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Шифртекст (base64url)</label>
            <textarea className="textarea w-full mt-1 font-mono" rows={7} value={ciphertext} onChange={e=>setCiphertext(e.target.value)} />
          </div>
          {error && <div className="text-red-400">Ошибка: {error}</div>}
        </div>
      </div>

      <div className="mt-5 text-xs label-help">
        Пример вызова API: <span className="code-tag">POST /encrypt</span> — параметры: <span className="code-tag">{`{ plaintext, passphrase, salt, iterations }`}</span>
      </div>

      <ServerVisualizer events={events} title="Пайплайн шифрования" />
    </div>
  )
} 