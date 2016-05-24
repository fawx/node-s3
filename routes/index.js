var express = require('express');
var router = express.Router();
var s3 = require('s3');
var http = require('http');
var https = require('https');
var fs = require('fs');
var hash = require('object-hash');
var lwip = require('lwip');
var conf = require('../config/config');
var multer = require('multer');
var upload = multer({ dest: 'tmp/' });

var s3client = s3.createClient({
    s3Options: {
        accessKeyId: conf.accessKeyId,
        secretAccessKey: conf.secretAccessKey,
        region: conf.region,
    }
});


function uploadImage(filename) {
    return new Promise(function(resolve, reject) {

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
            reject( s3err );
        });

        uploader.on('end', function() {
            fs.unlink('tmp/' + filename);
            console.log( 'resolved uploading ' + filename);
            resolve(filename);
        });
    });
};


function saveThumbnail(url) {
    return new Promise(function(resolve, reject) {

        // grab the extension so we can apply the correct compression
        var filename = hash([url]) + '.' + url.split('.').pop();
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
            if ( lwipErr ) {
                console.log('lwipErr ', lwipErr );
                reject( lwipErr );
            }
            else {
                img.batch()
                .cover(200, 200)
                .writeFile('tmp/thumb_' + filename, params, function( writeFileErr ) {
                    console.log( 'resolved processing ' + filename)
                    resolve(url);
                });
            }
        });
    });
};

function getImage(url) {
    return new Promise(function(resolve, reject) {
        var getter = ( url.indexOf('http://') !== -1 ? http : https );

        var request = getter.get( url , function(response) {
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
                    var filename = hash([url]) + '.' + url.split('.').pop();
                    fs.writeFile( 'tmp/' + filename, stream, 'binary', function(fsErr) {
                        if (fsErr) { 
                            console.log('fsErr ', fsErr) 
                            reject(fsErr);
                        }
                        else {
                            resolve(url);
                        }
                    });
                });
            }
            else {
                reject(Error('Not a valid image'));
            }
        });

        request.on('error', function(httpError) {
            reject(httpError);
        });
    });
};


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/upload', function(req, res, next) {
    res.render('upload', { title: 'S3 Uploader' });
});

router.post('/upload', upload.single('file'), function(req, res, next) {
    var size = 0;
    var files = [];
    var errors = [];

    console.log( req.body );
    console.log( req.file );

    /*
    var images = [ 
        { 
            "data": "Do you wake up ready to make the world a little better every morning? Come join our digital studio to help bring our clients' ideas to life and shape the future of fundraising through our flagship product, Cause Momentum.\n\n",
            "source": "http://mostlyserious.io/blog/were-hiring-a-product-manager/",
            "content_type": "text"
        },
        { 
            "data": "http://mostlyserious.io/static/media/uploads/product-manager-hiring.jpg",
            "source": "http://mostlyserious.io/blog/were-hiring-a-product-manager/",
            "content_type": "image"
        },
        { 
            "data": "http://www.pawderosa.com/images/puppies.jpg",
            "source": "http://mostlyserious.io/blog/were-hiring-a-product-manager/",
            "content_type": "image"
        },
        { 
            "data": "http://cdn1-www.dogtime.com/assets/uploads/gallery/30-impossibly-cute-puppies/impossibly-cute-puppy-12.jpg",
            "source": "http://mostlyserious.io/blog/were-hiring-a-product-manager/",
            "content_type": "image"
        },
        { 
            "data": "http://www.pamperedpetz.net/wp-content/uploads/2015/09/Puppy1.jpg",
            "source": "http://mostlyserious.io/blog/were-hiring-a-product-manager/",
            "content_type": "image"
        }
    ];
        

    try {
        var processImages = images.reduce(function(sequence, image) {
            var url = image.data;

            return getImage(url).then(function(url) {
                return saveThumbnail(url);
            }).then(function(url) {
                var filename = hash([url]) + '.' + url.split('.').pop();
                var upload = uploadImage(filename);
                var uploadThumb = uploadImage('thumb_' + filename);

                return Promise.all([upload, uploadThumb]).then(function(results) {
                    return results;
                });
            }).then(function(filenames) {
                files.push(filenames);
            }).catch(function(error) {
                errors.push( [url, error] );
            });
        }, Promise.resolve());

        processImages.then(function() {
            console.log( files );
        }).catch(function( error ) {
            errors.push( error );
        }).then(function() {
            console.log( errors );
            res.render('upload', { title: 'S3 Uploader (posted)' });
        });
    }
    catch (err) {
        console.log( err );
        res.send(500);
    }
    */
   res.sendStatus(200);
});

module.exports = router;
