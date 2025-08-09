import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App'
import { EncryptPage } from './pages/EncryptPage'
import { DecryptPage } from './pages/DecryptPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/encrypt" replace /> },
      { path: 'encrypt', element: <EncryptPage /> },
      { path: 'decrypt', element: <DecryptPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)