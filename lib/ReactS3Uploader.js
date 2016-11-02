"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _omit = require('lodash/omit');

var _omit2 = _interopRequireDefault(_omit);

var _pick = require('lodash/pick');

var _pick2 = _interopRequireDefault(_pick);

var _s3Uploader = require('./s3-uploader');

var _s3Uploader2 = _interopRequireDefault(_s3Uploader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// http://stackoverflow.com/a/24608023/194065
function clearInputFile(f) {
  if (f.value) {
    try {
      f.value = ''; //for IE11, latest Chrome/Firefox/Opera...
    } catch (err) {}
    if (f.value) {
      //for IE5 ~ IE10
      var form = document.createElement('form'),
          parentNode = f.parentNode,
          ref = f.nextSibling;
      form.appendChild(f);
      form.reset();
      parentNode.insertBefore(f, ref);
    }
  }
}

var ReactS3Uploader = function (_React$Component) {
  _inherits(ReactS3Uploader, _React$Component);

  function ReactS3Uploader(props) {
    _classCallCheck(this, ReactS3Uploader);

    var _this = _possibleConstructorReturn(this, (ReactS3Uploader.__proto__ || Object.getPrototypeOf(ReactS3Uploader)).call(this, props));

    _this._uploadFile = _this._uploadFile.bind(_this);
    return _this;
  }

  _createClass(ReactS3Uploader, [{
    key: 'render',
    value: function render() {
      var uploadProps = (0, _pick2.default)(this.props, Object.keys(ReactS3Uploader.propTypes));
      var filteredProps = (0, _omit2.default)(this.props, Object.keys(ReactS3Uploader.propTypes));
      return _react2.default.createElement('input', _extends({}, filteredProps, { type: 'file', onChange: this._uploadFile() }));
    }
  }, {
    key: '_uploadFile',
    value: function _uploadFile() {
      new _s3Uploader2.default({
        fileElement: _reactDom2.default.findDOMNode(this),
        signingUrl: this.props.signingUrl,
        getSignedUrl: this.props.getSignedUrl,
        preprocess: this.props.preprocess,
        onProgress: this.props.onProgress,
        onFinishS3Put: this.props.onFinish,
        onError: this.props.onError,
        signingUrlHeaders: this.props.signingUrlHeaders,
        signingUrlQueryParams: this.props.signingUrlQueryParams,
        uploadRequestHeaders: this.props.uploadRequestHeaders,
        contentDisposition: this.props.contentDisposition,
        server: this.props.server
      });
    }
  }]);

  return ReactS3Uploader;
}(_react2.default.Component);

ReactS3Uploader.propTypes = {
  signingUrl: _react2.default.PropTypes.string,
  getSignedUrl: _react2.default.PropTypes.func,
  preprocess: _react2.default.PropTypes.func,
  onProgress: _react2.default.PropTypes.func,
  onFinish: _react2.default.PropTypes.func,
  onError: _react2.default.PropTypes.func,
  signingUrlHeaders: _react2.default.PropTypes.object,
  signingUrlQueryParams: _react2.default.PropTypes.oneOfType([_react2.default.PropTypes.object, _react2.default.PropTypes.func]),
  uploadRequestHeaders: _react2.default.PropTypes.object,
  contentDisposition: _react2.default.PropTypes.string,
  server: _react2.default.PropTypes.string
};

ReactS3Uploader.defaultProps = {
  server: '',
  preprocess: function preprocess(file, next) {
    console.log('Pre-process: ' + file.name);
    next(file);
  },
  onProgress: function onProgress(percent, message) {
    console.log('Upload progress: ' + percent + '% ' + message);
  },
  onFinish: function onFinish(signResult) {
    console.log("Upload finished: " + signResult.publicUrl);
  },
  onError: function onError(message) {
    console.log("Upload error: " + message);
  }
};

exports.default = ReactS3Uploader;