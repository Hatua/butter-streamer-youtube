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
  constructor (source, options) {
    options.youtube = options.youtube || {}
    super(source, options, config)
  }

  createStream(source, opts) {
    return new Promise((accept, reject) => {
      this._video = ytdl(source, {
        quality: this.options.youtube.audio ? 140 : (this.options.youtube.hd ? 22 : 18),
        range: opts ? opts.start + '-' + (opts.end !== undefined ? opts.end : ''): undefined
      })

      this._video.on('info', (info, format) =>
        accept({
          stream: this._video,
          length: processLength(info, format)
        })
      )
    })
  }

  destroy () {
    super.destroy()
    this._video = null
  }
}

YoutubeStreamer.config = config

module.exports = YoutubeStreamer
