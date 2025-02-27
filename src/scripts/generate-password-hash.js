const bcrypt = require('bcryptjs');

async function generateHash() {
  try {
    const password = 'admin'; // デフォルトパスワードを設定
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('\n生成されたハッシュ:');
    console.log(hash);
    
    // 検証テスト
    const isValid = await bcrypt.compare(password, hash);
    console.log('\n検証テスト:');
    console.log(`パスワード: ${password}`);
    console.log(`検証結果: ${isValid ? '成功' : '失敗'}`);
    
    console.log('\n.env.localファイルに以下の行を追加してください:');
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

generateHash(); 