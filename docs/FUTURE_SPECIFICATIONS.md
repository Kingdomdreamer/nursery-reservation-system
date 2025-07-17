# 将来仕様設計書 - フォーム利用履歴・購入履歴記録機能

## 📋 概要

本書は種苗店予約システムにおける将来実装予定の機能について詳細に設計したものです。特に以下の2つの主要機能について詳述します：

1. **フォーム利用履歴・購入履歴記録機能**
2. **リピート率向上のためのLINE配信機能**

## 🎯 目的

### 1. 顧客エンゲージメント向上
- 顧客の行動パターンを分析し、個別最適化されたサービス提供
- リピート率の向上とロイヤルカスタマーの育成

### 2. データドリブンな販売促進
- 購入履歴に基づくレコメンデーション
- 季節性やトレンドに応じた商品提案

### 3. 効率的なマーケティング
- セグメント別のターゲティング配信
- 自動化された顧客フォローアップ

## 🗄️ 1. フォーム利用履歴・購入履歴記録機能

### 1.1 データベース設計

#### 1.1.1 新規テーブル設計

**A. form_usage_history（フォーム利用履歴）**
```sql
CREATE TABLE form_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  
  -- アクセス情報
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  
  -- デバイス・環境情報
  user_agent TEXT,
  device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  screen_resolution VARCHAR(20),
  is_line_app BOOLEAN DEFAULT false,
  
  -- 操作情報
  time_spent_seconds INTEGER,
  fields_filled INTEGER DEFAULT 0,
  total_fields INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2), -- パーセンテージ
  
  -- 離脱・エラー情報
  exit_step INTEGER,
  error_count INTEGER DEFAULT 0,
  error_details JSONB,
  
  -- 地理情報（IPベース）
  ip_address INET,
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  
  -- 参照元情報
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  utm_term VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**B. purchase_history（購入履歴）**
```sql
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255),
  
  -- 購入基本情報
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  item_count INTEGER NOT NULL,
  payment_method VARCHAR(50), -- 'cash', 'credit', 'qr', etc.
  
  -- 商品詳細
  purchased_items JSONB NOT NULL, -- 購入商品の詳細配列
  categories JSONB, -- 購入したカテゴリの配列
  
  -- 季節・トレンド分析用
  season VARCHAR(20), -- 'spring', 'summer', 'autumn', 'winter'
  month_of_year INTEGER, -- 1-12
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
  week_of_year INTEGER, -- 1-53
  
  -- 購入パターン分析用
  days_since_last_purchase INTEGER,
  is_repeat_customer BOOLEAN DEFAULT false,
  repeat_count INTEGER DEFAULT 0,
  customer_lifetime_value DECIMAL(10,2),
  
  -- マーケティング効果測定
  campaign_id VARCHAR(255),
  promotion_code VARCHAR(100),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  
  -- 満足度・フィードバック
  satisfaction_score INTEGER, -- 1-5 scale
  feedback_provided BOOLEAN DEFAULT false,
  feedback_text TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**C. customer_behavior_analytics（顧客行動分析）**
```sql
CREATE TABLE customer_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255),
  analysis_date DATE NOT NULL,
  
  -- 行動指標
  form_access_count INTEGER DEFAULT 0,
  form_completion_rate DECIMAL(5,2) DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- 購入指標
  purchase_count INTEGER DEFAULT 0,
  total_purchase_amount DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  purchase_frequency DECIMAL(5,2) DEFAULT 0,
  
  -- エンゲージメント指標
  last_form_access TIMESTAMP WITH TIME ZONE,
  last_purchase TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER, -- 1-100 scale
  loyalty_tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum'
  
  -- 予測・セグメント
  predicted_next_purchase DATE,
  churn_risk_score DECIMAL(5,2), -- 0-100%
  customer_segment VARCHAR(50),
  recommended_products JSONB,
  
  -- LINE特有の指標
  line_engagement_score INTEGER, -- 1-100 scale
  line_message_open_rate DECIMAL(5,2),
  line_link_click_rate DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.1.2 インデックス設計

```sql
-- 高速検索用インデックス
CREATE INDEX idx_form_usage_history_user_id ON form_usage_history(user_id);
CREATE INDEX idx_form_usage_history_line_user_id ON form_usage_history(line_user_id);
CREATE INDEX idx_form_usage_history_accessed_at ON form_usage_history(accessed_at);
CREATE INDEX idx_form_usage_history_form_id ON form_usage_history(form_id);

