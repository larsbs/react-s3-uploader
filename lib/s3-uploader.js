'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _latinize = require('latinize');

var _latinize2 = _interopRequireDefault(_latinize);

var _unorm = require('unorm');

var _unorm2 = _interopRequireDefault(_unorm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var S3Uploader = function () {
  function S3Uploader() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, S3Uploader);

    this.server = '';
    this.signingUrl = '/sign-s3';

    this.config = config;
    this._uploadToS3 = this._uploadToS3.bind(this); // TODO: Revise
  }

  _createClass(S3Uploader, [{
    key: 'upload',
    value: function upload(files) {
      var _this = this;

      var _config = this.config,
          preprocess = _config.preprocess,
          onProgress = _config.onProgress;

      files.map(function (f) {
        return preprocess(f, function (processedFile) {
          onProgress(0, 'Waiting', processedFile);
          _this._uploadFile(processedFile);
        });
      });
    }
  }, {
    key: '_createCORSRequest',
    value: function _createCORSRequest(method, url) {
      var xhr = new XMLHttpRequest();
      if (xhr.withCredentials != null) {
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        xhr = null;
      }
      return xhr;
    }
  }, {
    key: '_executeOnSignedUrl',
    value: function _executeOnSignedUrl(file, next) {
      var _config2 = this.config,
          signingUrlQueryParams = _config2.signingUrlQueryParams,
          server = _config2.server,
          signingUrl = _config2.signingUrl,
          signingUrlHeaders = _config2.signingUrlHeaders,
          onError = _config2.onError;

      var normalizedFileName = _unorm2.default.nfc(cleanFilename(file.name));
      var fileName = (0, _latinize2.default)(normalizedFileName);
      var queryString = '?objectName=' + filename + '&contentType=' + encodeURIComponent(file.type);

      if (signingUrlQueryParams) {
        (function () {
          var queryParams = typeof signingUrlQueryParams === 'function' ? signingUrlQueryParams() : signingUrlQueryParams;
          queryString = Object.keys(queryParams).reduce(function (k, memo) {
            return queryString + '&' + k + '=' + queryParams[k];
          }, queryString);
        })();
      }

      var xhr = this._createCORSRequest('GET', server + signingUrl + queryString);

      if (signingUrlHeaders) {
        Object.keys(signingUrlHeaders).map(function (k) {
          return xhr.setRequestHeader(k, signingUrlHeaders[k]);
        });
      }

      if (xhr.overrideMimeType) {
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var result = void 0;
          try {
            result = JSON.parse(xhr.responseText);
          } catch (error) {
            onError('Invalid response from server', file);
          }
          return next(result);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
          return onError('Could not contact request signing server. Status = ' + xhr.status, file);
        }
      };

      return xhr.send();
    }
  }, {
    key: '_uploadToS3',
    value: function _uploadToS3(file, signResult) {
      var _config3 = this.config,
          onError = _config3.onError,
          onProgress = _config3.onProgress,
          contentDisposition = _config3.contentDisposition,
          uploadRequestHeaders = _config3.uploadRequestHeaders;


      var xhr = this._createCORSRequest('PUT', signResult.signedUrl);
      if (!xhr) {
        onError('CORS not supported', file);
      } else {
        xhr.onload = function () {
          if (xhr.status === 200) {
            onProgress(100, 'Upload completed', file);
            return onFinishS3Put(signResult, file);
          }
          return onError('Upload error: ' + xhr.status, file);
        };
        xhr.onerror = function () {
          return onError('XHR error', file);
        };
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) {
            var percentLoaded = Math.round(e.loaded / e.total * 100);
            return onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing' : 'Uploading', file);
          }
        };
      }

      xhr.setRequestHeader('Content-Type', file.type);

      if (contentDisposition) {
        var disposition = contentDisposition;
        if (disposition === 'auto') {
          disposition = file.type.substr(0, 6) === 'image/' ? 'inline' : 'attachment';
        }
        var normalizedFileName = _unorm2.default.nfc(cleanFilename(file.name));
        var fileName = (0, _latinize2.default)(normalizedFileName);
        xhr.setRequestHeader('Content-Disposition', disposition + '; filename=' + filename);
      }

      if (uploadRequestHeaders) {
        Object.keys(uploadRequestHeaders).map(function (k) {
          return xhr.setRequestHeader(k, uploadRequestHeaders[k]);
        });
      } else {
        xhr.setRequestHeader('x-amz-acl', 'public-read');
      }

      this.httpRequest = xhr;
      return xhr.send(file);
    }
  }, {
    key: '_uploadFile',
    value: function _uploadFile(file) {
      var _this2 = this;

      if (this.config.getSignedUrl) {
        return this.config.getSignedUrl(file, function (file) {
          return _this2._uploadToS3(file);
        });
      }
      return this._executeOnSignedUrl(file, function (file) {
        return _this2._uploadToS3(file);
      });
    }
  }, {
    key: '_abortUpload',
    value: function _abortUpload() {
      if (this.httpRequest) {
        this.httpRequest.abort();
      }
    }
  }]);

  return S3Uploader;
}();

exports.default = S3Uploader;