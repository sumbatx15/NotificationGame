// target elements with the "draggable" class
const rand = (num1, num2) => {
    return Math.floor(Math.random() * num2) + num1
}

function dragMoveListener(event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.zIndex = 99;
    target.style.webkitTransform =
        target.style.transform =
        'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}
// window.dragMoveListener = dragMoveListener;
interact('.draggable')
    .draggable({
        inertia: true,
        autoScroll: true,
        onmove: dragMoveListener,
        onend: function (event) {
            const { target } = event
            target.parentNode.removeChild(target)
        }
    });

function createGif() {
    document.querySelector(NOTE_CONTAINER_SELECTOR).innerHTML += `
        <img src="assets/gif.gif" width="900" />
    `
}
const ANIMATION_MS = 500;
const LOSE_ANIMATION_MS = 200;
const NOTE_CONTAINER_SELECTOR = '.notification-container'
const START_CONTAINER_SELECTOR = '.start-game-container'
const BARS_START_TRANSITION = `width ${ANIMATION_MS}ms cubic-bezier(.61,.17,.52,1.22)`
const LOSE_TRANSITION = `width ${LOSE_ANIMATION_MS}ms`
const BARS_START_PERCENT = 35;

const CORRECT_ANSWER_PT = 10;
const WRONG_ASNWER_PT = -2
const LOSE_PROGRESS_PT = 0.025

const MAX_NOTE_MS = 500;
const MIN_NOTE_MS = 400;
const LOSE_PROGRESS_MS = 50;
const TIME_MS = 100;

const words = ['growth', 'esteem', 'belong', 'safety', 'energy']
const notifications = [];
const bars = getTextBars();
const timer = getElTime();
const elEndGame = getElEndGame();
const feedbacks = getFeedbacks();

let timeInterval = 0
let loseProgressInterval = 0;
let notificationsInterval = 0;
let currentNoteMS = MAX_NOTE_MS;

window.onload = () => {
    elEndGame.hide();
    // restartGame();
}
function getFeedbackVideos(word) {
    const videos = []
    for (let i = 1; i < 4; i++) {
        const video = document.querySelector(`#${word + i}`);
        video.volume = 0.3
        videos.push(video)
    }
    return videos
}

// function isAnyFeedbackPlaying() {
//     return words.reduce((isPlaying, word) => {
//         if (feedbacks[word].isPlaying) {
//             isPlaying = feedbacks[word].isPlaying
//         }
//         return isPlaying
//     }, false)
// }

function getFeedbacks() {
    return words.reduce((feedbacks, word) => {
        feedbacks[word] = {
            videos: getFeedbackVideos(word),
            canvas: document.querySelector(`#${word}-output`),
            selectedVideo: null,
            isPlaying: false,
            frameProcessor: initFrameProcess(`#${word}-output`, `#${word}-buffer`),
            randVideo() {
                return this.videos[rand(0, 3)]// 
            },
            show(show = true) {
                this.canvas.style.width = show ? '900px' : '0px'
            },
            play(play = true) {
                if (play) {
                    this.show();
                    this.clearSelected();
                    this.selectedVideo = this.randVideo();
                    this.frameProcessor.startProcess(this.selectedVideo)
                    this.selectedVideo.currentTime = 0
                    this.selectedVideo.play()
                    this.isPlaying = true;
                    this.frameProcessor.startProcess(this.selectedVideo)
                } else {
                    this.clearSelected();
                }
            },
            clearSelected() {
                if (!this.selectedVideo) return;
                this.selectedVideo.currentTime = 0
                this.selectedVideo.play()
                this.selectedVideo.pause()
                this.frameProcessor.endProcess()
                this.isPlaying = false;
                this.selectedVideo = null;
            }
        }
        feedbacks[word].videos.forEach(v => {
            v.addEventListener('timeupdate', () => {
                const { selectedVideo } = feedbacks[word]
                const percent = 100 / selectedVideo.duration * selectedVideo.currentTime
                if (percent > 70) feedbacks[word].show(false)
            })
            v.addEventListener('ended', () => {
                feedbacks[word].play(false)
            })
        })

        return feedbacks
    }, {})
}

document.addEventListener('mouseup', ({ target }) => {
    console.log('target:', target.tagName)
    const item = notifications.find(item => item.el == target)
    if (item) {
        const isCollecting = item.el.dataset.x < item.startingPosition.x
        const { word, quality } = item.el.dataset

        if (isCollecting && quality == 'Good') {
            bars[word].percent += CORRECT_ANSWER_PT
            sounds.barUpAudio.cloneNode().play()
        }
        if (isCollecting && quality == 'Bad') {
            bars[word].percent += WRONG_ASNWER_PT
            sounds.barDownAudio.cloneNode().play()
        }
        if (!isCollecting && quality == 'Bad') {
            bars[word].percent += 2
            sounds.trashAudio.cloneNode().play()
        }

        item.el.style.opacity = 0;
        item.el.style.pointerEvents = 'none';
    }

    if (target.dataset.name == 'reset-btn') {
        target.style.opacity = 0;
        target.style.pointerEvents = 'none';
        sounds.trashAudio.cloneNode().play()
        setTimeout(() => {
            restartGame();
        }, 500);
    }
})

function handleIntroClick(element) {
    element.children[0].pause()
    element.style.opacity = 0
    element.style.pointerEvents = 'none'

    const elTutorial = document.querySelector('.tutorial')
    // elTutorial.children[0].play()
    setTimeout(() => {
        elTutorial.style.height = 0;
        elTutorial.style.width = 0;
        elTutorial.style.borderRadius = '1000px';
        // restartGame();
    }, 0);
}
function endGame() {
    elEndGame.show();
    setTimeout(() => {
        resetBarsWithAnimation(100)
    }, 500);
    clearInterval(timeInterval);
    clearInterval(loseProgressInterval);
    clearInterval(notificationsInterval);

    let isWinner = true;
    words.forEach(word => {
        if (bars[word].percent <= 0) isWinner = false;
    })
}
function barUp(word) {
    // feedbacks[word].play();
}
function getTextBars() {
    return words.reduce((bars, word) => {
        bars[word] = {
            el: document.querySelector(`#${word}-bar`),
            max: BARS_START_PERCENT,
            _percent: 100,
            _isStarting: false,
            set isStarting(val) {
                this._isStarting = val
                setInterval(() => {
                    this._isStarting = false
                }, ANIMATION_MS);
            },
            isGainingPoints: false,
            get percent() {
                return this._percent;
            },
            set percent(percent) {
                if (this.isGainingPoints) return;
                this._percent = percent
                this.calcMax();
                if (this._percent <= 0) endGame();
                this.el.style.transition = this._isStarting || this.isGainingPoints ? BARS_START_TRANSITION : LOSE_TRANSITION
                this.el.style.width = `${this._percent}%`
            },
            calcMax() {
                if (this.percent != 100 && this.percent > this.max + 12) {
                    this.max = this.percent;
                    barUp(word)
                }
            },
            gainingPoints() {
                this.isGainingPoints = true
                this.el.style.transition = BARS_START_TRANSITION;
                setTimeout(() => {
                    this.isGainingPoints = false
                }, ANIMATION_MS);
            }
        }
        return bars;
    }, {})
}

function getElEndGame() {
    return {
        el: document.querySelector('.endgame-container'),
        show() {
            this.el.style.opacity = 1
            this.el.style.pointerEvents = 'all'
            this.renderInnerHTML();
        },
        hide() {
            this.el.style.opacity = 0
            this.el.style.pointerEvents = 'none'
        },
        renderInnerHTML() {
            const { path } = getRandPicPath();
            this.el.innerHTML = `
            <div class="draggable" data-name="reset-btn">
            <img src="${path}" alt="">
        </div>`

        }
    }
}

function restartGame() {
    elEndGame.hide();
    clearNotContaier();

    setTimeout(() => {
        resetBarsWithAnimation(BARS_START_PERCENT);
    }, ANIMATION_MS);
    setTimeout(() => {
        startLoseProgress(BARS_START_PERCENT);
    }, ANIMATION_MS * 2);

    timer.percent = 100;
    setTimeout(() => {
        startTime();
    }, ANIMATION_MS * 2);
    currentNoteMS = MAX_NOTE_MS;
    startNotifications(currentNoteMS);
}

function startTime() {
    timeInterval = setInterval(() => {
        timer.percent -= (100 / 60)
    }, 1000);
}

function getElTime() {
    return {
        el: document.querySelector('.time-progress>.bar'),
        _percent: 100,
        get percent() {
            return this._percent;
        },
        set percent(percent) {
            this._percent = percent
            if (this._percent <= 0) endGame();
            this.el.style.height = `${this._percent}%`
        },
    }
}
function startLoseProgress() {
    loseProgressInterval = setInterval(() => {
        words.forEach(word => {
            bars[word].percent -= LOSE_PROGRESS_PT
        })
    }, LOSE_PROGRESS_MS);
}

function startNotifications(ms) {
    clearInterval(notificationsInterval);
    notificationsInterval = setInterval(() => {
        addNotification(NOTE_CONTAINER_SELECTOR);
        if (currentNoteMS >= MIN_NOTE_MS) {
            currentNoteMS -= 15
            startNotifications(currentNoteMS)
        }
    }, ms);
}


function resetBarsWithAnimation(percent) {
    words.forEach(word => {
        bars[word].max = BARS_START_PERCENT;
        bars[word].isStarting = true;
        bars[word].percent = percent;
    })
}
function getRandPicPath() {
    const prefix = rand(0, 10) > 0 ? 'Good' : 'Bad'
    const randPicNum = rand(1, words.length);
    const word = words[rand(0, words.length)]
    const path = `assets/notifications/${word}/${word}${prefix}${randPicNum}.svg`
    return { path, word, prefix }
}

function addNotification(selector) {
    const { path, word, prefix } = getRandPicPath();
    const [x, y] = [rand(100, 1500), rand(100, 700)]

    const el = document.createElement('div')
    el.className = 'draggable'
    el.style.transform = `translate(${x}px, ${y}px)`
    el.dataset.word = word;
    el.dataset.quality = prefix;
    el.dataset.x = x;
    el.dataset.y = y;
    el.innerHTML = `<img src="${path}" />`

    const item = {
        startingPosition: { x, y },
        el: el
    }

    notifications.push(item)
    document.querySelector(selector).appendChild(el)
    sounds[`${word}Audio`].cloneNode().play();
}

function clearNotContaier() {
    document.querySelector(NOTE_CONTAINER_SELECTOR).innerHTML = ''
}