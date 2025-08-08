/**
 * 予約キャンセル・変更 E2E テスト
 * キャンセル画面の動作確認
 */

import { test, expect } from '@playwright/test';

test.describe('Cancel Reservation E2E Tests', () => {
  // テスト用の予約IDとキャンセルトークンを設定
  const testReservationId = 'test-reservation-id-123';
  const testCancelToken = 'test-cancel-token-456';

  test.beforeEach(async ({ page }) => {
    // API モックの設定
    await page.route('**/api/reservations/**', async (route, request) => {
      const url = request.url();
      
      if (request.method() === 'GET' && url.includes(testReservationId)) {
        // 予約詳細取得のモック
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testReservationId,
              user_name: 'テストユーザー',
              phone_number: '090-1234-5678',
              selected_products: [
                {
                  product_id: 1,
                  product_name: 'テスト商品1',
                  variation_name: 'サイズM',
                  quantity: 2,
                  price: 1000,
                  pickup_date: '2025-08-15'
                }
              ],
              total_amount: 2000,
              pickup_date: '2025-08-15',
              status: 'confirmed',
              cancel_token: testCancelToken,
              created_at: '2025-08-07T12:00:00.000Z'
            }
          })
        });
      }
      
      if (request.method() === 'DELETE' && url.includes(testReservationId)) {
        // 予約キャンセルのモック
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '予約をキャンセルしました'
          })
        });
      }
      
      if (request.method() === 'PUT' && url.includes(testReservationId)) {
        // 予約変更のモック
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: testReservationId,
              message: '予約を変更しました'
            }
          })
        });
      }
    });
  });

  test('should authenticate with phone number and display reservation details', async ({ page }) => {
    await page.goto(`/cancel/${testReservationId}`);

    // 認証画面の確認
    await expect(page.getByText('予約の確認')).toBeVisible();
    await expect(page.getByLabel('電話番号')).toBeVisible();

    // 電話番号を入力
    await page.fill('[name="phone_number"]', '090-1234-5678');
    await page.getByRole('button', { name: /確認|認証/ }).click();

    // 予約詳細が表示されることを確認
    await expect(page.getByText('テストユーザー')).toBeVisible();
    await expect(page.getByText('090-1234-5678')).toBeVisible();
    await expect(page.getByText('テスト商品1')).toBeVisible();
    await expect(page.getByText('¥2,000')).toBeVisible();
    await expect(page.getByText('2025年8月15日')).toBeVisible();

    // キャンセルと変更ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /キャンセル/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /変更/ })).toBeVisible();
  });

  test('should authenticate with cancel token directly', async ({ page }) => {
    await page.goto(`/cancel/${testReservationId}?token=${testCancelToken}`);

    // キャンセルトークンがある場合は電話番号認証をスキップ
    await expect(page.getByText('テストユーザー')).toBeVisible();
    await expect(page.getByText('予約詳細')).toBeVisible();
  });

  test('should handle authentication errors', async ({ page }) => {
    // 間違った予約情報のモック
    await page.route(`**/api/reservations/${testReservationId}`, route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: '予約が見つかりません',
          code: 'RESOURCE_NOT_FOUND'
        })
      });
    });

    await page.goto(`/cancel/${testReservationId}`);

    // 間違った電話番号で認証
    await page.fill('[name="phone_number"]', '090-9999-9999');
    await page.getByRole('button', { name: /確認|認証/ }).click();

    // エラーメッセージの確認
    await expect(page.getByText('予約が見つかりません')).toBeVisible();
  });

  test('should cancel reservation successfully', async ({ page }) => {
    await page.goto(`/cancel/${testReservationId}?token=${testCancelToken}`);

    // 予約詳細の表示を待機
    await expect(page.getByText('テストユーザー')).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: /キャンセル/ }).click();

    // 確認ダイアログの確認
    await expect(page.getByText('予約をキャンセルしますか？')).toBeVisible();
    await page.getByRole('button', { name: /はい|キャンセルする/ }).click();

    // キャンセル完了メッセージの確認
    await expect(page.getByText('予約をキャンセルしました')).toBeVisible();
    
    // キャンセル後は変更・キャンセルボタンが無効になることを確認
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeDisabled();
    }
  });

  test('should modify reservation details', async ({ page }) => {
    await page.goto(`/cancel/${testReservationId}?token=${testCancelToken}`);

    // 予約詳細の表示を待機
    await expect(page.getByText('テストユーザー')).toBeVisible();

    // 変更ボタンをクリック
    await page.getByRole('button', { name: /変更/ }).click();

    // 編集モードに変わることを確認
    await expect(page.getByText('予約内容の変更')).toBeVisible();

    // ユーザー名の変更
    const nameInput = page.locator('[name="user_name"]');
    if (await nameInput.isVisible()) {
      await nameInput.clear();
      await nameInput.fill('変更後ユーザー');
    }

    // 商品数量の変更
    const quantityInput = page.locator('[data-testid="product-quantity"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.clear();
      await quantityInput.fill('3');
    }

    // 変更を保存
    await page.getByRole('button', { name: /保存|更新/ }).click();

    // 変更完了メッセージの確認
    await expect(page.getByText('予約を変更しました')).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto(`/cancel/${testReservationId}`);

    // 無効な電話番号フォーマットを入力
    await page.fill('[name="phone_number"]', '無効な番号');
    await page.getByRole('button', { name: /確認|認証/ }).click();

    // バリデーションエラーの確認
    await expect(page.getByText(/正しい電話番号を入力してください/)).toBeVisible();

    // 空の電話番号
    await page.fill('[name="phone_number"]', '');
    await page.getByRole('button', { name: /確認|認証/ }).click();

    await expect(page.getByText(/電話番号を入力してください/)).toBeVisible();
  });

  test('should handle cancelled reservation status', async ({ page }) => {
    // キャンセル済み予約のモック
    await page.route(`**/api/reservations/${testReservationId}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: testReservationId,
            user_name: 'テストユーザー',
            phone_number: '090-1234-5678',
            selected_products: [
              {
                product_id: 1,
                product_name: 'テスト商品1',
                variation_name: 'サイズM',
                quantity: 2,
                price: 1000,
                pickup_date: '2025-08-15'
              }
            ],
            total_amount: 2000,
            pickup_date: '2025-08-15',
            status: 'cancelled', // キャンセル済み
            cancel_token: testCancelToken,
            created_at: '2025-08-07T12:00:00.000Z'
          }
        })
      });
    });

    await page.goto(`/cancel/${testReservationId}?token=${testCancelToken}`);

    // キャンセル済みのメッセージを確認
    await expect(page.getByText('この予約はキャンセル済みです')).toBeVisible();
    
    // キャンセル・変更ボタンが無効であることを確認
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    const modifyButton = page.getByRole('button', { name: /変更/ });
    
    if (await cancelButton.isVisible()) {
      await expect(cancelButton).toBeDisabled();
    }
    if (await modifyButton.isVisible()) {
      await expect(modifyButton).toBeDisabled();
    }
  });

  test('should display proper error messages for network failures', async ({ page }) => {
    // ネットワークエラーのシミュレート
    await page.route(`**/api/reservations/${testReservationId}`, route => {
      route.abort('failed');
    });

    await page.goto(`/cancel/${testReservationId}`);

    await page.fill('[name="phone_number"]', '090-1234-5678');
    await page.getByRole('button', { name: /確認|認証/ }).click();

    // ネットワークエラーメッセージの確認
    await expect(page.getByText(/通信エラー|接続に失敗|もう一度お試し/)).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/cancel/${testReservationId}?token=${testCancelToken}`);

    // モバイルでの表示確認
    await expect(page.getByText('テストユーザー')).toBeVisible();
    
    // スクロール可能であることを確認
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // ボタンがタッチ操作で使えることを確認
    const cancelButton = page.getByRole('button', { name: /キャンセル/ });
    if (await cancelButton.isVisible()) {
      // タップしてダイアログを開く
      await cancelButton.tap();
      await expect(page.getByText('予約をキャンセルしますか？')).toBeVisible();
      
      // キャンセル（ダイアログを閉じる）
      await page.getByRole('button', { name: /いいえ|戻る/ }).tap();
    }
  });

  test('should show reservation history if available', async ({ page }) => {
    // 履歴付きの予約情報のモック
    await page.route(`**/api/reservations/${testReservationId}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: testReservationId,
            user_name: 'テストユーザー',
            phone_number: '090-1234-5678',
            selected_products: [
              {
                product_id: 1,
                product_name: 'テスト商品1',
                variation_name: 'サイズM',
                quantity: 2,
                price: 1000,
                pickup_date: '2025-08-15'
              }
            ],
            total_amount: 2000,
            pickup_date: '2025-08-15',
            status: 'confirmed',
            cancel_token: testCancelToken,
            created_at: '2025-08-07T12:00:00.000Z',
            history: [
              {
                action: 'created',
                timestamp: '2025-08-07T12:00:00.000Z',
                details: '予約が作成されました'
              },
              {
                action: 'modified',
                timestamp: '2025-08-07T13:00:00.000Z',
                details: '数量を変更しました'
              }
            ]
          }
        })
      });
    });

    await page.goto(`/cancel/${testReservationId}?token=${testCancelToken}`);

    // 履歴セクションの確認
    if (await page.getByText('変更履歴').isVisible()) {
      await expect(page.getByText('予約が作成されました')).toBeVisible();
      await expect(page.getByText('数量を変更しました')).toBeVisible();
    }
  });
});