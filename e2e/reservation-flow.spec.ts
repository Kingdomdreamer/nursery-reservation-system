/**
 * 予約フォーム E2E テスト
 * 完全な予約フローの動作確認
 */

import { test, expect } from '@playwright/test';

test.describe('Reservation Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // モックデータの設定が必要な場合はここで実行
    // await page.route('**/api/**', route => route.continue());
  });

  test('should complete full reservation flow successfully', async ({ page }) => {
    // プリセットIDが1のフォームに移動
    await page.goto('/form/1');

    // フォームが読み込まれるまで待機
    await page.waitForSelector('[data-testid="reservation-form"]', { timeout: 10000 });

    // フォームタイトルの確認
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 必要な入力項目を確認
    await expect(page.getByLabel('お名前')).toBeVisible();
    await expect(page.getByLabel('電話番号')).toBeVisible();

    // ユーザー情報の入力
    await page.fill('[name="user_name"]', 'テストユーザー');
    await page.fill('[name="phone_number"]', '090-1234-5678');

    // 生年月日が有効な場合の入力
    const birthdayField = page.locator('[name="birthday"]');
    if (await birthdayField.isVisible()) {
      await birthdayField.fill('1990-01-01');
    }

    // ふりがなが有効な場合の入力
    const furiganaField = page.locator('[name="furigana"]');
    if (await furiganaField.isVisible()) {
      await furiganaField.fill('テストユーザー');
    }

    // 性別が有効な場合の選択
    const genderSelect = page.locator('[name="gender"]');
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption('男性');
    }

    // 商品選択セクションを待機
    await page.waitForSelector('[data-testid="product-selection"]');

    // 最初の商品を選択
    const firstProductCheckbox = page.locator('[data-testid="product-checkbox"]').first();
    if (await firstProductCheckbox.isVisible()) {
      await firstProductCheckbox.click();

      // 数量の設定
      const quantityInput = page.locator('[data-testid="product-quantity"]').first();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('2');
      }

      // 引き取り日の選択
      const pickupDateInput = page.locator('[data-testid="pickup-date"]').first();
      if (await pickupDateInput.isVisible()) {
        await pickupDateInput.click();
        
        // カレンダーから日付を選択（利用可能な最初の日付）
        const availableDate = page.locator('[data-testid="available-date"]').first();
        await availableDate.click();
      }
    }

    // 確認画面に進む
    const proceedButton = page.getByRole('button', { name: /確認|次へ|続行/ });
    await expect(proceedButton).toBeVisible();
    await proceedButton.click();

    // 確認画面の確認
    await page.waitForSelector('[data-testid="confirmation-screen"]');
    await expect(page.getByText('ご予約内容の確認')).toBeVisible();

    // 入力内容の確認
    await expect(page.getByText('テストユーザー')).toBeVisible();
    await expect(page.getByText('090-1234-5678')).toBeVisible();

    // 予約確定
    const confirmButton = page.getByRole('button', { name: /予約する|確定|送信/ });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 完了画面の確認
    await page.waitForSelector('[data-testid="completion-screen"]', { timeout: 15000 });
    await expect(page.getByText('予約が完了しました')).toBeVisible();

    // キャンセルURLが表示されることを確認
    await expect(page.getByText(/キャンセル|変更/)).toBeVisible();
    const cancelLink = page.getByRole('link', { name: /キャンセル|変更/ });
    await expect(cancelLink).toHaveAttribute('href', /\/cancel\//);
  });

  test('should handle validation errors properly', async ({ page }) => {
    await page.goto('/form/1');
    await page.waitForSelector('[data-testid="reservation-form"]');

    // 必須項目を空のまま送信を試行
    const proceedButton = page.getByRole('button', { name: /確認|次へ|続行/ });
    await proceedButton.click();

    // バリデーションエラーの確認
    await expect(page.getByText(/お名前を入力してください|必須項目です/)).toBeVisible();
    await expect(page.getByText(/電話番号を入力してください/)).toBeVisible();

    // 無効な電話番号での確認
    await page.fill('[name="user_name"]', 'テストユーザー');
    await page.fill('[name="phone_number"]', '無効な電話番号');
    await proceedButton.click();

    await expect(page.getByText(/正しい電話番号を入力してください/)).toBeVisible();
  });

  test('should handle product selection requirements', async ({ page }) => {
    await page.goto('/form/1');
    await page.waitForSelector('[data-testid="reservation-form"]');

    // ユーザー情報を入力
    await page.fill('[name="user_name"]', 'テストユーザー');
    await page.fill('[name="phone_number"]', '090-1234-5678');

    // 商品を選択せずに進む
    const proceedButton = page.getByRole('button', { name: /確認|次へ|続行/ });
    await proceedButton.click();

    // 商品選択エラーの確認
    await expect(page.getByText(/商品を選択してください/)).toBeVisible();
  });

  test('should display correct pricing information', async ({ page }) => {
    await page.goto('/form/1');
    await page.waitForSelector('[data-testid="reservation-form"]');

    // 商品の価格表示を確認
    const productPrice = page.locator('[data-testid="product-price"]').first();
    if (await productPrice.isVisible()) {
      const priceText = await productPrice.textContent();
      expect(priceText).toMatch(/¥|円|\d+/);
    }

    // 商品選択後の合計金額計算
    const firstProductCheckbox = page.locator('[data-testid="product-checkbox"]').first();
    if (await firstProductCheckbox.isVisible()) {
      await firstProductCheckbox.click();

      // 数量を変更
      const quantityInput = page.locator('[data-testid="product-quantity"]').first();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('3');

        // 合計金額の更新を待機
        await page.waitForTimeout(1000);
        
        const totalAmount = page.locator('[data-testid="total-amount"]');
        if (await totalAmount.isVisible()) {
          const totalText = await totalAmount.textContent();
          expect(totalText).toMatch(/¥|円|\d+/);
        }
      }
    }
  });

  test('should handle calendar date selection', async ({ page }) => {
    await page.goto('/form/1');
    await page.waitForSelector('[data-testid="reservation-form"]');

    // 商品を選択
    const firstProductCheckbox = page.locator('[data-testid="product-checkbox"]').first();
    if (await firstProductCheckbox.isVisible()) {
      await firstProductCheckbox.click();

      // カレンダーを開く
      const pickupDateInput = page.locator('[data-testid="pickup-date"]').first();
      if (await pickupDateInput.isVisible()) {
        await pickupDateInput.click();

        // カレンダーが表示されることを確認
        await expect(page.locator('[data-testid="calendar"]')).toBeVisible();

        // 利用可能な日付の確認
        const availableDates = page.locator('[data-testid="available-date"]');
        const count = await availableDates.count();
        expect(count).toBeGreaterThan(0);

        // 無効な日付は選択できないことを確認
        const disabledDates = page.locator('[data-testid="disabled-date"]');
        if (await disabledDates.count() > 0) {
          await disabledDates.first().click();
          // エラーメッセージまたは選択されないことを確認
          await expect(page.getByText(/選択できない日付です|期間外です/)).toBeVisible().catch(() => {
            // エラーメッセージが表示されない場合は、日付が選択されていないことを確認
            expect(pickupDateInput).not.toHaveValue();
          });
        }
      }
    }
  });

  test('should be responsive on mobile devices', async ({ page, context }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/form/1');
    await page.waitForSelector('[data-testid="reservation-form"]');

    // フォームがモバイルで適切に表示されることを確認
    const form = page.locator('[data-testid="reservation-form"]');
    await expect(form).toBeVisible();

    // スクロール可能であることを確認
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));

    // タッチ操作での商品選択
    const firstProductCheckbox = page.locator('[data-testid="product-checkbox"]').first();
    if (await firstProductCheckbox.isVisible()) {
      await firstProductCheckbox.tap();
      await expect(firstProductCheckbox).toBeChecked();
    }
  });

  test.describe('Error Scenarios', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('**/api/reservations', route => {
        route.abort('failed');
      });

      await page.goto('/form/1');
      await page.waitForSelector('[data-testid="reservation-form"]');

      // フォームを入力
      await page.fill('[name="user_name"]', 'テストユーザー');
      await page.fill('[name="phone_number"]', '090-1234-5678');

      // 商品選択
      const firstProductCheckbox = page.locator('[data-testid="product-checkbox"]').first();
      if (await firstProductCheckbox.isVisible()) {
        await firstProductCheckbox.click();
      }

      // 確認画面に進んで送信
      await page.getByRole('button', { name: /確認|次へ/ }).click();
      
      if (await page.locator('[data-testid="confirmation-screen"]').isVisible()) {
        await page.getByRole('button', { name: /予約する|確定/ }).click();

        // ネットワークエラーのメッセージを確認
        await expect(page.getByText(/通信エラー|送信に失敗|もう一度/)).toBeVisible();
      }
    });

    test('should handle API errors with proper user feedback', async ({ page }) => {
      // APIエラーをシミュレート
      await page.route('**/api/reservations', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'プリセットの期限が切れています',
            code: 'PRESET_ERROR'
          })
        });
      });

      await page.goto('/form/1');
      await page.waitForSelector('[data-testid="reservation-form"]');

      // フォームを完成させて送信
      await page.fill('[name="user_name"]', 'テストユーザー');
      await page.fill('[name="phone_number"]', '090-1234-5678');

      const firstProductCheckbox = page.locator('[data-testid="product-checkbox"]').first();
      if (await firstProductCheckbox.isVisible()) {
        await firstProductCheckbox.click();
      }

      await page.getByRole('button', { name: /確認|次へ/ }).click();
      
      if (await page.locator('[data-testid="confirmation-screen"]').isVisible()) {
        await page.getByRole('button', { name: /予約する|確定/ }).click();

        // APIエラーメッセージの確認
        await expect(page.getByText('プリセットの期限が切れています')).toBeVisible();
      }
    });
  });
});