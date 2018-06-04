const ytdl = require('ytdl-core')
const debug = require('debug')('butter-streamer-youtube')

const EventEmitter = require('events').EventEmitter
const Streamer = require('butter-streamer')
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

class YoutubeFile extends EventEmitter{
  constructor(info, format) {
    super()

    Object.assign(this, info)
    this.name = format.type
    this.fid = format.itag
    this.path = format.type
    this.length = format.clen
    this.ready = false
    this.stream = null

    debug('created', format)
  }

  createReadStream() {
    this.stream = ytdl(this.video_url, {quality: Number(this.fid)})
      .on('info', (info, format) => {
        this.streamReady()
      })

    return this.stream
  }

  streamReady() {
    this.ready = true

    debug('ready', this.format)
    this.emit('ready', this.stream)
  }
}

class YoutubeStreamer extends Streamer {
  constructor (source, options) {
    options.youtube = options.youtube || {}
    super(source, options, config)
  }

  initialize(source, options, config) {
    return new Promise((resolve, reject) => {
      this._video = ytdl(source)

      this._video.on('info', (info, format) => {
        this.name = info.title
        const files = info.formats.map(format => new YoutubeFile(info, format))

        resolve(files)
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
