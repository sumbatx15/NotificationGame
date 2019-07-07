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
const FEEDBACK_CONTAINER = '#feedback-container'
const NOTE_CONTAINER_SELECTOR = '.notification-container'
const START_CONTAINER_SELECTOR = '.start-game-container'
const BARS_START_TRANSITION = `width ${ANIMATION_MS}ms cubic-bezier(0.61,0.17,0.52,1.22)`
const LOSE_TRANSITION = `width ${LOSE_ANIMATION_MS}ms`
const BARS_START_PERCENT = 12;

const CORRECT_ANSWER_PT = 10;
const WRONG_ASNWER_PT = -2
const LOSE_PROGRESS_PT = 0.025

const MAX_NOTE_MS = 1000;
const MIN_NOTE_MS = 600;
const LOSE_PROGRESS_MS = 50;
const TIME_MS = 100;

const words = ['growth', 'esteem', 'belong', 'safety', 'energy']
const notifications = [];
const bars = getTextBars();
const timer = getElTime();
const elEndGame = getElEndGame();
const feedbacks = getFeedbacks();

let isGameEnded = true;
let timeInterval = 0
let loseProgressInterval = 0;
let notificationsInterval = 0;
let currentNoteMS = MAX_NOTE_MS;

window.onload = () => {
    const intro = document.querySelector('.intro');
    const tutorial = document.querySelector('.tutorial');
    let tutorialTimeout = 0;

    intro.src = 'assets/screens/intro.mp4'
    intro.addEventListener('loadeddata', function () {
    })

    intro.addEventListener('click', () => {
        intro.pause()
        intro.style.opacity = 0
        intro.style.pointerEvents = 'none'
        setTimeout(() => {
            intro.style.display = 'none'
        }, 200);

        tutorial.play();
        tutorialTimeout = setTimeout(() => {
            stopTutorial(tutorial)
        }, 20000);
    })

    tutorial.addEventListener('click', () => {
        clearTimeout(tutorialTimeout)
        stopTutorial(tutorial)
    })

    elEndGame.hide();
}
function stopTutorial(tutorial) {
    tutorial.pause();
    tutorial.style.height = 0;
    tutorial.style.width = 0;
    tutorial.style.borderRadius = '1000px';
    tutorial.style.pointerEvents = 'none'
    setTimeout(() => {
        tutorial.style.display = 'none'
    }, 1000);
    restartGame();
}

function getFeedbackVideos(word) {
    const videos = []
    for (let i = 1; i < 4; i++) {
        const video = {
            gifSrc: `assets/feedback/gifs/${word}_${i}.gif`,
            audio: new Audio(`assets/feedback/sounds/${word}_${i}.mp3`),
        }
        videos.push(video)
    }
    return videos
}


function createFeedbackElement(path, onload) {
    const img = document.createElement('img')
    img.className = 'feedback';
    img.setAttribute('width', '300px')
    img.style.top = rand(0, 80) + '%'
    img.style.left = rand(0, 70) + '%'
    img.style.pointerEvents = 'none'
    img.src = `${path}?a=${new Date()}`
    img.onload = onload;
    return img
}

function getFeedbacks() {
    return words.reduce((feedbacks, word) => {
        feedbacks[word] = {
            videos: getFeedbackVideos(word),
            elContainer: document.querySelector(FEEDBACK_CONTAINER),
            selectedVideo: null,
            isPlaying: false,
            randVideo() {
                return this.videos[rand(0, 3)]// 
            },
            show(show = true) {
                this.canvas.style.width = show ? '900px' : '0px'
            },
            play() {
                this.selectedVideo = this.randVideo();
                const video = this.selectedVideo
                const gif = createFeedbackElement(video.gifSrc, () => {
                    video.audio.onended = () => {
                        this.elContainer.removeChild(gif)
                        this.isPlaying = false;
                    }
                    this.isPlaying = true;
                    video.audio.play();
                });
                this.elContainer.appendChild(gif)
            },
        }
        feedbacks[word].videos.forEach(v => {

        })

        return feedbacks
    }, {})
}

document.addEventListener('mouseup', mouseUp)
document.addEventListener('touchend', mouseUp)

function isBarsOver90Percent() {
    let isBarsOver90Percent = true;
    words.forEach(word => {
        if (bars[word].percent < 90) isBarsOver90Percent = false
    })
    return isBarsOver90Percent
}
function mouseUp({ target }) {
    const item = notifications.find(item => item.el == target)
    if (target.dataset.name == 'reset-btn') {
        target.style.opacity = 0;
        target.style.pointerEvents = 'none';
        sounds.trashAudio.cloneNode().play()
        setTimeout(() => {
            restartGame();
        }, 500);
    }
    else if (item) {
        const isCollecting = item.el.dataset.x < item.startingPosition.x
        const { word, quality } = item.el.dataset

        if (isCollecting && quality == 'Good') {
            bars[word].percent += CORRECT_ANSWER_PT
            sounds.barUpAudio.cloneNode().play()
        }
        else if (isCollecting && quality == 'Bad') {
            bars[word].percent += WRONG_ASNWER_PT
            sounds.barDownAudio.cloneNode().play()
        }
        else if (!isCollecting && quality == 'Bad') {
            bars[word].percent += 2
            sounds.trashAudio.cloneNode().play()
        }
        else if (!isCollecting) {
            sounds.trashAudio.cloneNode().play()
        }

        item.el.style.opacity = 0;
        item.el.style.pointerEvents = 'none';
        if (isBarsOver90Percent()) {
            endGame(true)
        }
    }


}

