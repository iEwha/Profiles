const watermark = (body) => {
    try {
        // 替换 room_id 格式
        body = body.replace(/\"room_id\":(\d{2,})/g, '"room_id":"$1"');
        let obj = JSON.parse(body);

        if (obj.data) obj.data = processFollowData(obj.data);
        if (obj.aweme_list) obj.aweme_list = processFeedData(obj.aweme_list);
        if (obj.aweme_detail) obj.aweme_detail = processShareData(obj.aweme_detail);
        if (obj.aweme_details) obj.aweme_details = processFeedData(obj.aweme_details);

        $done({ body: JSON.stringify(obj) });
    } catch (err) {
        console.error("Error occurred:\n", err);
        $done({});
    }
};

function processFollowData(data) {
    if (!Array.isArray(data)) return data;

    data.forEach((item) => {
        if (item.aweme?.video) {
            processVideoData(item.aweme);
        }
    });

    return data;
}

function processFeedData(awemeList) {
    if (!Array.isArray(awemeList)) return awemeList;

    return awemeList.filter((item) => {
        if (item.is_ads) {
            // 移除广告内容
            return false;
        } else if (item.video) {
            // 处理视频内容
            processVideoData(item);
            return true;
        } else {
            // 移除非视频内容（如直播）
            return !!enabled_live;
        }
    });
}

function processShareData(awemeDetail) {
    if (awemeDetail?.video) {
        processVideoData(awemeDetail);
    }
    return awemeDetail;
}

function processVideoData(videoItem) {
    if (!videoItem.video || !videoItem.video_control) return;

    videoItem.prevent_download = false;
    videoItem.video_control.allow_download = true;
    videoItem.video_control.prevent_download_type = 0;

    // 替换下载地址为播放地址
    videoItem.video.download_addr = videoItem.video.play_addr;
    videoItem.video.download_suffix_logo_addr = videoItem.video.play_addr;

    // 清理无用属性
    delete videoItem.video.misc_download_addrs;

    if (videoItem.aweme_acl?.download_general) {
        const downloadGeneral = videoItem.aweme_acl.download_general;

        downloadGeneral.mute = false;
        delete downloadGeneral.extra;

        downloadGeneral.code = 0;
        downloadGeneral.show_type = 2;
        downloadGeneral.transcode = 3;

        videoItem.aweme_acl.download_mask_panel = downloadGeneral;
        videoItem.aweme_acl.share_general = downloadGeneral;
    }
    return videoItem;
}

// 启动主函数
watermark($response.body);
