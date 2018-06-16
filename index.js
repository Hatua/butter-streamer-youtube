const EventEmitter = require('events').EventEmitter

const ytdl = require('ytdl-core')
const request = require('request')

const ProgressStreamer = require('butter-streamer/progress/streamer')
const HttpFile = require('butter-streamer-http/file')

const debug = require('debug')('butter-streamer-youtube')

const config = {
  name: 'YouTube Streamer',
  domain: /(youtu.be|youtube.com)/,
  protocol: /(youtube|yt)/,
  type: 'youtube',
  priority: 10
}

const processFileInfo = (info, format) => ({
  length: processLength(info, format),
  type: format.type,
  name: 'youtube-video.' + format.container
})

const processLength = (info, format) => {
  const bitrate = format.bitrate.split('-').pop()*150000 + format.audioBitrate*150
  return info.length_seconds * bitrate
}

class YoutubeFile extends HttpFile {
  constructor(length, format) {
    const httpInfo = {
      length,
      type: format.type,
      name: format.type
    }

    super(format.url, httpInfo)
  }
}

const fileForFormat = (format) => (
  new Promise((resolve, reject) => {
    request.head(format.url)
           .on('response', res => (
             resolve(new YoutubeFile(Number(res.headers['content-length']), format))
           ))
  })
)

class YoutubeStreamer extends ProgressStreamer {
  constructor (source, options) {
    options.youtube = options.youtube || {}
    super(source, options, config)
  }

  initialize(source, options, config) {
    return new Promise((resolve, reject) => {
      ytdl(source)
        .on('info', (info, format) => {
          this.name = info.title
          Promise.all(info.formats.map(fileForFormat))
                          .then(resolve)
        })
    })
  }

  destroy () {
    super.destroy()
    this._video = null
  }
}

YoutubeStreamer.config = config

module.exports = YoutubeStreamer
