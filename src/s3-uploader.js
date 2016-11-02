import latinize from 'latinize';
import unorm from 'unorm';


class S3Uploader {

  server = '';
  signingUrl = '/sign-s3';

  constructor(config={}) {
    this.config = config;
    this._uploadToS3 = this._uploadToS3.bind(this);  // TODO: Revise
  }

  upload(files) {
    const { preprocess, onProgress } = this.config;
    files.map(f => preprocess(f, (processedFile) => {
      onProgress(0, 'Waiting', processedFile);
      this._uploadFile(processedFile);
    }));
  }

  _createCORSRequest(method, url) {
    let xhr = new XMLHttpRequest();
    if (xhr.withCredentials != null) {
      xhr.open(method, url, true);
    }
    else if (typeof XDomainRequest !== "undefined") {
      xhr = new XDomainRequest();
      xhr.open(method, url);
    }
    else {
      xhr = null;
    }
    return xhr;
  }

  _executeOnSignedUrl(file, next) {
    const {
      signingUrlQueryParams,
      server,
      signingUrl,
      signingUrlHeaders,
      onError,
    } = this.config;
    const normalizedFileName = unorm.nfc(cleanFilename(file.name));
    const fileName = latinize(normalizedFileName);
    let queryString = `?objectName=${filename}&contentType=${encodeURIComponent(file.type)}`;

    if (signingUrlQueryParams) {
      const queryParams = typeof signingUrlQueryParams === 'function' ?
        signingUrlQueryParams() : signingUrlQueryParams;
      queryString = Object.keys(queryParams)
        .reduce((k, memo) => `${queryString}&${k}=${queryParams[k]}`, queryString);
    }

    const xhr = this._createCORSRequest('GET', server + signingUrl + queryString);

    if (signingUrlHeaders) {
      Object.keys(signingUrlHeaders).map((k) => xhr.setRequestHeader(k, signingUrlHeaders[k]));
    }

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let result;
        try {
          result = JSON.parse(xhr.responseText);
        }
        catch (error) {
          onError('Invalid response from server', file);
        }
        return next(result);
      }
      else if (xhr.readyState === 4 && xhr.status !== 200) {
        return onError('Could not contact request signing server. Status = ' + xhr.status, file);
      }
    };

    return xhr.send();
  }

  _uploadToS3(file, signResult) {
    const {
      onError,
      onProgress,
      contentDisposition,
      uploadRequestHeaders,
    } = this.config;

    const xhr = this._createCORSRequest('PUT', signResult.signedUrl);
    if ( ! xhr) {
      onError('CORS not supported', file);
    }
    else {
      xhr.onload = () => {
        if (xhr.status === 200) {
          onProgress(100, 'Upload completed', file);
          return onFinishS3Put(signResult, file);
        }
        return onError(`Upload error: ${xhr.status}`, file);
      };
      xhr.onerror = () => {
        return onError('XHR error', file);
      };
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentLoaded = Math.round((e.loaded / e.total) * 100);
          return onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing' : 'Uploading', file);
        }
      };
    }

    xhr.setRequestHeader('Content-Type', file.type);

    if (contentDisposition) {
      let disposition = contentDisposition;
      if (disposition === 'auto') {
        disposition = file.type.substr(0, 6) === 'image/' ? 'inline' : 'attachment';
      }
      const normalizedFileName = unorm.nfc(cleanFilename(file.name));
      const fileName = latinize(normalizedFileName);
      xhr.setRequestHeader('Content-Disposition', `${disposition}; filename=${filename}`);
    }

    if (uploadRequestHeaders) {
      Object.keys(uploadRequestHeaders).map((k) => xhr.setRequestHeader(k, uploadRequestHeaders[k]));
    }
    else {
      xhr.setRequestHeader('x-amz-acl', 'public-read');
    }

    this.httpRequest = xhr;
    return xhr.send(file);
  }

  _uploadFile(file) {
    if (this.config.getSignedUrl) {
      return this.config.getSignedUrl(file, (file) => this._uploadToS3(file));
    }
    return this._executeOnSignedUrl(file, file => this._uploadToS3(file));
  }

  _abortUpload() {
    if (this.httpRequest) {
      this.httpRequest.abort();
    }
  }

}


export default S3Uploader;
