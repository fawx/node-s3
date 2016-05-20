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

    var files = e.dataTransfer.files;

    for ( var i = 0; i < files.length; i++ ) {
        console.log( files[i] );
    }

    return false;
};


dropTarget.addEventListener('dragenter', handleDragEnter, false);
dropTarget.addEventListener('dragover', handleDragOver, false);
dropTarget.addEventListener('dragleave', handleDragLeave, false);
dropTarget.addEventListener('dragend', handleDragEnd, false);
dropTarget.addEventListener('drop', handleDrop, false);