CREATE INDEX idx_purchase_history_customer_id ON purchase_history(customer_id);
CREATE INDEX idx_purchase_history_purchase_date ON purchase_history(purchase_date);
CREATE INDEX idx_purchase_history_categories ON purchase_history USING GIN(categories);
CREATE INDEX idx_purchase_history_season ON purchase_history(season);

CREATE INDEX idx_customer_behavior_analytics_customer_id ON customer_behavior_analytics(customer_id);
CREATE INDEX idx_customer_behavior_analytics_analysis_date ON customer_behavior_analytics(analysis_date);
CREATE INDEX idx_customer_behavior_analytics_loyalty_tier ON customer_behavior_analytics(loyalty_tier);
```

### 1.2 データ収集機能

#### 1.2.1 フロントエンド追跡システム

**A. AnalyticsService.ts**
```typescript
export class AnalyticsService {
  private static sessionId: string = generateSessionId()
  private static startTime: number = Date.now()
  
  // フォームアクセス記録
  static async recordFormAccess(formId: string, userId?: string, lineUserId?: string) {
    const deviceInfo = this.getDeviceInfo()
    const locationInfo = await this.getLocationInfo()
    
    return await supabase
      .from('form_usage_history')
      .insert({
        user_id: userId,
        line_user_id: lineUserId,
        form_id: formId,
        session_id: this.sessionId,
        accessed_at: new Date().toISOString(),
        ...deviceInfo,
        ...locationInfo
      })
  }
  
  // フォーム完了記録
  static async recordFormCompletion(formId: string, fieldsData: any) {
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000)
    const completion = this.calculateCompletionRate(fieldsData)
    
    return await supabase
      .from('form_usage_history')
      .update({
        completed_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
        fields_filled: completion.filled,
        total_fields: completion.total,
        completion_rate: completion.rate
      })
      .eq('session_id', this.sessionId)
  }
  
  // 購入履歴記録
  static async recordPurchase(purchaseData: PurchaseData) {
    const seasonalData = this.getSeasonalData()
    const behaviorData = await this.getBehaviorData(purchaseData.customerId)
    
    return await supabase
      .from('purchase_history')
      .insert({
        ...purchaseData,
        ...seasonalData,
        ...behaviorData
      })
  }
}
```

#### 1.2.2 自動分析システム

**A. 日次分析バッチジョブ**
```sql
-- 顧客行動分析の日次更新関数
CREATE OR REPLACE FUNCTION update_daily_customer_analytics()
RETURNS void AS $$
BEGIN
  INSERT INTO customer_behavior_analytics (
    customer_id,
    line_user_id,
    analysis_date,
    form_access_count,
    form_completion_rate,
    purchase_count,
    total_purchase_amount,
    engagement_score,
    loyalty_tier
  )
  SELECT 
    c.id as customer_id,
    c.line_user_id,
    CURRENT_DATE as analysis_date,
    
    -- フォーム指標
    COALESCE(fuh.access_count, 0) as form_access_count,
    COALESCE(fuh.completion_rate, 0) as form_completion_rate,
    
    -- 購入指標
    COALESCE(ph.purchase_count, 0) as purchase_count,
    COALESCE(ph.total_amount, 0) as total_purchase_amount,
    
    -- エンゲージメントスコア計算
    calculate_engagement_score(c.id) as engagement_score,
    determine_loyalty_tier(c.id) as loyalty_tier
    
  FROM customers c
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as access_count,
      AVG(completion_rate) as completion_rate
    FROM form_usage_history 
    WHERE DATE(accessed_at) = CURRENT_DATE
    GROUP BY user_id
  ) fuh ON c.id = fuh.user_id
  LEFT JOIN (
    SELECT 
      customer_id,
      COUNT(*) as purchase_count,
      SUM(total_amount) as total_amount
    FROM purchase_history 
    WHERE purchase_date = CURRENT_DATE
    GROUP BY customer_id
  ) ph ON c.id = ph.customer_id
  
  ON CONFLICT (customer_id, analysis_date) 
  DO UPDATE SET
    form_access_count = EXCLUDED.form_access_count,
    form_completion_rate = EXCLUDED.form_completion_rate,
    purchase_count = EXCLUDED.purchase_count,
    total_purchase_amount = EXCLUDED.total_purchase_amount,
    engagement_score = EXCLUDED.engagement_score,
    loyalty_tier = EXCLUDED.loyalty_tier,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 分析・レポート機能

#### 1.3.1 管理画面ダッシュボード

