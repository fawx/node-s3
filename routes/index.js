var express = require('express');
var router = express.Router();
var s3 = require('s3');
var http = require('http');
var https = require('https');
var fs = require('fs');
var hash = require('object-hash');
var lwip = require('lwip');
var conf = require('../config/config');


var s3client = s3.createClient({
    s3Options: {
        accessKeyId: conf.accessKeyId,
        secretAccessKey: conf.secretAccessKey,
        region: conf.region,
    }
});


function upload(filename) {
    var uploader = s3client.uploadFile({
        localFile: 'tmp/' + filename,

        s3Params:  {
            Bucket: conf.bucket,
            Key: filename,
            ACL: 'public-read'
        }
    });

    uploader.on('error', function(s3err) { 
        console.log( s3err ); 
    });

    uploader.on('end', function() {
        console.log( 'uploaded ' + filename );
        fs.unlink('tmp/' + filename);
    });
};


function processImage(url, filename) {
    var getter = ( url.indexOf('http://') !== -1 ? http : https );

    console.log( "getting " + url );
    getter.get( url , function(response) {
        // double check the content type when we receive headers
        // this will prevent us from trying to capture images that may actually be a 404
        // or any other number of crazy things
        var validImageTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
            isValidImage = validImageTypes.indexOf( response.headers['content-type'] ) !== -1;

        if ( isValidImage ) {
            var stream = '';

            response.setEncoding('binary');

            response.on('data', function(chunk) {
                stream += chunk;
            });

            response.on('end', function() {
                fs.writeFile( 'tmp/' + filename, stream, 'binary', function(fsErr) {
                    if (fsErr) { console.log(fsErr) }

                    // grab the extension so we can apply the correct compression
                    var ext = filename.split('.').pop();
                    var params = {}

                    if ( ext == 'jpg' || ext == 'jpeg' ) {
                        params['quality'] = 70;
                    }
                    if ( ext == 'png' ) {
                        params['compression'] = 'high';
                    }

                    // process, save, and upload the image and new thumbnail
                    lwip.open( 'tmp/' + filename, function( lwipErr, img ) {
                        img.batch()
                        .cover(200, 200)
                        .writeFile('tmp/thumb_' + filename, params, function( writeFileErr ) {
                            upload(filename);
                            upload('thumb_' + filename);

                        });
                    });
                });
            });
        }
    });
};
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/upload', function(req, res, next) {
    res.render('upload', { title: 'S3 Uploader' });
});

router.post('/upload', function(req, res, next) {
    for ( image in req.body ) {
        var url = req.body[image];
        var imageUrlRegex = new RegExp( /(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/i );
        var isValidImage = imageUrlRegex.test( url );

        if ( isValidImage ) {
            var filename = hash([url]) + '.' + url.split('.').pop();
            processImage(url, filename);
            console.log( filename );
        }
    }
    console.log( "done" );
    res.render('upload', { title: 'S3 Uploader (posted)' });
});

module.exports = router;
