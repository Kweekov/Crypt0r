import { useState } from 'react'

function randomChoice(arr: string[], rng = Math.random){
  return arr[Math.floor(rng() * arr.length)]
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?'

export default function PasswordGenerator(){
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(false)
  const [password, setPassword] = useState('')

  function generate() {
    const buckets = [LOWER]
    if (useUpper) buckets.push(UPPER)
    if (useDigits) buckets.push(DIGITS)
    if (useSymbols) buckets.push(SYMBOLS)
    const all = buckets.join('')
    const out: string[] = []
    for (const b of buckets) out.push(randomChoice(b.split('')))
    while (out.length < length) out.push(randomChoice(all.split('')))
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    setPassword(out.join(''))
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-2">Генератор паролей</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">Длина
          <input type="number" value={length} min={6} max={128} onChange={e=>setLength(Number(e.target.value))} className="mt-1 input" />
        </label>
        <label className="block">Заглавные буквы
          <input type="checkbox" checked={useUpper} onChange={e=>setUseUpper(e.target.checked)} className="ml-2" />
        </label>
        <label className="block">Цифры
          <input type="checkbox" checked={useDigits} onChange={e=>setUseDigits(e.target.checked)} className="ml-2" />
        </label>
        <label className="block">Символы
          <input type="checkbox" checked={useSymbols} onChange={e=>setUseSymbols(e.target.checked)} className="ml-2" />
        </label>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={generate} className="btn primary">Сгенерировать</button>
        <input readOnly value={password} placeholder="Ваш пароль появится здесь" className="mt-1 w-full input" />
      </div>
    </div>
  )
}