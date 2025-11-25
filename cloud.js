const AV = require('leanengine');
const crypto = require('crypto');

// ===========================================
// 🔴 虎皮椒配置 (请去 https://www.xunhupay.com/ 获取)
// ===========================================
const XP_APPID = '201906175359';     // 例如 '12345'
const XP_SECRET = '49491b29148a1552f85714f024306dfb'; // 例如 'xxxxx'
// 您的前端网址 (支付成功后跳回这里)
const DOMAIN = 'https://mypaper.top'; 
// 您的云引擎域名 (后面会教您怎么看) + 回调路径
const NOTIFY_URL = 'https://scholar.avosapps.us/1.1/functions/hupiPayNotify'; 
// ===========================================

/**
 * 创建虎皮椒支付订单
 */
AV.Cloud.define('createHupiPayOrder', async (request) => {
  const user = request.currentUser;
  if (!user) throw new AV.Cloud.Error('请先登录', 401);

  const tradeOrderId = `${Date.now()}${Math.floor(Math.random()*1000)}`;
  const price = '29.90'; // 季度会员价格
  const title = 'Scholar Radar Pro Member';

  // 1. 构造参数
  const params = {
    version: '1.1',
    appid: XP_APPID,
    trade_order_id: tradeOrderId,
    total_fee: price,
    title: title,
    time: Math.floor(Date.now() / 1000),
    notify_url: NOTIFY_URL,
    return_url: `${DOMAIN}/?pay_success=true`, 
    nonce_str: Math.random().toString(36).substring(2, 15),
    plugins: JSON.stringify({ userId: user.id }) 
  };

  // 2. 签名
  const keys = Object.keys(params).sort();
  let str = '';
  for (const k of keys) {
     if (k === 'hash') continue;
     str += `${k}=${params[k]}&`;
  }
  str += `apikey=${XP_SECRET}`;
  
  const hash = crypto.createHash('md5').update(str).digest('hex');
  params.hash = hash;

  // 3. 构造跳转链接
  const gateway = 'https://api.xunhupay.com/payment/do.html';
  const queryParams = new URLSearchParams(params).toString();
  return { payUrl: `${gateway}?${queryParams}` };
});

/**
 * 支付回调
 */
AV.Cloud.define('hupiPayNotify', async (request) => {
  const data = request.params;
  
  // 简单验证状态
  if (data.status === 'OD') { 
      try {
          // 注意：request.params 中的 plugins 可能是字符串也可能是对象，取决于 Content-Type
          let plugins = data.plugins;
          if (typeof plugins === 'string') {
            try { plugins = JSON.parse(plugins); } catch(e) {}
          }
          
          const userId = plugins && plugins.userId;
          
          if (userId) {
              const query = new AV.Query('_User');
              const user = await query.get(userId);
              
              if (user) {
                  user.set('plan', 'pro');
                  const now = new Date();
                  const newExpire = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
                  user.set('proExpiresAt', newExpire);
                  await user.save(null, { useMasterKey: true });
                  console.log(`User ${userId} upgraded to Pro`);
              }
          }
      } catch (e) {
          console.error('Notify Error', e);
      }
  }
  return 'success';
});