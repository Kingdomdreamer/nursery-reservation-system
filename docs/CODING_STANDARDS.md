# コーディング規約・実装ルール

## 🎯 基本原則

### 1. **単一責任の原則**
- 1つのコンポーネント = 1つの責任
- 1つのhook = 1つの機能
- 1つの関数 = 1つの処理

### 2. **型安全性の原則**
- `any`型の使用禁止
- `?.`オペレーターの過度な使用禁止
- 全ての props に型定義必須
- 全ての state に型定義必須

### 3. **コンポーネント分離の原則**
- 100行以上のコンポーネントは分割対象
- ビジネスロジックとプレゼンテーションロジックの分離
- 再利用可能なコンポーネントの抽出

## 📁 ディレクトリ構造

```
components/
├── ui/              # 再利用可能なUIコンポーネント
├── forms/           # フォーム関連コンポーネント
├── modals/          # モーダル関連コンポーネント
├── hooks/           # カスタムフック
├── types/           # 型定義
├── utils/           # ユーティリティ関数
└── constants/       # 定数定義
```

## 🔧 実装ルール詳細

### **1. TypeScript型定義**

#### ✅ **推奨**
```typescript
// 厳密な型定義
interface FormData {
  name: string
  description: string
  fields: FormField[]
}

// 適切なユニオン型
type FormStatus = 'draft' | 'published' | 'archived'

// 型ガード関数
function isFormValid(form: Partial<FormData>): form is FormData {
  return !!(form.name && form.description && form.fields)
}
```

#### ❌ **禁止**
```typescript
// any型の使用
const data: any = response.data

// 過度な?.使用
const count = form?.fields?.length || 0

// 型なしprops
function Component({ data }) {
  // ...
}
```

### **2. コンポーネント分割基準**

#### **分割対象**
- 100行以上のコンポーネント
- 複数の責任を持つコンポーネント
- 再利用される可能性のあるロジック

#### **分割方法**
```typescript
// Before: 大きなコンポーネント
function FormList() {
  // 500行のコード
}

// After: 分割されたコンポーネント
function FormList() {
  return (
    <div>
      <FormListHeader />
      <FormListFilters />
      <FormListItems />
      <FormCreationModal />
    </div>
  )
}
```

### **3. 状態管理**

#### **ローカル状態**
```typescript
// 単一の責任を持つ状態
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

#### **カスタムフック**
```typescript
// 関連する状態とロジックをまとめる
function useFormData() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchForms = useCallback(async () => {
    // 処理
  }, [])
  
  return { forms, loading, error, fetchForms }
}
```

### **4. エラーハンドリング**

#### **統一されたエラー処理**
```typescript
interface AppError {
  code: string
  message: string
  details?: any
}

function handleError(error: unknown): AppError {
  if (error instanceof Error) {
    return { code: 'UNKNOWN', message: error.message }
  }
  return { code: 'UNKNOWN', message: 'An unknown error occurred' }
}
```

### **5. パフォーマンス最適化**

#### **メモ化の活用**
```typescript
// 計算コストの高い処理
const expensiveValue = useMemo(() => {
  return complexCalculation(data)
}, [data])

// イベントハンドラー
const handleClick = useCallback((id: string) => {
  onClick(id)
}, [onClick])
```

## 🧪 テスト戦略

### **1. 単体テスト**
- 全てのカスタムフック
- 全てのユーティリティ関数
- 複雑なビジネスロジック

### **2. 統合テスト**
- コンポーネント間の連携
- API通信を含む処理

### **3. E2Eテスト**
- 主要な業務フロー
- ユーザーシナリオ

## 📚 命名規則

### **コンポーネント**
- PascalCase
- 機能を表す名前
- 接頭辞でカテゴリを示す

```typescript
// UI コンポーネント
Button, Modal, Input

// 機能コンポーネント  
FormCreator, ProductSelector, FieldEditor

// コンテナコンポーネント
FormListContainer, ProductListContainer
```

### **フック**
- `use` 接頭辞
- 機能を表す名前

```typescript
useFormData, useProductSelection, useFieldValidation
```

### **型定義**
- PascalCase
- 明確で説明的な名前

```typescript
interface FormCreationData {
  name: string
  description: string
  fields: FormField[]
}

type FormValidationResult = {
  isValid: boolean
  errors: ValidationError[]
}
```

## 🔄 リファクタリング指針

### **1. 段階的リファクタリング**
1. 型安全性の向上
2. コンポーネント分割
3. 状態管理の最適化
4. パフォーマンス改善

### **2. 品質指標**
- コードカバレッジ: 80%以上
- 型安全性: any型使用率 0%
- コンポーネントサイズ: 100行以内
- 関数複雑度: 10以下

## ✅ チェックリスト

### **PR作成前チェック**
- [ ] 型定義が完全である
- [ ] any型を使用していない
- [ ] コンポーネントが100行以内である
- [ ] 単一責任の原則を満たしている
- [ ] 適切なエラーハンドリングがある
- [ ] テストが作成されている
- [ ] パフォーマンスが最適化されている

### **レビュー時チェック**
- [ ] 型安全性が確保されている
- [ ] コンポーネントが適切に分割されている
- [ ] 再利用可能性が考慮されている
- [ ] 保守性が高い実装である
- [ ] ドキュメントが更新されている