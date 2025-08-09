import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  const path = location.pathname

  return (
    <div className="min-h-screen p-6 text-emerald-100">
      <div className="max-w-5xl mx-auto panel p-6 animate-fade-in">
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">[ Crypt0r ]</h1>
            <nav className="flex gap-2 text-sm">
              <Link className={`btn ${path.startsWith('/encrypt') ? 'primary' : 'outline'}`} to="/encrypt">Шифрование</Link>
              <Link className={`btn ${path.startsWith('/decrypt') ? 'primary' : 'outline'}`} to="/decrypt">Расшифровка</Link>
            </nav>
          </div>
          <p className="text-sm text-emerald-300/80 mt-1">Шифратор паролем — HMAC-поток (PBKDF2)</p>
        </header>

        <Outlet />

        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Как это работает</h3>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="panel p-3">
              <div className="mb-1"><span className="code-tag">1. PBKDF2</span></div>
              <p className="text-emerald-200/80">Из парольной фразы и соли получается ключ фиксированной длины. Параметр <span className="code-tag">iterations</span> задает цену подбора.</p>
            </div>
            <div className="panel p-3">
              <div className="mb-1"><span className="code-tag">2. HMAC-поток</span></div>
              <p className="text-emerald-200/80">Генерируется псевдослучайный поток блоков HMAC-SHA256 по схеме: <span className="code-tag">HMAC(key, salt || nonce || counter)</span>, затем XOR с текстом.</p>
            </div>
            <div className="panel p-3">
              <div className="mb-1"><span className="code-tag">3. Тег целостности</span></div>
              <p className="text-emerald-200/80">На выходе в конец добавляется HMAC-тег по заголовку и шифртексту. При расшифровке тег сверяется. Несовпадение = ошибка.</p>
            </div>
          </div>
          <p className="text-xs label-help mt-3">
            Формат шифртекста: <span className="code-tag">version | iterations | saltLen | salt | nonceLen | nonce | ciphertext | tag</span> — всё в base64url.
          </p>
        </section>
      </div>
    </div>
  )
}