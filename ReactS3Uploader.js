"use strict";

var React = require('react'),
    ReactDOM = require('react-dom'),
    S3Upload = require('./s3upload.js'),
    objectAssign = require('object-assign');
const createReactClass = require('create-react-class');
const PropTypes = require('prop-types');

var ReactS3Uploader = createReactClass({

    propTypes: {
        signingUrl: PropTypes.string,
        getSignedUrl: PropTypes.func,
        preprocess: PropTypes.func,
        onProgress: PropTypes.func,
        onFinish: PropTypes.func,
        onError: PropTypes.func,
        signingUrlHeaders: PropTypes.object,
        signingUrlQueryParams: PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.func
        ]),
        uploadRequestHeaders: PropTypes.object,
        contentDisposition: PropTypes.string,
        server: PropTypes.string
    },

    getDefaultProps: function() {
        return {
            preprocess: function(file, next) {
                console.log('Pre-process: ' + file.name);
                next(file);
            },
            onProgress: function(percent, message) {
                console.log('Upload progress: ' + percent + '% ' + message);
            },
            onFinish: function(signResult) {
                console.log("Upload finished: " + signResult.publicUrl)
            },
            onError: function(message) {
                console.log("Upload error: " + message);
            },
            server: ''
        };
    },

    uploadFile: function() {
        new S3Upload({
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
            server: this.props.server
        });
    },

    clear: function() {
        clearInputFile(ReactDOM.findDOMNode(this));
    },

    render: function() {
        return React.DOM.input(this.getInputProps());
    },

    getInputProps: function() {
        var temporaryProps = objectAssign({}, this.props, {type: 'file', onChange: this.uploadFile});
        var inputProps = {};

        var invalidProps = Object.keys(ReactS3Uploader.propTypes);

        for(var key in temporaryProps) {
            if(temporaryProps.hasOwnProperty(key) && invalidProps.indexOf(key) === -1) {
                inputProps[key] = temporaryProps[key];
            }
        }

        return inputProps;
    }

});

// http://stackoverflow.com/a/24608023/194065
function clearInputFile(f){
    if(f.value){
        try{
            f.value = ''; //for IE11, latest Chrome/Firefox/Opera...
        }catch(err){ }
        if(f.value){ //for IE5 ~ IE10
            var form = document.createElement('form'),
                parentNode = f.parentNode, ref = f.nextSibling;
            form.appendChild(f);
            form.reset();
            parentNode.insertBefore(f,ref);
        }
    }
}


module.exports = ReactS3Uploader;
