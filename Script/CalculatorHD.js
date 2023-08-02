/*
 *
 *
脚本功能：计算器HD解锁会员
软件版本：1.9.4
脚本作者：Hausd0rff

*******************************

[rewrite_local]

# 计算器HD解锁会员
^https?:\/\/www\.40sishi\.com\/(list|currency|calculator)\/user\/profile$ url script-response-body CalculatorHD.js

[mitm] 

hostname = www.40sishi.com
*
*
*/


var objc = JSON.parse($response.body);

objc.data["vipState"] = {
    "state" : 1,
    "forever" : true,
    "startTime" : 1569600000000,
    "expireTime" : 32495476149000
};

$done({body : JSON.stringify(objc)});