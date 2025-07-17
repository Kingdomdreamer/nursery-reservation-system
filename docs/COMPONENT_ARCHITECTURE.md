# コンポーネント分割設計

## 🎯 分割の基本方針

### **現状分析**
- FormList.tsx: 1000行以上（分割対象）
- 複数の責任を持つ（フォーム一覧、フォーム作成、フィールド管理、商品選択）
- 状態管理が複雑（15個以上の状態）

### **分割戦略**
1. **機能別分割**: 各機能を独立したコンポーネントに
2. **レイヤー分割**: UI、ロジック、データの分離
3. **責任分割**: 各コンポーネントが単一の責任を持つ

## 📁 新しいコンポーネント構造

```
components/
├── forms/
│   ├── FormList/
│   │   ├── FormList.tsx                 # メインコンテナ
│   │   ├── FormListHeader.tsx          # ヘッダー部分
│   │   ├── FormListFilters.tsx         # フィルター機能
│   │   ├── FormListItems.tsx           # フォーム一覧表示
│   │   ├── FormItem.tsx                # 個別フォーム項目
│   │   └── FormListStats.tsx           # 統計情報
│   ├── FormCreation/
│   │   ├── FormCreationModal.tsx       # 作成モーダル
│   │   ├── FormCreationTabs.tsx        # タブナビゲーション
│   │   ├── BasicInfoTab.tsx            # 基本情報タブ
│   │   ├── FieldsTab.tsx               # フィールドタブ
│   │   └── ProductsTab.tsx             # 商品タブ
│   ├── FormFields/
│   │   ├── FormFieldList.tsx           # フィールド一覧
│   │   ├── FormFieldItem.tsx           # 個別フィールド
│   │   ├── FormFieldEditor.tsx         # フィールド編集
│   │   ├── PredefinedFields.tsx        # 事前定義フィールド
│   │   └── CustomFieldCreator.tsx      # カスタムフィールド作成
│   └── ProductSelection/
│       ├── ProductSelector.tsx         # 商品選択メイン
│       ├── ProductList.tsx             # 商品一覧
│       ├── ProductItem.tsx             # 個別商品
│       ├── ProductFilters.tsx          # 商品フィルター
│       └── SelectedProducts.tsx        # 選択済み商品
├── ui/
│   ├── Button/
│   ├── Modal/
│   ├── Input/
│   ├── Tabs/
│   └── Badge/
├── hooks/
│   ├── useFormData.ts                  # フォームデータ管理
│   ├── useFormCreation.ts              # フォーム作成ロジック
│   ├── useFormFields.ts                # フィールド管理
│   ├── useProductSelection.ts          # 商品選択ロジック
│   └── useFormValidation.ts            # バリデーション
├── types/
│   ├── form.types.ts                   # フォーム関連型
│   ├── field.types.ts                  # フィールド関連型
│   ├── product.types.ts                # 商品関連型
│   └── validation.types.ts             # バリデーション関連型
├── utils/
│   ├── formValidation.ts               # バリデーション関数
│   ├── fieldHelpers.ts                 # フィールド操作関数
│   └── productHelpers.ts               # 商品操作関数
└── constants/
    ├── fieldTypes.ts                   # フィールドタイプ定義
    └── predefinedFields.ts             # 事前定義フィールド
```

## 🔧 各コンポーネントの責任

### **1. FormList.tsx**
```typescript
/**
 * 責任: 全体の状態管理と調整
 * サイズ: 50行以内
 * 依存: カスタムフック、子コンポーネント
 */
function FormList() {
  const { forms, loading, error, refreshForms } = useFormData()
  const { createForm, isCreating } = useFormCreation()
  
  return (
    <div>
      <FormListHeader onCreateForm={createForm} />
      <FormListFilters />
      <FormListStats forms={forms} />
      <FormListItems forms={forms} loading={loading} />
      <FormCreationModal 
        isOpen={isCreating} 
        onClose={() => setIsCreating(false)}
        onSubmit={createForm}
      />
    </div>
  )
}
```

### **2. FormCreationModal.tsx**
```typescript
/**
 * 責任: フォーム作成のUIコーディネート
 * サイズ: 80行以内
 * 依存: タブコンポーネント、フォーム作成hook
 */
function FormCreationModal({ isOpen, onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState('basic')
  const { formData, updateFormData, validate } = useFormCreation()
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <FormCreationTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        formData={formData}
      />
      <TabContent activeTab={activeTab} formData={formData} />
    </Modal>
  )
}
```

### **3. useFormData.ts**
```typescript
/**
 * 責任: フォームデータの取得・管理
 * 機能: CRUD操作、キャッシュ、エラーハンドリング
 */
function useFormData() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  
  const fetchForms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await FormService.getAllForms()
      setForms(data)
    } catch (err) {
      setError(handleError(err))
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { forms, loading, error, fetchForms, refreshForms: fetchForms }
}
```

### **4. useFormFields.ts**
```typescript
/**
 * 責任: フィールド管理ロジック
 * 機能: 追加、編集、削除、並び替え
 */
function useFormFields() {
  const [fields, setFields] = useState<FormField[]>([])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  
  const addField = useCallback((field: FormField) => {
    if (fields.find(f => f.id === field.id)) {
      throw new Error('フィールドが既に存在します')
    }
    setFields(prev => [...prev, field])
  }, [fields])
  
  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ))
  }, [])
  
  const deleteField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])
  
  const reorderFields = useCallback((fromIndex: number, toIndex: number) => {
    setFields(prev => {
      const newFields = [...prev]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return newFields
    })
  }, [])
  
  return {
    fields,
    editingField,
    setEditingField,
    addField,
    updateField,
    deleteField,
    reorderFields
  }
}
```

## 🔄 リファクタリング手順

### **Phase 1: 型安全性の強化**
1. 厳密な型定義作成
2. any型の排除
3. 型ガード関数の実装

### **Phase 2: カスタムフック抽出**
1. 状態管理ロジックの抽出
2. API通信ロジックの抽出
3. バリデーションロジックの抽出

### **Phase 3: UIコンポーネント分割**
1. 再利用可能なコンポーネントの抽出
2. 機能別コンポーネントの分割
3. レイアウトコンポーネントの整理

### **Phase 4: 統合とテスト**
1. 分割したコンポーネントの統合
2. 単体テストの作成
3. 統合テストの作成

## 📏 品質指標

### **コンポーネントサイズ**
- メインコンポーネント: 50行以内
- UIコンポーネント: 30行以内
- フックコンポーネント: 80行以内

### **責任分離**
- 1コンポーネント = 1責任
- 状態管理とUIの分離
- ビジネスロジックとプレゼンテーションの分離

### **再利用性**
- 共通UIコンポーネントの抽出
- 汎用的なフックの作成
- 設定可能なpropsの提供

## 🎯 期待される効果

### **保守性の向上**
- 各コンポーネントの責任が明確
- 変更の影響範囲が限定的
- デバッグが容易

### **開発効率の向上**
- 並行開発が可能
- 再利用性が高い
- テストが容易

### **品質の向上**
- 型安全性が保証
- エラーハンドリングが統一
- パフォーマンスが最適化