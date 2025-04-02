const $ = new Env('rednote');

// 主逻辑
(function processResponse() {
  const url = $request.url;
  let rspBody = $response.body;

  if (!rspBody) return $done({});

  let obj = JSON.parse(rspBody);

  // URL 处理映射表
  const handlers = {
    '/search/banner_list': () => (obj.data = {}),
    '/search/hot_list': () => (obj.data.items = []),
    '/search/hint': () => (obj.data.hint_words = []),
    '/search/trending': () => {
      obj.data.queries = [];
      obj.data.hint_word = {};
    },
    '/search/notes': () => {
      if (obj.data?.items?.length > 0) {
        obj.data.items = obj.data.items.filter(item => item.model_type === 'note');
      }
    },
    '/system_service/config': () => {
      const configItems = ['app_theme', 'loading_img', 'splash', 'store'];
      if (obj.data) configItems.forEach(item => delete obj.data[item]);
    },
    '/note/imagefeed|/note/feed': () => handleNoteFeed(obj),
    '/note/live_photo/save': () => handleLivePhotoSave(obj),
    '/note/widgets': () => {
      const widgetItems = ['cooperate_binds', 'generic', 'note_next_step'];
      if (obj?.data) widgetItems.forEach(item => delete obj.data[item]);
    },
    '/v3/note/videofeed': () => handleVideoFeed(obj),
    '/v4/note/videofeed': () => handleV4VideoFeed(obj),
    '/v10/note/video/save': () => handleVideoSave(obj),
    '/v6/homefeed': () => {
      if (obj?.data?.length > 0) {
        obj.data = obj.data.filter(item => 
          item.model_type !== 'live_v2' && 
          !item.hasOwnProperty('ads_info') && 
          !item.hasOwnProperty('card_icon') && 
          !item?.note_attributes?.includes('goods')
        ).map(item => {
          delete item.related_ques;
          return item;
        });
      }
    },
    '/api/sns/v[135]/note/comment/(list|sub_comments)': () => handleComments(obj),
    '/api/sns/v1/interaction/comment/video/download': () => handleCommentVideoDownload(obj),
  };

  // 执行匹配的处理函数
  for (const [pattern, handler] of Object.entries(handlers)) {
    if (new RegExp(pattern).test(url)) {
      handler();
      break;
    }
  }

  $done({ body: JSON.stringify(obj) });
})();

// 处理视频和图片信息流
function handleNoteFeed(obj) {
  if (obj?.data?.length > 0 && obj.data[0]?.note_list?.length > 0) {
    obj.data[0].note_list.forEach(item => {
      unlockMediaSave(item);
      addDownloadEntry(item);
    });
    const imagesList = obj.data[0].note_list[0].images_list;
    obj.data[0].note_list[0].images_list = enhanceImages(imagesList);
    $.setdata(JSON.stringify(imagesList), 'agent.xiaohongshu.feed.rsp');
    console.log('Stored watermark-free info ♻️');
  }
}

// 处理 Live Photo 保存
function handleLivePhotoSave(obj) {
  const cachedRsp = $.getdata('agent.xiaohongshu.feed.rsp');
  if (!cachedRsp) {
    console.log('Cache empty, returning original body');
    return $done({ body: $response.body });
  }
  const cacheBody = JSON.parse(cachedRsp);
  const newData = cacheBody
    .filter(img => img.live_photo_file_id)
    .map(img => ({
      file_id: img.live_photo_file_id,
      video_id: img.live_photo.media.video_id,
      url: img.live_photo.media.stream.h265[0].master_url,
    }));
  if (obj.data.datas) {
    replaceUrlContent(obj.data.datas, newData);
  } else {
    obj = { code: 0, success: true, msg: '成功', data: { datas: newData } };
  }
  console.log('New body: ' + JSON.stringify(obj));
}

// 处理 v3 视频信息流
function handleVideoFeed(obj) {
  if (obj?.data?.length > 0) {
    obj.data.forEach(item => {
      unlockMediaSave(item);
      addDownloadEntry(item);
    });
  }
}

// 处理 v4 视频信息流
function handleV4VideoFeed(obj) {
  let newDatas = [];
  if (obj?.data?.length > 0) {
    obj.data.forEach(item => {
      unlockMediaSave(item);
      addDownloadEntry(item);
      if (item?.id && item?.video_info_v2?.media?.stream?.h265?.[0]?.master_url) {
        newDatas.push({
          id: item.id,
          url: item.video_info_v2.media.stream.h265[0].master_url,
        });
      }
    });
    $.setdata(JSON.stringify(newDatas), 'redBookVideoFeed');
    console.log('Stored video feed data: ' + JSON.stringify(newDatas));
  }
}

