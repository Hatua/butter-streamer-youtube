const ytdl = require('ytdl-core')
const debug = require('debug')('butter-streamer-youtube')

const Streamer = require('butter-base-streamer')
const config = {
  name: 'YouTube Streamer',
  domain: /(youtu.be|youtube.com)/,
  protocol: /(youtube|yt)/,
  type: 'youtube',
  priority: 10
}
/* -- YouTube Streamer -- */
class YoutubeStreamer extends Streamer {
  constructor (source, options) {
    super(options)
    options = options || {}
    options.youtube = options.youtube || {}

    this.config = config

    this._options = options
    this._source = source
    this.file = {}
    this._video = ytdl(source, {quality: options.youtube.audio ? 140 : (options.youtube.hd ? 22 : 18)})
    this._video.on('info', (info, format) => {
      debug('info', info, format)
      this._progress.setLength(format.size)
      this._isReady({
        length: info.timestamp * format.bitrate,
        type: format.type,
        name: 'youtube-video.' + format.container
      })
    })
    this._streamify.resolve(this._video)
  }

  seek (start, end) {
    if (this._destroyed) throw new ReferenceError('Streamer already destroyed')

    start = start || 0

    this._video = ytdl(this._source, {quality: this._options.youtube.audio ? 140 : (this._options.youtube.hd ? 22 : 18), range: start + '-' + (end !== undefined ? end : '')})
    this._video.on('info', (info, format) => {
      this._progress.setLength(format.size)
    })

    this._streamify.unresolve()
    this._streamify.resolve(this._video)
  }
  destroy () {
    if (this._destroyed) throw new ReferenceError('Streamer already destroyed')

    this._streamify.unresolve()
    this._video = null
    this._destroyed = true
    this.file = {}
  }
}

YoutubeStreamer.config = config

module.exports = YoutubeStreamer
