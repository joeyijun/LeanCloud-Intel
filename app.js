const AV = require('leanengine');
const express = require('express');
const app = express();

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY
});

app.use(AV.express());

// --- 重点：在这里加载你的代码 ---
// 假设你上传的文件名叫 my_logic.js，这里就写 require('./my_logic.js');
try {
  require('./cloud.js'); 
  console.log('User script loaded.');
} catch (e) {
  console.log('No user script found or script error:', e);
}
// -----------------------------

app.get('/', function(req, res) {
  res.send('LeanCloud App is Active!');
});

const PORT = parseInt(process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000);
app.listen(PORT, function () {
  console.log('App is running on port ' + PORT);
});
