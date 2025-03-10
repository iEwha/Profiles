(async () => {
  let args = getArgs();
  let info = await getDataInfo(args.url);
  if (!info) return $done({ title: "流量查询", content: "获取失败", icon: "xmark.circle", "icon-color": "#FF3B30" });

  let used = info.download + info.upload;
  let total = info.total;
  let resetDayLeft = getRemainingDays(parseInt(args["reset_day"]));
  let expire = args.expire || info.expire;
  
  let content = [`已用：${bytesToSize(used)} / ${bytesToSize(total)}`];

  if (resetDayLeft) content.push(`重置：剩余 ${resetDayLeft} 天`);
  if (expire) content.push(`到期：${formatTime(expire)}`);

  let now = new Date();
  let timeStr = now.toTimeString().split(" ")[0].slice(0, 5);

  $done({
    title: `${args.title || "流量监控"} | ${timeStr}`,
    content: content.join("\n"),
    icon: args.icon || "network",
    "icon-color": args.color || "#007AFF",
  });
})();

function getArgs() {
  return Object.fromEntries(
    ($argument || "").split("&").map((item) => item.split("=")).map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let request = { headers: { "User-Agent": "Surge" }, url };
  return new Promise((resolve, reject) => {
    $httpClient.get(request, (err, resp) => {
      if (err) return reject("请求失败");
      if (resp.status !== 200) return reject("状态码错误：" + resp.status);

      let header = Object.keys(resp.headers).find((key) => key.toLowerCase() === "subscription-userinfo");
      header ? resolve(resp.headers[header]) : reject("响应无流量信息");
    });
  });
}

async function getDataInfo(url) {
  try {
    let data = await getUserInfo(url);
    return Object.fromEntries(
      data.match(/\w+=[\d.eE+]+/g).map((item) => item.split("=")).map(([k, v]) => [k, Number(v)])
    );
  } catch (err) {
    console.log(err);
    return null;
  }
}

function getRemainingDays(resetDay) {
  if (!resetDay) return null;
  
  let now = new Date();
  let today = now.getDate();
  let daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return resetDay > today ? resetDay - today : daysInMonth - today + resetDay;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  let sizes = ["B", "KB", "MB", "GB", "TB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  let dateObj = new Date(time * 1000);
  return `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
}
