dropTarget = document.querySelector('.drop');

function handleDragEnter(e) {
    dropTarget.classList.add('droppable');
};

function handleDragLeave(e) {
    dropTarget.classList.remove('droppable');
};

function handleDragOver(e) {
    e.preventDefault();

    e.dataTransfer.dropEffect = 'move';
};

function handleDragEnd(e) {
    dropTarget.classList.remove('droppable');
};

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    dropTarget.classList.remove('droppable');

    var files = e.dataTransfer.files;
    var url = e.dataTransfer.getData('text/uri-list');
    var formdata = new FormData();

    console.log( files, url );

    if ( files.length > 0 ) {
        formdata.append('file', files[0]);
    }
    else if ( url.length > 0 ) {
        formdata.append('file-url', url);
    }

    console.log( formdata );

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload');

    xhr.onload = function() {
        if ( xhr.status === 200 ) {
            console.log('success');
        }
        else {
            console.log('error');
        }
    };

    xhr.send(formdata);

    return false;
};


dropTarget.addEventListener('dragenter', handleDragEnter, false);
dropTarget.addEventListener('dragover', handleDragOver, false);
dropTarget.addEventListener('dragleave', handleDragLeave, false);
dropTarget.addEventListener('dragend', handleDragEnd, false);
dropTarget.addEventListener('drop', handleDrop, false);
