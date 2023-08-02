/*

***************************
更改手机端百度的 User-Agent
QuantumultX:
[rewrite_local]
^https?:\/\/(?!d\.pcs).*(?<!map)\.baidu\.com url script-request-header BaiduChangeUA.js

Surge4：
[Script]
BaiduChangeUA = type=http-request,pattern=^https?:\/\/(?!d\.pcs).*(?<!map)\.baidu\.com,script-path=BaiduChangeUA.js

[MITM]
hostname = %APPEND% *.baidu.com,

**************************/

let url = $request.url;
let headers = $request.headers;
if (url.indexOf("baidu.com") !== -1) {
	if (headers["User-Agent"].indexOf("iPhone") !== -1)
		headers["User-Agent"] =
			"Mozilla/5.0 (SymbianOS/9.4; U; Series60/5.0 SonyEricssonP100/01; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36 T7/12.20.0.0 SP-engine/2.33.0 baiduboxapp/12.20.5.11(Baidu; P1 10) NABar/1.0";
}
$done({ headers });
