var watermark = body => {
    try {
        // 修正 room_id 替换问题
        body = body.replace(/\"room_id\":(\d{2,})/g, '"room_id":"$1"');
        let obj = JSON.parse(body);

        // 处理不同的数据结构
        if (obj.data) obj.data = processFollow(obj.data);
        if (obj.aweme_list) obj.aweme_list = processFeed(obj.aweme_list);
        if (obj.aweme_detail) obj.aweme_detail = processShare(obj.aweme_detail);
        if (obj.aweme_details) obj.aweme_details = processFeed(obj.aweme_details);

        $done({ body: JSON.stringify(obj) });

    } catch (err) {
        console.log("Error:\n" + err);
        $done({});
    }
}

watermark($response.body);

// 处理关注列表
function processFollow(data) {
    data.forEach(item => {
        if (item.aweme?.video) processVideo(item.aweme);
    });
    return data;
}

// 处理推荐/Feed 流
function processFeed(aweme_list) {
    return aweme_list.filter(aweme => {
        if (aweme.is_ads) return false;  // 过滤广告
        if (aweme.video) {
            processVideo(aweme);
            return true;
        }
        return typeof enabled_live !== "undefined" && enabled_live;
    });
}

// 处理单个视频分享页
function processShare(aweme_detail) {
    if (aweme_detail.video) processVideo(aweme_detail);
    return aweme_detail;
}

// 处理视频属性，去除水印 & 解锁下载权限
function processVideo(aweme) {
    aweme.prevent_download = false;
    aweme.status.reviewed = 1;

    if (aweme.video_control) {
        aweme.video_control.allow_download = true;
        aweme.video_control.prevent_download_type = 0;
    }

    if (aweme.video) {
        aweme.video.download_addr = aweme.video.play_addr;
        aweme.video.download_suffix_logo_addr = aweme.video.play_addr;
        delete aweme.video.misc_download_addrs;
    }

    if (aweme.aweme_acl?.download_general) {
        let acl = aweme.aweme_acl.download_general;
        acl.mute = false;
        delete acl.extra;
        Object.assign(acl, { code: 0, show_type: 2, transcode: 3 });

        aweme.aweme_acl.download_mask_panel = acl;
        aweme.aweme_acl.share_general = acl;
    }
}
