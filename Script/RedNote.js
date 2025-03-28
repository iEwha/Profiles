const $ = new Env('小红书');

const url = $request.url;
let rsp_body = $response.body;

if (!rsp_body) {
  $done({});
}

let obj;
try {
  obj = JSON.parse(rsp_body);
} catch (e) {
  console.log(`Failed to parse response body: ${e.message}`);
  $done({});
}

// Process based on URL
if (url.includes("/search/banner_list")) {
  obj.data = {};
} else if (url.includes("/search/hot_list")) {
  obj.data.items = [];
} else if (url.includes("/search/hint")) {
  obj.data.hint_words = [];
} else if (url.includes("/search/trending")) {
  obj.data.queries = [];
  obj.data.hint_word = {};
} else if (url.includes("/search/notes")) {
  if (obj.data?.items?.length > 0) {
    obj.data.items = obj.data.items.filter(i => i.model_type === "note");
  }
} else if (url.includes("/system_service/config")) {
  const items = ["app_theme", "loading_img", "splash", "store"];
  if (obj.data) {
    items.forEach(i => delete obj.data[i]);
  }
} else if (url.includes("/note/imagefeed") || url.includes("/note/feed")) {
  processMediaFeed(obj);
} else if (url.includes("/note/live_photo/save")) {
  processLivePhotoSave(obj);
} else if (url.includes("/note/widgets")) {
  const items = ["cooperate_binds", "generic", "note_next_step"];
  if (obj?.data) {
    items.forEach(i => delete obj.data[i]);
  }
} else if (url.includes("/v3/note/videofeed")) {
  processVideoFeed(obj);
} else if (url.includes("/v4/note/videofeed")) {
  processVideoFeedV4(obj);
} else if (url.includes("/v10/note/video/save")) {
  processVideoSave(obj);
} else if (url.includes("/user/followings/followfeed") || url.includes("/v4/followfeed")) {
  if (obj?.data?.items?.length > 0) {
    obj.data.items = obj.data.items.filter(i => i?.recommend_reason !== "recommend_user" && i?.recommend_reason === "friend_post");
  }
} else if (url.includes("/recommend/user/follow_recommend")) {
  if (obj?.data?.title === "你可能感兴趣的人" && obj?.data?.rec_users?.length > 0) {
    obj.data = {};
  }
} else if (url.includes("/v6/homefeed")) {
  processHomeFeed(obj);
} else if (url.includes("/api/sns/v5/note/comment/list") || url.includes("/api/sns/v3/note/comment/sub_comments")) {
  processComments(obj);
} else if (url.includes("/api/sns/v1/interaction/comment/video/download")) {
  processCommentVideoDownload(obj);
}

$done({ body: JSON.stringify(obj) });

// Media Feed Processing
function processMediaFeed(obj) {
  if (obj?.data?.length > 0 && obj.data[0]?.note_list?.length > 0) {
    const noteList = obj.data[0].note_list;
    noteList.forEach(item => {
      if (item?.media_save_config) {
        item.media_save_config.disable_save = false;
        item.media_save_config.disable_watermark = true;
        item.media_save_config.disable_weibo_cover = true;
      }
      if (item?.share_info?.function_entries?.length > 0) {
        const addItem = { type: "video_download" };
        if (item.share_info.function_entries[0]?.type !== "video_download") {
          item.share_info.function_entries.unshift(addItem);
        }
      }
    });
    const imagesList = noteList[0].images_list;
    obj.data[0].note_list[0].images_list = imageEnhance(imagesList);
    $.setdata(JSON.stringify(imagesList), "xhs_custom.feed.rsp");
  }
}

// Live Photo Save
function processLivePhotoSave(obj) {
  const cached = $.getdata("xhs_custom.feed.rsp");
  if (!cached) {
    $done({ body: rsp_body });
    return;
  }
  const cacheBody = JSON.parse(cached);
  let newData = cacheBody
    .filter(img => img.live_photo_file_id)
    .map(img => ({
      file_id: img.live_photo_file_id,
      video_id: img.live_photo.media.video_id,
      url: img.live_photo.media.stream.h265[0].master_url
    }));
  if (obj.data?.datas) {
    replaceUrlContent(obj.data.datas, newData);
  } else {
    obj = { code: 0, success: true, msg: "成功", data: { datas: newData } };
  }
}

// Video Feed Processing (v3)
function processVideoFeed(obj) {
  if (obj?.data?.length > 0) {
    obj.data.forEach(item => {
      if (item?.media_save_config) {
        item.media_save_config.disable_save = false;
        item.media_save_config.disable_watermark = true;
        item.media_save_config.disable_weibo_cover = true;
      }
      if (item?.share_info?.function_entries?.length > 0) {
        const addItem = { type: "video_download" };
        if (item.share_info.function_entries[0]?.type !== "video_download") {
          item.share_info.function_entries.unshift(addItem);
        }
      }
    });
  }
}

// Video Feed Processing (v4)
function processVideoFeedV4(obj) {
  if (obj?.data?.length > 0) {
    let newDatas = [];
    obj.data.forEach(item => {
      if (!item.share_info.function_entries.some(e => e.type === "video_download")) {
        item.share_info.function_entries.push({ type: "video_download" });
      }
      if (item?.id && item?.video_info_v2?.media?.stream?.h265?.[0]?.master_url) {
        newDatas.push({
          id: item.id,
          url: item.video_info_v2.media.stream.h265[0].master_url
        });
      }
    });
    $.setdata(JSON.stringify(newDatas), "redBookVideoFeed");
  }
}

