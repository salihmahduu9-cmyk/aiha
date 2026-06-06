'use client'

import './styles/globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Script Vault - نظام آمن لتشفير وإدارة السكريبتات</title>
        <meta name="description" content="نظام آمن لتشفير وإدارة وتشغيل السكريبتات" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>{children}</body>
    </html>
  )
}
