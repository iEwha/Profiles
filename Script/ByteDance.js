if ($request.url.endsWith("return")) {
    const body = $persistentStore.read("douyin") || "";
    $persistentStore.write("", "douyin");
    $done({ response: { body } });
} else {
    const urls = $request.url.split("?");
    urls[0] = "https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/";
    $request.url = urls.join("?");

    $httpClient.get($request, (err, resp, body) => {
        if (err || resp.status !== 200) {
            $notification.post('获取视频链接失败', '请检查网络或重试', '');
            return $done();
        }
        
        try {
            const data = JSON.parse(body);
            const videoInfo = data?.item_list?.[0]?.video?.play_addr;
            if (!videoInfo) {
                throw new Error("视频信息解析失败");
            }
            const id = videoInfo.uri;
            const videoUrl = `https://www.douyin.com/aweme/v1/play/?video_id=${id}&line=0&ratio=1080p`;
            
            $persistentStore.write(videoUrl, "douyin");
            $notification.post('链接获取成功', '正在下载，请稍候…', '', { "auto-dismiss": 10 });
            $done({});
        } catch (e) {
            $notification.post('解析视频信息失败', '请确保链接有效', '');
            $done();
        }
    });
}