// Video Save
function processVideoSave(obj) {
  const videoFeed = JSON.parse($.getdata("redBookVideoFeed") || "[]");
  const videoFeedUnlock = JSON.parse($.getdata("redBookVideoFeedUnlock") || "[]");
  if (obj?.data?.note_id) {
    const match = videoFeed.find(item => item.id === obj.data.note_id);
    if (match) obj.data.download_url = match.url;
    const unlockMatch = videoFeedUnlock.find(item => item.id === obj.data.note_id);
    if (obj?.data?.disable && unlockMatch) {
      delete obj.data.disable;
      delete obj.data.msg;
      obj.data.download_url = unlockMatch.url;
      obj.data.status = 2;
    }
  }
  $.setdata(JSON.stringify({ notSave: "user" }), "redBookVideoFeedUnlock");
}

// Home Feed Cleanup
function processHomeFeed(obj) {
  if (obj?.data?.length > 0) {
    obj.data = obj.data.filter(item =>
      item.model_type !== "live_v2" &&
      !item.hasOwnProperty("ads_info") &&
      !item.hasOwnProperty("card_icon") &&
      !item.note_attributes?.includes("goods")
    ).map(item => {
      delete item.related_ques;
      return item;
    });
  }
}

// Comment Processing
function processComments(obj) {
  replaceRedIdWithUser(obj.data);
  let livePhotos = [];
  let noteId = obj.data?.comments?.[0]?.note_id || "";
  if (obj.data?.comments?.length > 0) {
    obj.data.comments.forEach(comment => {
      if (comment.comment_type === 3) comment.comment_type = 2;
      if (comment.media_source_type === 1) comment.media_source_type = 0;
      extractLivePhotos(comment, livePhotos);
      comment.sub_comments?.forEach(sub => {
        if (sub.comment_type === 3) sub.comment_type = 2;
        if (sub.media_source_type === 1) sub.media_source_type = 0;
        extractLivePhotos(sub, livePhotos);
      });
    });
    updateLivePhotoCache(noteId, livePhotos);
  }
}

// Comment Video Download
function processCommentVideoDownload(obj) {
  const cached = $.getdata("xhs_custom.comments.rsp");
  if (cached && obj.data?.video?.video_id) {
    const commitsRsp = JSON.parse(cached);
    const match = commitsRsp.livePhotos.find(item => item.videId === obj.data.video.video_id);
    if (match) obj.data.video.video_url = match.videoUrl;
  }
}

// Helper Functions
function imageEnhance(imagesList) {
  const quality = $.getdata("xhs_custom.imageQuality") || "high";
  let jsonStr = JSON.stringify(imagesList);
  if (quality === "original") {
    jsonStr = jsonStr.replace(/\?imageView2\/2[^&]*(?:&redImage\/frame\/0)/, "?imageView2/0/format/png&redImage/frame/0");
  } else {
    jsonStr = jsonStr.replace(/imageView2\/2\/[wh]\/\d+\/format/g, `imageView2/2/${quality === "high" ? "w" : "h"}/2160/format`);
  }
  return JSON.parse(jsonStr);
}

function replaceUrlContent(collectionA, collectionB) {
  collectionA.forEach(a => {
    const b = collectionB.find(b => b.file_id === a.file_id);
    if (b) a.url = b.url;
  });
}

function extractLivePhotos(comment, livePhotos) {
  comment.pictures?.forEach(pic => {
    if (pic.video_id) {
      const videoInfo = JSON.parse(pic.video_info);
      if (videoInfo.stream?.h265?.[0]?.master_url) {
        livePhotos.push({
          videId: pic.video_id,
          videoUrl: videoInfo.stream.h265[0].master_url
        });
      }
    }
  });
}

function updateLivePhotoCache(noteId, livePhotos) {
  if (livePhotos.length === 0) return;
  const cached = $.getdata("xhs_custom.comments.rsp");
  let commitsRsp = cached ? JSON.parse(cached) : { noteId, livePhotos: [] };
  if (commitsRsp.noteId === noteId) {
    commitsRsp.livePhotos = deduplicateLivePhotos(commitsRsp.livePhotos.concat(livePhotos));
  } else {
    commitsRsp = { noteId, livePhotos };
  }
  $.setdata(JSON.stringify(commitsRsp), "xhs_custom.comments.rsp");
}

function deduplicateLivePhotos(livePhotos) {
  const seen = new Set();
  return livePhotos.filter(item => !seen.has(item.videId) && seen.add(item.videId));
}

function replaceRedIdWithUser(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(replaceRedIdWithUser);
  } else if (obj && typeof obj === "object") {
    if ("red_id" in obj) {
      obj.user = obj.red_id;
      delete obj.red_id;
    }
    Object.values(obj).forEach(replaceRedIdWithUser);
  }
}

// Simplified Env for Surge
function Env(name) {
  this.name = name;
  this.log = console.log;
  this.getdata = key => $persistentStore.read(key);
  this.setdata = (val, key) => $persistentStore.write(val, key);
}