**A. CustomerAnalyticsDashboard.tsx**
```typescript
interface AnalyticsDashboardProps {
  dateRange: DateRange
  segmentFilter?: string
}

export const CustomerAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  dateRange,
  segmentFilter
}) => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics[]>([])
  const [summaryStats, setSummaryStats] = useState<SummaryStats>()
  
  return (
    <div className="analytics-dashboard">
      {/* サマリー統計 */}
      <div className="row mb-4">
        <StatsCard
          title="総フォーム利用数"
          value={summaryStats?.totalFormUsage}
          trend={summaryStats?.formUsageTrend}
        />
        <StatsCard
          title="平均完了率"
          value={`${summaryStats?.avgCompletionRate}%`}
          trend={summaryStats?.completionRateTrend}
        />
        <StatsCard
          title="リピート率"
          value={`${summaryStats?.repeatRate}%`}
          trend={summaryStats?.repeatRateTrend}
        />
      </div>
      
      {/* チャート */}
      <div className="row mb-4">
        <div className="col-md-8">
          <FormUsageTrendChart data={analytics} />
        </div>
        <div className="col-md-4">
          <CustomerSegmentChart data={analytics} />
        </div>
      </div>
      
      {/* 詳細テーブル */}
      <CustomerAnalyticsTable 
        data={analytics}
        onExport={handleExport}
      />
    </div>
  )
}
```

## 🔔 2. リピート率向上のためのLINE配信機能

### 2.1 配信システム設計

#### 2.1.1 配信管理テーブル

**A. line_campaign_management（LINE配信管理）**
```sql
CREATE TABLE line_campaign_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL, -- 'welcome', 'retention', 'reactivation', 'seasonal', 'promotional'
  
  -- ターゲティング設定
  target_criteria JSONB NOT NULL, -- セグメント条件
  target_customer_count INTEGER DEFAULT 0,
  
  -- 配信設定
  scheduled_at TIMESTAMP WITH TIME ZONE,
  frequency VARCHAR(50), -- 'once', 'daily', 'weekly', 'monthly'
  max_sends INTEGER DEFAULT 1,
  
  -- メッセージ設定
  message_template JSONB NOT NULL,
  personalization_fields JSONB,
  
  -- 配信状態
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'completed', 'paused'
  created_by UUID REFERENCES auth.users(id),
  
  -- 効果測定
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**B. line_message_logs（LINE配信ログ）**
```sql
CREATE TABLE line_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES line_campaign_management(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255) NOT NULL,
  
  -- 配信情報
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message_content JSONB NOT NULL,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  
  -- 反応情報
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2),
  
  -- エラー情報
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 自動配信ルール

#### 2.2.1 トリガーベース配信

**A. 購入後フォローアップ**
```sql
-- 購入後3日でのフォローアップ配信
CREATE OR REPLACE FUNCTION trigger_post_purchase_followup()
RETURNS TRIGGER AS $$
BEGIN
  -- 3日後のフォローアップメッセージをスケジュール
  INSERT INTO line_campaign_management (
    campaign_name,
    campaign_type,
    target_criteria,
    scheduled_at,
    message_template,
    status
  ) VALUES (
    '購入後フォローアップ - ' || NEW.customer_id,
    'retention',
    jsonb_build_object('customer_id', NEW.customer_id),
    NEW.purchase_date + INTERVAL '3 days',
    jsonb_build_object(
      'type', 'flex',
      'altText', 'ご購入ありがとうございました',
      'contents', get_post_purchase_message_template(NEW.id)
    ),
    'scheduled'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_purchase_followup_trigger
  AFTER INSERT ON purchase_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_post_purchase_followup();
```

**B. 休眠顧客復帰施策**
```sql
-- 30日間未購入の顧客への配信
CREATE OR REPLACE FUNCTION schedule_reactivation_campaigns()
RETURNS void AS $$
BEGIN
  INSERT INTO line_campaign_management (
    campaign_name,
    campaign_type,
    target_criteria,
    scheduled_at,
    message_template,
    status
  )
  SELECT 
    '休眠顧客復帰キャンペーン - ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
    'reactivation',
    jsonb_build_object('inactive_days', 30, 'has_line_id', true),
    CURRENT_TIMESTAMP + INTERVAL '1 hour',
    get_reactivation_message_template(),
    'scheduled'
  WHERE NOT EXISTS (
    SELECT 1 FROM line_campaign_management 
    WHERE campaign_type = 'reactivation' 
    AND DATE(created_at) = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;
```

### 2.3 パーソナライゼーション機能

#### 2.3.1 動的メッセージ生成

