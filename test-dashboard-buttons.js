// Dashboard Quick Action Buttons Test Script
// このスクリプトをブラウザのコンソールで実行してクイックアクションボタンをテストします

console.log('=== ダッシュボード クイックアクションボタン テスト開始 ===');

// 各ボタンの要素を取得
const buttons = document.querySelectorAll('.card-body .row .col-lg-3 button');

console.log(`見つかったボタン数: ${buttons.length}`);

// 各ボタンの詳細情報を確認
buttons.forEach((button, index) => {
  const buttonText = button.querySelector('.fw-medium')?.textContent;
  const buttonDescription = button.querySelector('.text-muted')?.textContent;
  const iconClass = button.querySelector('i')?.className;
  const onClickHandler = button.onclick;
  
  console.log(`\n=== ボタン ${index + 1}: ${buttonText} ===`);
  console.log(`説明: ${buttonDescription}`);
  console.log(`アイコン: ${iconClass}`);
  console.log(`onClick設定: ${onClickHandler ? '設定済み' : '未設定'}`);
  
  // onClickイベントの詳細を確認
  if (button.onclick) {
    console.log(`onClick関数: ${button.onclick.toString()}`);
  }
});

// 各ボタンのクリックテスト関数
function testButton(buttonIndex, testMode = 'log') {
  const button = buttons[buttonIndex];
  if (!button) {
    console.error(`ボタン ${buttonIndex + 1} が見つかりません`);
    return;
  }
  
  const buttonText = button.querySelector('.fw-medium')?.textContent;
  console.log(`\n=== ボタンテスト: ${buttonText} ===`);
  
  if (testMode === 'log') {
    // ログのみでテスト（実際の遷移はしない）
    console.log('テストモード: ログのみ');
    if (button.onclick) {
      console.log(`遷移先: ${button.onclick.toString().match(/window\.location\.href = '([^']+)'/)?.[1] || '不明'}`);
    }
  } else if (testMode === 'execute') {
    // 実際にボタンをクリック
    console.log('テストモード: 実行');
    button.click();
  }
}

// 全ボタンのログテスト
function testAllButtons() {
  console.log('\n=== 全ボタンテスト（ログモード） ===');
  for (let i = 0; i < buttons.length; i++) {
    testButton(i, 'log');
  }
}

// 個別ボタンテスト関数
window.testNewReservation = () => testButton(0, 'execute');
window.testProductImport = () => testButton(1, 'execute');
window.testReportGeneration = () => testButton(2, 'execute');
window.testSystemSettings = () => testButton(3, 'execute');

// 自動テスト実行
testAllButtons();

console.log('\n=== テスト関数の使用方法 ===');
console.log('個別テスト（実際に遷移）:');
console.log('- testNewReservation() - 新規予約ページへ');
console.log('- testProductImport() - 商品追加ページへ');
console.log('- testReportGeneration() - 予約管理ページへ');
console.log('- testSystemSettings() - システム設定ページへ');

console.log('\n=== ダッシュボード クイックアクションボタン テスト完了 ===');