var watermark = body => {
    try {
        body = body.replace(/\"room_id\":(\d{2,})/g, '"room_id":"$1"');
        let obj = JSON.parse(body);
        if (obj.data) obj.data = Follow(obj.data);
        if (obj.aweme_list) obj.aweme_list = Feed(obj.aweme_list);
        if (obj.aweme_detail) obj.aweme_detail = Share(obj.aweme_detail);
        if (obj.aweme_details) obj.aweme_details = Feed(obj.aweme_details);
        $done({ body: JSON.stringify(obj) });
    } catch (err) {
        console.log("Error:\n" + err);
        $done({});
    }
}
watermark($response.body);

function Follow(data) {
    if (data && Array.isArray(data)) {
        for (let item of data) {
            if (item.aweme?.video) video_lists(item.aweme);
        }
    }
    return data;
}

function Feed(aweme_list) {
    if (aweme_list && Array.isArray(aweme_list)) {
        for (let i = aweme_list.length - 1; i >= 0; i--) {
            if (aweme_list[i].is_ads) {
                aweme_list.splice(i, 1);
            } else if (aweme_list[i].video) {
                video_lists(aweme_list[i]);
            }
        }
    }
    return aweme_list;
}

function Share(aweme_detail) {
    if (aweme_detail.video) video_lists(aweme_detail);
    return aweme_detail;
}

function video_lists(lists) {
    lists.prevent_download = false;
    lists.status.reviewed = 1;
    lists.video_control.allow_download = true;
    lists.video_control.prevent_download_type = 0;
    delete lists.video.misc_download_addrs;
    lists.video.download_addr = lists.video.play_addr;
    lists.video.download_suffix_logo_addr = lists.video.play_addr;
    lists.aweme_acl.download_general.mute = false;
    
    if (lists.aweme_acl.download_general.extra) {
        delete lists.aweme_acl.download_general.extra;
        Object.assign(lists.aweme_acl.download_general, {
            code: 0,
            show_type: 2,
            transcode: 3
        });
        lists.aweme_acl.download_mask_panel = lists.aweme_acl.download_general;
        lists.aweme_acl.share_general = lists.aweme_acl.download_general;
    }
    return lists;
}
