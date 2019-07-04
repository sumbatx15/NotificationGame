(() => {
        var words = ['growth', 'esteem', 'belong', 'safety', 'energy']
        var elVideos = document.querySelector('#videos')
        var innerHTML = ''
        words.forEach(word => {
            for (let i = 1; i < 4; i++) {
                innerHTML += `<video class="video" id="${word + i}">
            <source src="assets/feedback/${word + i}.mp4" type='video/mp4; codecs="avc1.42E01E"' />
        </video>`
            }
        })
        elVideos.innerHTML = innerHTML;
    }
)()