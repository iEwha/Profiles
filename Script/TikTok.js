const watermark = (body) => {
    try {
        if (typeof body === "string") {
            body = body.replace(/\"room_id\":(\d{2,})/g, '"room_id":"$1"');
            body = JSON.parse(body);
        }

        if (body.data) body.data = processFollowData(body.data);
        if (body.aweme_list) body.aweme_list = processFeedData(body.aweme_list);
        if (body.aweme_detail) body.aweme_detail = processShareData(body.aweme_detail);
        if (body.aweme_details) body.aweme_details = processFeedData(body.aweme_details);

        $done({ body: JSON.stringify(body) });
    } catch (err) {
        console.error("Error occurred:\n", err);
        $done({ body: JSON.stringify(body) });
    }
};

function processFollowData(data) {
    if (!Array.isArray(data)) return data;

    data.forEach((item) => {
        if (item.aweme?.video) processVideoData(item.aweme);
    });

    return data;
}

function processFeedData(awemeList) {
    if (!Array.isArray(awemeList)) return awemeList;
    const enabled_live = false;

    return awemeList.filter((item) => {
        if (item.is_ads) return false;
        if (item.video) {
            processVideoData(item);
            return true;
        }
        return enabled_live;
    });
}

function processShareData(awemeDetail) {
    if (awemeDetail?.video) processVideoData(awemeDetail);
    return awemeDetail;
}

function processVideoData(videoItem) {
    if (!videoItem.video || !videoItem.video_control) return;

    videoItem.prevent_download = false;
    videoItem.video_control.allow_download = true;
    videoItem.video_control.prevent_download_type = 0;

    videoItem.video.download_addr = videoItem.video.play_addr;
    videoItem.video.download_suffix_logo_addr = videoItem.video.play_addr;

    delete videoItem.video.misc_download_addrs;

    if (videoItem.aweme_acl?.download_general) {
        Object.assign(videoItem.aweme_acl.download_general, {
            mute: false,
            code: 0,
            show_type: 2,
            transcode: 3,
        });

        videoItem.aweme_acl.download_mask_panel = videoItem.aweme_acl.download_general;
        videoItem.aweme_acl.share_general = videoItem.aweme_acl.download_general;
    }
}

watermark($response.body);
