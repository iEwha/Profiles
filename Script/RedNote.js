// 提取：写入持久化存储的通用函数
function writeToPersistentStore(key, data) {
  $persistentStore.write(JSON.stringify(data), key);
}

// 提取：读取持久化存储的通用函数
function readFromPersistentStore(key) {
  return JSON.parse($persistentStore.read(key) || '[]');
}

// 提取：修改视频相关配置
function processVideoItem(item) {
  if (item?.media_save_config) {
    item.media_save_config.disable_save = false;
    item.media_save_config.disable_watermark = true;
    item.media_save_config.disable_weibo_cover = true;
  }
  if (item?.share_info?.function_entries?.length > 0) {
    const additem = { type: "video_download" };
    let videoDownloadIndex = item.share_info.function_entries.findIndex(i => i?.type === "video_download");
    if (videoDownloadIndex !== -1) {
      let videoDownloadEntry = item.share_info.function_entries.splice(videoDownloadIndex, 1)[0];
      item.share_info.function_entries.unshift(videoDownloadEntry);
    } else {
      item.share_info.function_entries.unshift(additem);
    }
  }
}

// 主逻辑：处理接口请求
const url = $request.url;
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

if (url.includes("/v1/note/imagefeed") || url.includes("/v2/note/feed")) {
  // 图片流处理
  let newDatas = [];
  if (obj?.data?.[0]?.note_list?.length > 0) {
    for (let item of obj.data[0].note_list) {
      processVideoItem(item); // 处理视频配置
      if (item?.images_list?.length > 0) {
        for (let i of item.images_list) {
          if (i?.live_photo_file_id && i?.live_photo?.media?.video_id && i?.live_photo?.media?.stream?.h265?.[0]?.master_url) {
            newDatas.push({
              file_id: i.live_photo_file_id,
              video_id: i.live_photo.media.video_id,
              url: i.live_photo.media.stream.h265[0].master_url
            });
          }
        }
      }
    }
  }
  writeToPersistentStore("redBookLivePhoto", newDatas); // 写入持久化存储
} else if (url.includes("/v1/note/live_photo/save")) {
  // 实况照片保存请求
  let livePhoto = readFromPersistentStore("redBookLivePhoto");
  if (obj?.data?.datas?.length > 0) {
    obj.data.datas.forEach((itemA) => {
      let matchedItem = livePhoto.find(itemB => itemB?.file_id === itemA?.file_id && itemA?.url);
      if (matchedItem) {
        itemA.url = matchedItem.url;
      }
    });
  } else {
    obj = { code: 0, success: true, msg: "成功", data: { datas: livePhoto } };
  }
} else if (url.includes("/v4/note/videofeed")) {
  // 视频流处理
  let newDatas = [];
  if (obj?.data?.length > 0) {
    for (let item of obj.data) {
      try {
        if (item?.id && item?.video_info_v2?.media?.stream?.h265?.length > 0 && item.video_info_v2.media.stream.h265[0]?.master_url) {
          newDatas.push({
            id: item.id,
            url: item.video_info_v2.media.stream.h265[0].master_url
          });
        }
        processVideoItem(item); // 处理视频配置
      } catch (error) {
        console.log(`Error processing video item: ${JSON.stringify(item)}, Error: ${error.message}`);
      }
    }
    writeToPersistentStore("redBookVideoFeed", newDatas); // 写入持久化存储
  }
} else if (url.includes("/v10/note/video/save")) {
  // 视频保存请求
  let videoFeed = readFromPersistentStore("redBookVideoFeed");
  if (obj?.data?.note_id && videoFeed?.length > 0) {
    let matchedItem = videoFeed.find(item => item.id === obj.data.note_id);
    if (matchedItem) {
      obj.data.download_url = matchedItem.url;
    }
  }
} else if (url.includes("/v1/system_service/config")) {
  // 配置处理
  const itemsToRemove = ["app_theme", "loading_img", "splash", "store"];
  if (obj?.data) {
    for (let key of itemsToRemove) {
      delete obj.data[key];
    }
  }
} else {
  $done({});
}
$done({ body: JSON.stringify(obj) });
