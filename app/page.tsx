'use client'

import React from 'react'
import ReservationForm from './components/ReservationForm'

export default function Home() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          種苗店予約システム
        </h1>
        <ReservationForm />
      </div>
    </div>
  )
}