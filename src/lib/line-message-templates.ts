// 予約確認メッセージ（キャンセルURL付き）
export function createReservationConfirmationFlex(reservation: any) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '✅ 予約確認',
          weight: 'bold',
          size: 'xl',
          color: '#27AE60',
        },
      ],
      backgroundColor: '#E8F6F3',
      paddingAll: 'lg',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${reservation.user_name}様`,
          weight: 'bold',
          size: 'lg',
          margin: 'none',
        },
        {
          type: 'text',
          text: 'ご予約ありがとうございます！',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📦 ご注文内容',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            ...reservation.products.map((product: any) => ({
              type: 'box',
              layout: 'baseline',
              margin: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '•',
                  size: 'sm',
                  color: '#666666',
                  flex: 0,
                },
                {
                  type: 'text',
                  text: `${product.name} × ${product.quantity}`,
                  size: 'sm',
                  flex: 4,
                  wrap: true,
                },
                {
                  type: 'text',
                  text: `¥${product.price.toLocaleString()}`,
                  size: 'sm',
                  align: 'end',
                  color: '#2C3E50',
                  flex: 2,
                },
              ],
            })),
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📅 受取予定日',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: new Date(reservation.pickup_date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }),
              size: 'lg',
              weight: 'bold',
              color: '#E74C3C',
              margin: 'sm',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📞 お客様情報',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: `電話番号: ${reservation.phone}`,
              size: 'sm',
              margin: 'sm',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '💰 合計金額',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: `¥${reservation.total_amount.toLocaleString()}`,
              size: 'xl',
              weight: 'bold',
              color: '#27AE60',
              margin: 'sm',
            },
          ],
        },
      ],
      paddingAll: 'lg',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '予約詳細を確認',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}/complete/${reservation.preset_id}?id=${reservation.id}`,
          },
          style: 'primary',
          color: '#27AE60',
        },
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '予約を変更・キャンセル',
            uri: reservation.cancel_url || `${process.env.NEXT_PUBLIC_BASE_URL}/cancel/${reservation.id}?token=${reservation.cancel_token}`,
          },
          style: 'secondary',
          color: '#E74C3C',
          margin: 'sm',
        },
        {
          type: 'text',
          text: '⚠️ キャンセルは受取日の前日まで可能です',
          size: 'xs',
          color: '#E74C3C',
          wrap: true,
          margin: 'md',
          align: 'center',
        },
        {
          type: 'text',
          text: 'ご不明点はお気軽にお問い合わせください',
          size: 'xs',
          color: '#999999',
          wrap: true,
          margin: 'sm',
          align: 'center',
        },
      ],
      paddingAll: 'lg',
    },
  };
}

// リマインダーメッセージ
export function createReminderFlex(reservation: any) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🔔 受取リマインダー',
          weight: 'bold',
          size: 'xl',
          color: '#F39C12',
        },
      ],
      backgroundColor: '#FEF9E7',
      paddingAll: 'lg',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${reservation.user_name}様`,
          weight: 'bold',
          size: 'lg',
          margin: 'none',
        },
        {
          type: 'text',
          text: '明日は商品の受取日です！',
          margin: 'md',
          color: '#E74C3C',
          weight: 'bold',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📦 受取商品',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            ...reservation.products.map((product: any) => ({
              type: 'text',
              text: `• ${product.name} × ${product.quantity}`,
              size: 'sm',
              margin: 'sm',
              wrap: true,
            })),
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📅 受取日時',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            {
              type: 'text',
              text: new Date(reservation.pickup_date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }),
              size: 'lg',
              weight: 'bold',
              color: '#E74C3C',
              margin: 'sm',
            },
            {
              type: 'text',
              text: '営業時間：9:00 - 17:00',
              size: 'sm',
              color: '#666666',
              margin: 'sm',
            },
          ],
        },
      ],
      paddingAll: 'lg',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '受取場所を確認',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}/location`,
          },
          style: 'primary',
          color: '#F39C12',
        },
      ],
      paddingAll: 'lg',
    },
  };
}

// キャンセル通知メッセージ
export function createCancellationFlex(reservation: any) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '❌ 予約キャンセル',
          weight: 'bold',
          size: 'xl',
          color: '#E74C3C',
        },
      ],
      backgroundColor: '#FADBD8',
      paddingAll: 'lg',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${reservation.user_name}様`,
          weight: 'bold',
          size: 'lg',
          margin: 'none',
        },
        {
          type: 'text',
          text: 'ご予約がキャンセルされました',
          margin: 'md',
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: [
            {
              type: 'text',
              text: '📦 キャンセルされた商品',
              weight: 'bold',
              color: '#2C3E50',
              margin: 'none',
            },
            ...reservation.products.map((product: any) => ({
              type: 'text',
              text: `• ${product.name} × ${product.quantity}`,
              size: 'sm',
              margin: 'sm',
              wrap: true,
            })),
          ],
        },
        {
          type: 'text',
          text: 'またのご利用をお待ちしております',
          margin: 'lg',
          align: 'center',
          color: '#666666',
        },
      ],
      paddingAll: 'lg',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '新しく予約する',
            uri: `${process.env.NEXT_PUBLIC_BASE_URL}/form/${reservation.preset_id}`,
          },
          style: 'primary',
          color: '#27AE60',
        },
      ],
      paddingAll: 'lg',
    },
  };
}