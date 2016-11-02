"use strict";
import React from 'react';
import ReactDOM from 'react-dom';
import omit from 'lodash/omit';
import pick from 'lodash/pick';

import S3Uploader from './s3-uploader';


// http://stackoverflow.com/a/24608023/194065
function clearInputFile(f){
  if(f.value){
    try {
      f.value = ''; //for IE11, latest Chrome/Firefox/Opera...
    }
    catch(err){ }
    if(f.value){ //for IE5 ~ IE10
      var form = document.createElement('form'),
        parentNode = f.parentNode, ref = f.nextSibling;
      form.appendChild(f);
      form.reset();
      parentNode.insertBefore(f,ref);
    }
  }
}



class ReactS3Uploader extends React.Component {

  constructor(props) {
    super(props);
    this._uploadFile = this._uploadFile.bind(this);
  }

  render() {
    const uploadProps = pick(this.props, Object.keys(ReactS3Uploader.propTypes));
    const filteredProps = omit(this.props, Object.keys(ReactS3Uploader.propTypes));
    return (
      <input {...filteredProps} type="file" onChange={this._uploadFile()} />
    );
  }

  _uploadFile() {
    new S3Uploader({
      fileElement: ReactDOM.findDOMNode(this),
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
      server: this.props.server,
    });
  }

}


ReactS3Uploader.propTypes = {
  signingUrl: React.PropTypes.string,
  getSignedUrl: React.PropTypes.func,
  preprocess: React.PropTypes.func,
  onProgress: React.PropTypes.func,
  onFinish: React.PropTypes.func,
  onError: React.PropTypes.func,
  signingUrlHeaders: React.PropTypes.object,
  signingUrlQueryParams: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.func
  ]),
  uploadRequestHeaders: React.PropTypes.object,
  contentDisposition: React.PropTypes.string,
  server: React.PropTypes.string
};


ReactS3Uploader.defaultProps = {
  server: '',
  preprocess(file, next) {
    console.log('Pre-process: ' + file.name);
    next(file);
  },
  onProgress(percent, message) {
    console.log('Upload progress: ' + percent + '% ' + message);
  },
  onFinish(signResult) {
    console.log("Upload finished: " + signResult.publicUrl)
  },
  onError(message) {
    console.log("Upload error: " + message);
  },
};


export default ReactS3Uploader;
