'use client'

import {
  User,
  Calendar,
  FileText,
  Package,
  QrCode,
  Save,
  X,
  Search,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Phone,
  MapPin,
  Mail,
  Check,
  AlertCircle,
  Info,
  Download,
  Upload,
  Copy,
  BarChart,
  Settings,
  Home,
  List,
  Eye,
  EyeOff,
  Clock,
  Filter,
  RotateCcw as Refresh,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Users,
  ShoppingCart,
  CreditCard,
  Star,
  Heart,
  Share2,
  MessageCircle,
  Bell,
  Menu,
  MoreVertical,
  LogOut,
  Lock,
  Unlock,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Database,
  Cloud,
  Loader,
  RotateCcw,
  Maximize,
  Minimize,
  Target,
  Tag,
  Bookmark,
  Gift,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Link,
  List as ListIcon,
  Grid,
  Sun,
  Smartphone,
  Navigation,
  Map,
  MapPin as LocationIcon,
  TreePine as Seedling,
  TreePine,
  Flower,
  Flower2,
  Leaf,
  Package as Seed,
  DollarSign,
  FileImage as ImageIcon
} from 'lucide-react'

export type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

// よく使用されるアイコンをエクスポート
export const Icons = {
  // 基本操作
  add: Plus,
  edit: Edit,
  delete: Trash2,
  remove: X,
  save: Save,
  copy: Copy,
  search: Search,
  filter: Filter,
  refresh: Refresh,
  
  // ナビゲーション
  back: ArrowLeft,
  forward: ArrowRight,
  up: ChevronLeft,
  down: ChevronRight,
  chevronDown: ChevronDown,
  menu: Menu,
  more: MoreVertical,
  
  // ユーザー関連
  user: User,
  users: Users,
  profile: UserCheck,
  logout: LogOut,
  
  // 日時
  calendar: Calendar,
  clock: Clock,
  
  // ファイル・ドキュメント
  file: FileText,
  document: FileText,
  image: ImageIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  
  // 商品・ショッピング
  product: Package,
  cart: ShoppingCart,
  payment: CreditCard,
  money: DollarSign,
  
  // 通信・接続
  phone: Phone,
  mail: Mail,
  link: Link,
  share: Share2,
  message: MessageCircle,
  
  // 場所・位置
  location: MapPin,
  map: Map,
  navigation: Navigation,
  
  // ステータス
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  help: HelpCircle,
  
  // 表示・UI
  eye: Eye,
  eyeOff: EyeOff,
  show: Eye,
  hide: EyeOff,
  expand: Maximize,
  collapse: Minimize,
  
  // セキュリティ
  lock: Lock,
  unlock: Unlock,
  security: Lock,
  exit: LogOut,
  
  // データ・統計
  chart: BarChart,
  stats: BarChart,
  database: Database,
  
  // 設定・管理
  settings: Settings,
  admin: Settings,
  config: Settings,
  
  // ホーム・メイン
  home: Home,
  dashboard: Home,
  
  // リスト・一覧
  list: ListIcon,
  grid: Grid,
  
  // 通知・アラート
  notification: Bell,
  alert: AlertCircle,
  
  // QRコード
  qrcode: QrCode,
  
  // 植物・園芸関連
  plant: Seedling,
  seed: Seed,
  flower: Flower,
  tree: TreePine,
  leaf: Leaf,
  garden: Flower2,
  
  // 天気・自然
  sun: Sun,
  cloud: Cloud,
  rain: Cloud,
  weather: Sun,
  
  // ローダー・進行状況
  loading: Loader,
  spinner: RotateCcw,
  
  // その他
  star: Star,
  heart: Heart,
  target: Target,
  tag: Tag,
  bookmark: Bookmark,
  gift: Gift,
  
  // アクション確認
  check: Check,
  cancel: X,
  confirm: CheckCircle,
  
  // 絵文字置き換え用
  customerInfo: User,        // 👤
  reservationInfo: Calendar, // 📅
  otherInfo: FileText,      // 📝
  packageIcon: Package,     // 📦
  mobileIcon: Smartphone,   // 📱
  saveIcon: Save,          // 💾
  qrIcon: QrCode,          // QRコード
  searchIcon: Search,      // 🔍
  deleteIcon: Trash2,      // 🗑️
  closeIcon: X,            // ✕
  moneyIcon: DollarSign    // 💰
} as const

// アイコンサイズの定数
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const

// アイコンプロパティの型定義
export interface IconProps {
  size?: keyof typeof IconSizes | number
  className?: string
  color?: string
}

// アイコンラッパーコンポーネント
export const Icon: React.FC<{
  icon: IconType
  size?: keyof typeof IconSizes | number
  className?: string
  color?: string
}> = ({ icon: IconComponent, size = 'md', className = '', color, ...props }) => {
  const iconSize = typeof size === 'number' ? size : IconSizes[size]
  
  return (
    <IconComponent
      width={iconSize}
      height={iconSize}
      className={className}
      color={color}
      {...props}
    />
  )
}

export default Icons