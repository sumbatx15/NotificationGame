function initFrameProcess(outputSelector, bufferSelector) {
    var outputCanvas = document.querySelector(outputSelector),
        output = outputCanvas.getContext('2d'),
        bufferCanvas = document.querySelector(bufferSelector),
        buffer = bufferCanvas.getContext('2d'),
        video = null,
        width = outputCanvas.width,
        height = outputCanvas.height,
        interval;

    function processFrame() {
        buffer.drawImage(video, 0, 0);

        // this can be done without alphaData, except in Firefox which doesn't like it when image is bigger than the canvas
        var image = buffer.getImageData(0, 0, width, height),
            imageData = image.data,
            alphaData = buffer.getImageData(0, height, width, height).data;

        for (var i = 3, len = imageData.length; i < len; i = i + 4) {
            imageData[i] = alphaData[i - 1];
        }
        output.putImageData(image, 0, 0, 0, 0, width, height);
    }

    function startProcess(refVideo) {
        video = refVideo
        clearInterval(interval);
        interval = setInterval(processFrame, 40)
    }
    function endProcess() {
        clearInterval(interval);
    }
    return {
        startProcess,
        endProcess
    }
}