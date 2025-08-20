/**
 * ビジネスコンポーネント統合エクスポート
 * ドメインロジックを持つコンポーネントの統一インターフェース
 */

// 商品関連コンポーネント
export { ProductComponent, ProductCard } from './Product/ProductComponent';
export type { ProductComponentProps } from './Product/ProductComponent';

// 予約関連コンポーネント
export { ReservationComponent, ReservationCard } from './Reservation/ReservationComponent';
export type { ReservationComponentProps } from './Reservation/ReservationComponent';

// 将来的な拡張用のエクスポート予約
// export { PresetComponent } from './Preset/PresetComponent';
// export { FormComponent } from './Form/FormComponent';
// export { UserComponent } from './User/UserComponent';