'use strict';

const express = require('express');
const timeout = require('connect-timeout');
const AV = require('leanengine');

// 加载云函数定义
require('./cloud');

const app = express();

// 设置默认超时时间
app.use(timeout('15s'));
app.use(AV.express());

app.get('/', function(req, res) {
  res.send('Scholar Radar Backend is running!');
});

// 端口一定要从环境变量 process.env.LEANCLOUD_APP_PORT 中获取
app.listen(process.env.LEANCLOUD_APP_PORT || 3000, function() {
  console.log('Node app is running on port:', process.env.LEANCLOUD_APP_PORT || 3000);
});