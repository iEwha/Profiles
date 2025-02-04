const watermark = (body) => {
    try {
        const ENABLE_LIVE = false; // 控制是否保留直播内容

        // 转换 room_id 为字符串
        body = body.replace(/"room_id"\s*:\s*(\d+)/g, '"room_id":"$1"');
        const dataObj = JSON.parse(body);

        // 统一处理不同类型的数据
        const processors = {
            data: processList,
            aweme_list: processFeed,
            aweme_detail: processVideo,
            aweme_details: processFeed
        };

        Object.keys(processors).forEach(key => {
            if (dataObj[key]) dataObj[key] = processors[key](dataObj[key], ENABLE_LIVE);
        });

        $done({ body: JSON.stringify(dataObj) });
    } catch (err) {
        console.error(`Watermark Error: ${err.message}`);
        $done({});
    }
};

// 处理列表数据（关注/直播）
const processList = (list) => list.map(item => {
    item.aweme?.video && processVideo(item.aweme);
    return item;
});

// 处理视频流（主页/推荐）
const processFeed = (awemeList, keepLive) => 
    awemeList.filter(item => !item.is_ads && (item.video ? (processVideo(item), true) : keepLive));

// 处理单个视频（详情/分享）
const processVideo = (aweme) => {
    if (!aweme?.video) return aweme;

    const { video, video_control, aweme_acl } = aweme;

    // 解除下载限制 & 替换下载地址
    Object.assign(video_control, { allow_download: true, prevent_download_type: 0 });
    Object.assign(video, { download_addr: video.play_addr, download_suffix_logo_addr: video.play_addr });
    delete video.misc_download_addrs;

    // 修改下载权限
    if (aweme_acl?.download_general) {
        Object.assign(aweme_acl.download_general, {
            mute: false,
            code: 0,
            show_type: 2,
            transcode: 3
        });
        delete aweme_acl.download_general.extra;

        // 统一 ACL 配置
        aweme_acl.download_mask_panel = aweme_acl.share_general = aweme_acl.download_general;
    }

    return aweme;
};

// 启动处理流程
watermark($response.body);
