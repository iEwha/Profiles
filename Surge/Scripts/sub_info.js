async function main() {
  const args = getArgs();
  const info = await getDataInfo(args.url);
  
  if (!info) {
    $done({
      title: "流量信息获取失败",
      content: "请检查订阅链接或网络连接",
      icon: "exclamationmark.triangle",
      "icon-color": "#ffcc00"
    });
    return;
  }

  const resetDayLeft = getRemainingDays(parseInt(args["reset_day"]));
  const used = info.download + info.upload;
  const total = info.total;
  const expire = args.expire || info.expire;
  const content = [
    `用量：${bytesToSize(used)} / ${bytesToSize(total)}`,
    `剩余：${bytesToSize(total - used)}`
  ];

  if (resetDayLeft !== null) {
    content.push(`重置：${resetDayLeft}天后`);
  }
  if (expire) {
    const expireTime = /^[\d.]+$/.test(expire) ? expire * 1000 : expire;
    content.push(`到期：${formatTime(expireTime)}`);
  }

  $done({
    title: `${args.title} | ${getTimeString()}`,
    content: content.join("\n"),
    icon: args.icon || "chart.bar",
    "icon-color": args.color || "#007aff"
  });
}

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map(item => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
}

async function getDataInfo(url) {
  try {
    const { headers } = await httpGet(url);
    const subInfo = headers["subscription-userinfo"];
    
    return Object.fromEntries(
      subInfo.match(/(\w+)=([\d.eE+]+)/g)
          .map(item => item.split("="))
          .map(([k, v]) => [k.toLowerCase(), Number(v)])
    );
  } catch (error) {
    console.log(`流量信息获取失败: ${error}`);
    return null;
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get({
      url: url,
      headers: { "User-Agent": "Surge" }
    }, (error, response) => {
      error ? reject(error) : resolve(response);
    });
  });
}

function getRemainingDays(resetDay) {
  if (!resetDay || resetDay < 1 || resetDay > 31) return null;
  
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(resetDay);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate < today) targetDate.setMonth(targetDate.getMonth() + 1);
  
  return Math.ceil((targetDate - today) / 86400000);
}

function bytesToSize(bytes) {
  if (isNaN(bytes) || bytes < 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

function getTimeString() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit"
    });
  } catch {
    return "未知时间";
  }
}

main();