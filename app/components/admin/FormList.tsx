'use client'

import React, { useState } from 'react'
import { FormList } from '../forms/FormList'
import { FormCreationModal } from '../forms/FormCreation'

/**
 * フォーム一覧管理コンポーネント
 * 新しいアーキテクチャに基づいた実装
 */
export default function FormListPage() {
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false)

  const handleCreateForm = () => {
    setIsCreationModalOpen(true)
  }

  const handleEditForm = (id: string) => {
    window.location.href = `/admin?page=form-builder&id=${id}`
  }

  const handleCreationSuccess = () => {
    setIsCreationModalOpen(false)
  }

  return (
    <>
      <FormList
        onCreateForm={handleCreateForm}
        onEditForm={handleEditForm}
      />
      
      <FormCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onSuccess={handleCreationSuccess}
      />
    </>
  )
}