var inherits = require('util').inherits
  , ytdl = require('ytdl');

var Streamer = require('butter-base-streamer');

/* -- YouTube Streamer -- */
function YoutubeStreamer(source, options) {
	if(!(this instanceof YoutubeStreamer)) 
		return new YoutubeStreamer(source, options);

	Streamer.call(this, options);
	var self = this;
	options = options || {};

	this._options = options;
	this._source = source;
	this._video = ytdl(source, {quality: options.hd ? 22 : 18});
	this._video.on('info', function(info, format) {
		self._progress.setLength(format.size);
	})
	this._streamify.resolve(this._video);
}
inherits(YoutubeStreamer, Streamer);

YoutubeStreamer.prototype.config = {
	name: 'YouTube Streamer',
	domain: /(youtu.be|youtube.com)/,
	protocol: /(youtube|yt)/,
	type: 'youtube'
}

YoutubeStreamer.prototype.seek = function(start, end) {
	if(this._destroyed) throw new ReferenceError('Streamer already destroyed');

	var self = this;
	start = start || 0;

	this._video = ytdl(this._source, {quality: this._options.hd ? 22 : 18, range: start + '-' + (end !== undefined ? end : '')});
	this._video.on('info', function(info, format) {
		self._progress.setLength(format.size);
	})

	this._streamify.unresolve();
	this._streamify.resolve(this._video);
}

YoutubeStreamer.prototype.destroy = function() {
	if(this._destroyed) throw new ReferenceError('Streamer already destroyed');

	this._streamify.unresolve();
	this._video = null;
	this._destroyed = true;
}

module.exports = YoutubeStreamer;
