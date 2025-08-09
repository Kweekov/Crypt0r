import type { ApiProgressEvent } from '../services/cryptoApi'

interface Props {
  title?: string
  events: ApiProgressEvent[]
}

function percentOrUndefined(p?: number) {
  if (typeof p !== 'number' || Number.isNaN(p)) return undefined
  return Math.max(0, Math.min(100, Math.round(p)))
}

export function ServerVisualizer({ title = 'Серверная визуализация', events }: Props) {
  const items = events
  return (
    <div className="panel p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="text-xs label-help">имитация API внутри приложения</div>
      </div>
      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="text-xs label-help">Ожидание запроса…</li>
        )}
        {items.map((ev, idx) => {
          const p = percentOrUndefined(ev.percent)
          return (
            <li key={idx} className="">
              <div className="flex items-center justify-between text-xs">
                <div className="text-emerald-200/90">{ev.label}</div>
                {typeof p === 'number' && <div className="text-emerald-300/80">{p}%</div>}
              </div>
              {typeof p === 'number' && (
                <div className="w-full h-1.5 bg-black/30 rounded mt-1 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
                </div>
              )}
              {ev.info && <div className="text-xs text-red-400 mt-1">{ev.info}</div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
} 