/*

***************************
QuantumultX:

[rewrite_local]
^https:\/\/commerce-.*api\.faceu\.mobi\/commerce\/v1\/subscription\/user_info url script-response-body ulike.js
[mitm]
hostname = commerce-api.faceu.mobi

***************************
Surge4 or Loon: 

[Script]
http-response ^https:\/\/commerce-.*api\.faceu\.mobi\/commerce\/v1\/subscription\/user_info requires-body=1,max-size=0,script-path=ulike.js
[MITM]
hostname = commerce-api.faceu.mobi

**************************/
var obj = JSON.parse($response.body);

obj= {
  "data": {
    "flag": true,
    "start_time": 1572760027,
    "end_time": 4097368706
  },
  "systime": "",
  "errmsg": "Success",
  "ret": "0"
};

$done({body: JSON.stringify(obj)});
