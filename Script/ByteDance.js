if ($request.url.endsWith("return")) {
	const body = $persistentStore.read("douyin") ?? "";
$persistentStore.write("","douyin")
	$done({response: { body }})
} else {
const urls = $request.url.split("?")
urls[0] = "https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/";

$request.url = urls.join("?");
$httpClient.get($request,async (err,resp,body) => {
body = JSON.parse(body);
const id = body.item_list[0].video.play_addr.uri;
const video = `https://www.douyin.com/aweme/v1/play/?video_id=${id}&line=0&ratio=1080p`;
$notification.post('链接获取成功','正在下载,请稍等','',{ "auto-dismiss": 10});
$persistentStore.write(video,"douyin");
$done({});
})
}



