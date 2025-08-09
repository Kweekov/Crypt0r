import React, { useState } from 'react'
import { cryptoApi, type ApiProgressEvent } from '../services/cryptoApi'
import { ServerVisualizer } from '../components/ServerVisualizer'

export function DecryptPage() {
  const [passphrase, setPassphrase] = useState('correct-horse-battery')
  const [ciphertext, setCiphertext] = useState('')
  const [plaintext, setPlaintext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<ApiProgressEvent[]>([])

  async function onDecryptClick() {
    setError(null)
    setPlaintext('')
    setEvents([])
    setIsLoading(true)
    const resp = await cryptoApi.postDecrypt({ ciphertext, passphrase, onProgress: e => setEvents(prev => [...prev, e]) })
    setIsLoading(false)
    if (!resp.success) {
      setError(resp.error ?? 'Не удалось расшифровать')
      return
    }
    setPlaintext(resp.data!.plaintext)
  }

  return (
    <div className="panel p-6">
      <h2 className="text-xl font-semibold mb-3">Расшифровка</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div>
            <label className="block text-sm">Парольная фраза</label>
            <input className="input w-full mt-1 font-mono" value={passphrase} onChange={e=>setPassphrase(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <button className="btn primary" onClick={onDecryptClick} disabled={isLoading}>{isLoading ? 'Расшифровываю…' : 'Расшифровать'}</button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm">Шифртекст (base64url)</label>
            <textarea className="textarea w-full mt-1 font-mono" rows={7} value={ciphertext} onChange={e=>setCiphertext(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm">Открытый текст</label>
            <textarea className="textarea w-full mt-1 font-mono" rows={7} value={plaintext} onChange={e=>setPlaintext(e.target.value)} />
          </div>
          {error && <div className="text-red-400">Ошибка: {error}</div>}
        </div>
      </div>

      <div className="mt-5 text-xs label-help">
        Пример вызова API: <span className="code-tag">POST /decrypt</span> — параметры: <span className="code-tag">{`{ ciphertext, passphrase }`}</span>
      </div>

      <ServerVisualizer events={events} title="Пайплайн расшифровки" />
    </div>
  )
} 