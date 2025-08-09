import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'

export function RouteError() {
  const error = useRouteError()
  let title = 'Неизвестная ошибка'
  let message = 'Что-то пошло не так'
  let status = 500

  if (isRouteErrorResponse(error)) {
    status = error.status
    title = `${error.status} ${error.statusText}`
    message = (error.data && typeof error.data === 'string') ? error.data : 'Страница не найдена или ошибка маршрута'
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="min-h-screen p-6 text-emerald-100">
      <div className="max-w-xl mx-auto panel p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-emerald-200/80">{message}</p>
        <div className="mt-4 flex gap-2">
          <Link to="/encrypt" className="btn primary">На шифрование</Link>
          <Link to="/decrypt" className="btn outline">На расшифровку</Link>
        </div>
        <div className="text-xs label-help mt-4">Код: {status}</div>
      </div>
    </div>
  )
} 