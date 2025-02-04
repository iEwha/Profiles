const watermark = (body) => {
    try {
        body = body.replace(/\"room_id\":(\d{2,})/g, '"room_id":"$1"');
        let obj = JSON.parse(body);

        if (obj.data) obj.data = obj.data.map(processItem);
        if (obj.aweme_list) obj.aweme_list = processFeedData(obj.aweme_list);
        if (obj.aweme_detail) obj.aweme_detail = processItem(obj.aweme_detail);
        if (obj.aweme_details) obj.aweme_details = processFeedData(obj.aweme_details);

        $done({ body: JSON.stringify(obj) });
    } catch (err) {
        console.error("Error:", err);
        $done({});
    }
};

function processFeedData(awemeList) {
    return Array.isArray(awemeList) ? awemeList.filter(processItem) : awemeList;
}

function processItem(item) {
    if (!item) return false;
    if (item.is_ads) return false; // 过滤广告
    if (item.video) return processVideoData(item);
    return !!enabled_live; // 允许直播（如果启用）
}

function processVideoData(videoItem) {
    if (!videoItem?.video?.video_control) return videoItem;

    Object.assign(videoItem, {
        prevent_download: false,
        video: {
            ...videoItem.video,
            download_addr: videoItem.video.play_addr,
            download_suffix_logo_addr: videoItem.video.play_addr
        }
    });

    delete videoItem.video.misc_download_addrs;

    if (videoItem.aweme_acl?.download_general) {
        const downloadGeneral = {
            ...videoItem.aweme_acl.download_general,
            mute: false,
            code: 0,
            show_type: 2,
            transcode: 3
        };
        delete downloadGeneral.extra;

        Object.assign(videoItem.aweme_acl, {
            download_general: downloadGeneral,
            download_mask_panel: downloadGeneral,
            share_general: downloadGeneral
        });
    }
    return videoItem;
}

// 启动主函数
watermark($response.body);
