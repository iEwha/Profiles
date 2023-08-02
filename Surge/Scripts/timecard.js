var tlist = {
  1: ["情人节", "2023-02-14"],
  2: ["清明", "2023-04-05"],
  3: ["劳动", "2023-05-01"],
  4: ["端午", "2023-06-22"],
  5: ["七夕", "2023-08-22"],
  6: ["中秋", "2023-09-29"],
  7: ["国庆", "2023-10-01"],
  8: ["圣诞节", "2023-12-25"],
  9: ["元旦", "2024-01-01"],
  10: ["腊八", "2024-01-18"],
  11: ["小年", "2024-02-02"],
  12: ["除夕", "2024-02-09"],
  13: ["春节", "2024-02-10"],
  14: ["情人节", "2024-02-14"],
  15: ["元宵节", "2024-02-24"],
  
};
let tnow = new Date();
let tnowf =
  tnow.getFullYear() + "-" + (tnow.getMonth() + 1) + "-" + tnow.getDate();

/* 计算2个日期相差的天数，不包含今天，如：2016-12-13到2016-12-15，相差2天
 * @param startDateString
 * @param endDateString
 * @returns
 */
function dateDiff(startDateString, endDateString) {
  var separator = "-"; //日期分隔符
  var startDates = startDateString.split(separator);
  var endDates = endDateString.split(separator);
  var startDate = new Date(startDates[0], startDates[1] - 1, startDates[2]);
  var endDate = new Date(endDates[0], endDates[1] - 1, endDates[2]);
  return parseInt(
    (endDate - startDate) / 1000 / 60 / 60 / 24
  ).toString();
}

//计算输入序号对应的时间与现在的天数间隔
function tnumcount(num) {
  let dnum = num;
  return dateDiff(tnowf, tlist[dnum][1]);
}

//获取最接近的日期
function now() {
  for (var i = 1; i <= Object.getOwnPropertyNames(tlist).length; i++) {
    if (Number(dateDiff(tnowf, tlist[i.toString()][1])) >= 0) {
      //console.log("最近的日期是:" + tlist[i.toString()][0]);
      //console.log("列表长度:" + Object.getOwnPropertyNames(tlist).length);
      //console.log("时间差距:" + Number(dateDiff(tnowf, tlist[i.toString()][1])));
      return i;
    }
  }
}

//如果是0天，发送emoji;
let nowlist = now();
function today(day) {
  let daythis = day;
  if (daythis == "0") {
    datenotice();
    return "🎉";
  } else {
    return daythis+"天";
  }
}

//提醒日当天发送通知
function datenotice() {
  if ($persistentStore.read("timecardpushed") != tlist[nowlist][1] && tnow.getHours() >= 6) {
    $persistentStore.write(tlist[nowlist][1], "timecardpushed");
    $notification.post("假日祝福","", "今天是" + tlist[nowlist][1] + "日 " + tlist[nowlist][0] + "   🎉")
  } else if ($persistentStore.read("timecardpushed") == tlist[nowlist][1]) {
    //console.log("当日已通知");
  }
}

//>图标依次切换乌龟、兔子、闹钟、礼品盒
function icon_now(num){
  if(num<=7 && num>3 ){
    return "hare"
  }else if(num<=3 && num>0){
    return "timer"
  }else if(num==0){
    return "gift"
  }else{
    return "tortoise"
  }
}

$done({
title:title_random(tnumcount(Number(nowlist))),
icon:icon_now(tnumcount(Number(nowlist))),
content:tlist[nowlist][0]+":"+today(tnumcount(nowlist))+","+tlist[Number(nowlist) + Number(1)][0] +":"+ tnumcount(Number(nowlist) + Number(1))+ "天,"+tlist[Number(nowlist) + Number(2)][0]+":"+tnumcount(Number(nowlist) + Number(2))+"天"
})

function title_random(num){
  let r = Math.floor((Math.random()*10)+1);
  let dic = {
    1:"距离放假，还要摸鱼多少天？",
    2:"坚持住，就快放假啦！",
    3:"上班好累呀，下顿吃啥？",
    4:"努力，我还能加班24小时！",
    5:"今日宜：吃饭饭  忌：减肥",
    6:"躺平中，等放假",
    7:"只有摸鱼才是赚老板的钱",
    8:"一起摸鱼吧",
    9:"摸鱼中，期待下一个假日",
    10: "小乌龟慢慢爬"
  };
  return num==0?"节日快乐，万事大吉":dic[r]
}
