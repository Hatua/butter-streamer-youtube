const ytdl = require('ytdl-core')
const debug = require('debug')('butter-streamer-youtube')

const Streamer = require('butter-streamer')
const config = {
  name: 'YouTube Streamer',
  domain: /(youtu.be|youtube.com)/,
  protocol: /(youtube|yt)/,
  type: 'youtube',
  priority: 10
}

const processVideoInfo = (info, format) => ({
  length: processLength(info, format),
  type: format.type,
  name: 'youtube-video.' + format.container
})

const processLength = (info, format) => {
  const bitrate = format.bitrate.split('-').pop()*150000 + format.audioBitrate*150
  return info.length_seconds * bitrate
}

class YoutubeStreamer extends Streamer {
  constructor (source, options = {}) {
    super(options)
    options.youtube = options.youtube || {}

    this.config = config

    this._options = options
    this._source = source
    this.file = {}
    this._video = ytdl(source, {quality: options.youtube.audio ? 140 : (options.youtube.hd ? 22 : 18)})
    this._video.on('info', (info, format) =>
      this.ready(this._video, processVideoInfo(info, format)))
  }

  seek (start = 0, end) {
    if (this._destroyed) throw new ReferenceError('Streamer already destroyed')
    debug('seek', start, end)

    this._video = ytdl(this._source, {quality: this._options.youtube.audio ? 140 : (this._options.youtube.hd ? 22 : 18), range: start + '-' + (end !== undefined ? end : '')})

    this._video.on('info', (info, format) =>
      this.reset(this._video, processVideoInfo(info, format))
    )
  }

  destroy () {
    if (this._destroyed) throw new ReferenceError('Streamer already destroyed')

    this.close()
    this._video = null
    this._destroyed = true
    this.file = {}
  }
}

YoutubeStreamer.config = config

module.exports = YoutubeStreamer
