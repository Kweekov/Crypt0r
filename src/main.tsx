import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App'
import { EncryptPage } from './pages/EncryptPage'
import { DecryptPage } from './pages/DecryptPage'
import { RouteError } from './components/RouteError'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/encrypt" replace /> },
      { path: 'encrypt', element: <EncryptPage /> },
      { path: 'decrypt', element: <DecryptPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)