function collectAllNotes() {
    const { children } = document.querySelector(NOTE_CONTAINER_SELECTOR);
    Array.from(children).forEach((note, i) => {
        const { y, x, } = note.dataset
        setTimeout(() => {
            note.style.pointerEvents = `none`
            note.style.transition = `all 1000ms`
            note.style.transform = `translate(${x - 200}px,${y}px)`;
            note.style.opacity = 0
        }, i * 100);
    })
    return children.length
}
function endGame(isWon) {
    if (isGameEnded) return
    isGameEnded = true;
    clearInterval(timeInterval);
    clearInterval(loseProgressInterval);
    clearInterval(notificationsInterval);

    if (isWon) {
        let childLength = collectAllNotes();
        setTimeout(() => {
            resetBarsWithAnimation(100, 100)
        }, childLength * 100);
        setTimeout(() => {
            elEndGame.show(isWon)
        }, (childLength * 100) + 1000);
    } else {
        elEndGame.show()
        setTimeout(() => {
            resetBarsWithAnimation(100, 100)
        }, 500);
    }


}
function barUp(word) {
    feedbacks[word].play();
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
            get isStarting() {
                return this._isStarting
            },
            isGainingPoints: false,
            get percent() {
                return this._percent;
            },
            set percent(percent) {
                if (this.isGainingPoints) return;
                this._percent = percent > 100 ? 100 : percent;
                this.calcMax();
                if (this._percent <= 0) endGame();
                this.el.style.transition = this.isStarting || this.isGainingPoints ? BARS_START_TRANSITION : LOSE_TRANSITION
                this.el.style.width = `${this._percent}%`
            },

            calcMax() {
                if (this.percent != 100 && this.percent > this.max + 25) {
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
        show(isWon) {
            let toShow = isWon ? 0 : 1;
            let notShow = isWon ? 1 : 0;
            this.el.children[toShow].children[0].currentTime = 0
            this.el.children[toShow].children[0].play()
            this.el.children[toShow].style.display = 'block'
            this.el.children[notShow].style.display = 'none'

            this.el.style.opacity = 1
            this.el.style.pointerEvents = 'all'
            this.renderInnerHTML();
        },
        hide() {
            console.log('hide:')
            this.el.children[2] = ''
            this.el.style.opacity = 0
            this.el.style.pointerEvents = 'none'
        },
        renderInnerHTML() {
            this.el.children[2] = ''
            setTimeout(() => {
                addNotification('.endgame-notes', true)
            }, 1500);
        }
    }
}
function clearFeedbackContainer() {
    document.querySelector(FEEDBACK_CONTAINER).innerHTML = '';
}

function restartGame() {
    isGameEnded = false;
    elEndGame.hide();

    clearFeedbackContainer();
    clearNoteContaier();
    setTimeout(() => {
        resetBarsWithAnimation(100, 100);
    }, 0);
    setTimeout(() => {
        resetBarsWithAnimation(BARS_START_PERCENT, BARS_START_PERCENT);
    }, ANIMATION_MS);

    setTimeout(() => {
        startLoseProgress(BARS_START_PERCENT);
    }, ANIMATION_MS * 2);

    timer.percent = 100;

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
            this.el.style.height = `${this._percent}% `
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


function resetBarsWithAnimation(percent, max) {
    words.forEach(word => {
        bars[word].max = max;
        bars[word].isStarting = true;
        bars[word].percent = percent;
    })
}
function getRandPicPath() {
    const prefix = rand(0, 10) >= 4 ? 'Good' : 'Bad'
    const randPicNum = rand(1, words.length);
    // const word = 'esteem'
    const word = words[rand(0, words.length)]
    const path = `assets/notifications/${word}/${word}${prefix}${randPicNum}.svg`
    return { path, word, prefix }
}

function addNotification(selector, isResetBtn) {
    const { path, word, prefix } = getRandPicPath();
    const [x, y] = [rand(100, 1500), rand(100, 700)]

    const el = document.createElement('div')
    el.className = 'draggable'
    el.style.transform = `translate(${x}px, ${y}px)`
    el.dataset.word = word;
    el.dataset.quality = prefix;
    el.dataset.x = x;
    el.dataset.y = y;
    if (isResetBtn) el.dataset.name = 'reset-btn'
    el.innerHTML = `<img src="${path}" />`

    const item = {
        startingPosition: { x, y },
        el: el
    }

    notifications.push(item)
    document.querySelector(selector).appendChild(el)
    sounds[`${word}Audio`].cloneNode().play();
}

function clearNoteContaier() {
    document.querySelector(NOTE_CONTAINER_SELECTOR).innerHTML = ''
}