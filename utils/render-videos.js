(() => {
    var words = ['growth', 'esteem', 'belong', 'safety', 'energy']
    var elVideos = document.querySelector('#videos')
    var innerHTML = ''
    words.forEach(word => {
        for (let i = 1; i < 4; i++) {
            innerHTML += `
            <video class="video" id="${word + i}">
                <source src="assets/feedback/${word + i}.mp4" type='video/mp4; codecs="avc1.42E01E"' />
            </video>`.trim();
        }

        innerHTML += `
        <canvas class="buffer" width="1920" height="2160" id="${word}-buffer"></canvas>
        <canvas class="output" width="1920" height="1080" id="${word}-output"></canvas>
        `.trim();
    })

    elVideos.innerHTML = innerHTML;
    // Array.from(elVideos.children).forEach(v => {
    //     v.addEventListener('loadeddata', () => {
    //         console.log('loaded')
    //     })
    // })
}
)()