**A. MessagePersonalizationService.ts**
```typescript
export class MessagePersonalizationService {
  static async generatePersonalizedMessage(
    customerId: string,
    templateType: string,
    additionalData?: any
  ): Promise<FlexMessage> {
    
    const customer = await this.getCustomerProfile(customerId)
    const behaviorData = await this.getCustomerBehavior(customerId)
    const recommendations = await this.getRecommendations(customerId)
    
    switch (templateType) {
      case 'welcome':
        return this.createWelcomeMessage(customer)
      
      case 'seasonal_recommendation':
        return this.createSeasonalRecommendation(customer, recommendations)
      
      case 'reorder_reminder':
        return this.createReorderReminder(customer, behaviorData)
      
      case 'special_offer':
        return this.createSpecialOffer(customer, additionalData)
      
      default:
        return this.createGenericMessage(customer)
    }
  }
  
  private static createSeasonalRecommendation(
    customer: CustomerProfile,
    recommendations: Product[]
  ): FlexMessage {
    const season = this.getCurrentSeason()
    const topProducts = recommendations.slice(0, 3)
    
    return {
      type: 'flex',
      altText: `${customer.name}さんへの${season}のおすすめ商品`,
      contents: {
        type: 'carousel',
        contents: topProducts.map(product => ({
          type: 'bubble',
          hero: {
            type: 'image',
            url: product.imageUrl || 'https://example.com/default-product.jpg',
            size: 'full',
            aspectRatio: '20:13'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: product.name,
                weight: 'bold',
                size: 'lg'
              },
              {
                type: 'text',
                text: `¥${product.price.toLocaleString()}`,
                color: '#ff5551',
                size: 'md',
                weight: 'bold'
              },
              {
                type: 'text',
                text: product.description,
                size: 'sm',
                color: '#666666',
                wrap: true
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '予約する',
                  uri: `${process.env.NEXT_PUBLIC_BASE_URL}/form/reservation?product=${product.id}&utm_source=line&utm_campaign=seasonal`
                },
                style: 'primary'
              }
            ]
          }
        }))
      }
    }
  }
}
```

### 2.4 効果測定・分析

#### 2.4.1 配信効果レポート

**A. CampaignAnalyticsService.ts**
```typescript
export class CampaignAnalyticsService {
  static async getCampaignPerformance(campaignId: string): Promise<CampaignMetrics> {
    const [campaignData, messageStats] = await Promise.all([
      this.getCampaignData(campaignId),
      this.getMessageStatistics(campaignId)
    ])
    
    return {
      ...campaignData,
      deliveryRate: (messageStats.delivered / messageStats.sent) * 100,
      openRate: (messageStats.opened / messageStats.delivered) * 100,
      clickRate: (messageStats.clicked / messageStats.opened) * 100,
      conversionRate: (messageStats.converted / messageStats.clicked) * 100,
      roi: this.calculateROI(campaignData.cost, messageStats.totalRevenue)
    }
  }
  
  static async getCustomerJourneyAnalysis(customerId: string): Promise<CustomerJourney> {
    const touchpoints = await supabase
      .from('line_message_logs')
      .select(`
        *,
        campaign:line_campaign_management(*)
      `)
      .eq('customer_id', customerId)
      .order('sent_at', { ascending: true })
    
    return this.buildJourneyMap(touchpoints.data)
  }
}
```

## 🚀 実装ロードマップ

### Phase 1: 基盤構築（1-2ヶ月）
1. データベーススキーマの構築
2. 基本的なデータ収集機能の実装
3. 管理画面でのレポート表示

### Phase 2: 分析機能強化（2-3ヶ月）
1. 高度な顧客セグメンテーション
2. 予測分析機能
3. リアルタイムダッシュボード

### Phase 3: 自動配信システム（3-4ヶ月）
1. LINE配信管理機能
2. 自動配信ルールエンジン
3. パーソナライゼーション機能

### Phase 4: 最適化・拡張（4-6ヶ月）
1. A/Bテスト機能
2. 高度な効果測定
3. 機械学習による最適化

## 📊 期待される効果

### 1. 顧客体験の向上
- 個別最適化された商品推奨
- タイムリーな情報提供
- 顧客の購買意欲向上

### 2. 売上向上
- リピート率 20-30% 向上
- 平均購入単価 15-25% 向上
- 新規顧客獲得率 10-20% 向上

### 3. 運営効率化
- マーケティング活動の自動化
- データドリブンな意思決定
- 顧客対応の効率化

---

**作成日**: 2025年7月16日  
**バージョン**: 1.0  
**対象システム**: 種苗店予約システム（ベジライス様専用）