// 处理视频保存
function handleVideoSave(obj) {
  const videoFeed = JSON.parse($.getdata('redBookVideoFeed') || '[]');
  if (obj?.data?.note_id && videoFeed.length > 0) {
    const match = videoFeed.find(item => item.id === obj.data.note_id);
    if (match) {
      obj.data.download_url = match.url;
      obj.data.disable = false;
      obj.data.msg = '';
      obj.data.status = 2;
      console.log(`Unlocked download for note ${obj.data.note_id}: ${match.url}`);
    }
  } else if (obj?.data?.disable === true) {
    obj.data.disable = false;
    obj.data.msg = '';
    obj.data.status = 2;
    console.log(`Forced unlock for note ${obj.data.note_id} without cache`);
  }
}

// 处理评论区
function handleComments(obj) {
  replaceRedIdWithAgent(obj.data);
  let livePhotos = [];
  let noteId = '';
  if (obj.data?.comments?.length > 0) {
    noteId = obj.data.comments[0].note_id;
    obj.data.comments.forEach(comment => processComment(comment, livePhotos));
  }
  if (livePhotos.length > 0) {
    updateCommentCache(noteId, livePhotos);
  }
}

// 处理评论视频下载
function handleCommentVideoDownload(obj) {
  const commitsCache = $.getdata('agent.xiaohongshu.comments.rsp');
  if (commitsCache && obj.data?.video) {
    const commitsRsp = JSON.parse(commitsCache);
    const match = commitsRsp.livePhotos.find(item => item.videId === obj.data.video.video_id);
    if (match) {
      obj.data.video.video_url = match.videoUrl;
      console.log('Matched watermark-free URL: ' + match.videoUrl);
    }
  }
}

// 辅助函数
function unlockMediaSave(item) {
  if (item?.media_save_config) {
    item.media_save_config.disable_save = false;
    item.media_save_config.disable_watermark = true;
    item.media_save_config.disable_weibo_cover = true;
  }
}

function addDownloadEntry(item) {
  if (!item.share_info) item.share_info = { function_entries: [] };
  if (!item.share_info.function_entries.some(e => e.type === 'video_download')) {
    item.share_info.function_entries.unshift({ type: 'video_download' });
  }
}

function enhanceImages(imagesList) {
  const imageQuality = $.getdata('agent.xiaohongshu.imageQuality') || 'high';
  let jsonStr = JSON.stringify(imagesList);
  if (imageQuality === 'original') {
    jsonStr = jsonStr.replace(/\?imageView2\/2[^&]*(?:&redImage\/frame\/0)/, '?imageView2/0/format/png&redImage/frame/0');
  } else {
    jsonStr = jsonStr.replace(/imageView2\/2\/w\/\d+\/format/g, 'imageView2/2/w/2160/format')
                     .replace(/imageView2\/2\/h\/\d+\/format/g, 'imageView2/2/h/2160/format');
  }
  console.log('Image quality enhanced ✅');
  return JSON.parse(jsonStr);
}

function replaceUrlContent(collectionA, collectionB) {
  collectionA.forEach(itemA => {
    const match = collectionB.find(itemB => itemB.file_id === itemA.file_id);
    if (match) {
      itemA.url = match.url;
    }
  });
}

function replaceRedIdWithAgent(obj) {
  if (Array.isArray(obj)) return obj.forEach(item => replaceRedIdWithAgent(item));
  if (obj && typeof obj === 'object') {
    if ('red_id' in obj) {
      obj.agent = obj.red_id;
      delete obj.red_id;
    }
    Object.values(obj).forEach(value => replaceRedIdWithAgent(value));
  }
}

function processComment(comment, livePhotos) {
  if (comment.comment_type === 3) comment.comment_type = 2;
  if (comment.media_source_type === 1) comment.media_source_type = 0;
  comment.pictures?.forEach(picture => {
    if (picture.video_id) {
      const picObj = JSON.parse(picture.video_info);
      if (picObj.stream?.h265?.[0]?.master_url) {
        livePhotos.push({
          videId: picture.video_id,
          videoUrl: picObj.stream.h265[0].master_url,
        });
      }
    }
  });
  comment.sub_comments?.forEach(sub => processComment(sub, livePhotos));
}

function updateCommentCache(noteId, livePhotos) {
  const cached = $.getdata('agent.xiaohongshu.comments.rsp');
  let commitsRsp = cached ? JSON.parse(cached) : { noteId: '', livePhotos: [] };
  commitsRsp = commitsRsp.noteId === noteId
    ? { noteId, livePhotos: deduplicateLivePhotos([...commitsRsp.livePhotos, ...livePhotos]) }
    : { noteId, livePhotos };
  $.setdata(JSON.stringify(commitsRsp), 'agent.xiaohongshu.comments.rsp');
}

function deduplicateLivePhotos(livePhotos) {
  return [...new Map(livePhotos.map(item => [item.videId, item])).values()];
}

// Surge 环境类
function Env(name) {
  this.name = name;
  this.getdata = key => $persistentStore.read(key);
  this.setdata = (value, key) => $persistentStore.write(value, key);
  this.log = (...args) => console.log(args.join(' '));
  this.done = (value = {}) => $done(value);
}