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

const BAR_ANIMATION_SPEED = 500;
const LOSE_ANIMATION_MS = 200;
const FEEDBACK_CONTAINER = '#feedback-container'
const NOTE_CONTAINER_SELECTOR = '.notification-container'
const START_CONTAINER_SELECTOR = '.start-game-container'
const BARS_START_TRANSITION = `width ${BAR_ANIMATION_SPEED}ms cubic-bezier(0.61,0.17,0.52,1.22)`
const LOSE_TRANSITION = `width ${LOSE_ANIMATION_MS}ms`

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
let currentNoteMS = START_NOTE_SPANW_SPEED_MS;

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
        }, TUTORIAL_LENGHT_MS);
    })

    tutorial.addEventListener('click', () => {
        clearTimeout(tutorialTimeout)
        stopTutorial(tutorial)
    })

    elEndGame.hide();
}
function stopTutorial(tutorial) {
    tutorial.parentElement.style.height = 0;
    tutorial.parentElement.style.width = 0;
    tutorial.parentElement.style.borderRadius = '1000px';
    tutorial.parentElement.style.pointerEvents = 'none'
    tutorial.style.pointerEvents = 'none'
    tutorial.pause();
    setTimeout(() => {
        tutorial.style.display = 'none'
    }, 1000);
    restartGame();
}

function getFeedbackVideos(word) {
    const videos = []
    for (let i = 1; i < 4; i++) {
        const audio = new Audio(`assets/feedback/sounds/${word}_${i}.mp3`)
        audio.volume = FEEDBACK_VOLUME;
        videos.push({
            gifSrc: `assets/feedback/gifs/${word}_${i}.gif`,
            audio: audio,
        })
    }
    return videos
}


function createFeedbackElement(path, { x, y }, onload, ) {
    const img = document.createElement('img')
    img.className = 'feedback';
    img.setAttribute('width', '450px')
    img.style.top = y + 'px';
    img.style.left = x + 'px';
    img.style.transform = 'translate(-50%,-50%)';
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
            play({ x, y }) {
                this.selectedVideo = this.randVideo();
                const video = this.selectedVideo
                const gif = createFeedbackElement(video.gifSrc, { x, y }, () => {
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
            bars[word].notification = item;
            bars[word].percent += CORRECT_ANSWER_PT
            playSound('barUpAudio', BAR_VOLUME)
        }
        else if (isCollecting && quality == 'Bad') {
            bars[word].percent += WRONG_ASNWER_PT
            playSound('barDownAudio', BAR_VOLUME)

        }
        else if (!isCollecting && quality == 'Bad') {
            bars[word].notification = item;
            bars[word].percent += CORRECT_TRASH_ANSWER_PT
            playSound('trashAudio', NOTIFICATION_VOLUME)
        }
        else if (!isCollecting) {
            playSound('trashAudio', NOTIFICATION_VOLUME)
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
        note.style.pointerEvents = `none`
        note.style.transition = `all 1000ms`
        note.style.transform = `translate(${x - 300}px,${y}px)`;
        note.style.opacity = 0
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
        resetBarsWithAnimation(100, 100)
        setTimeout(() => {
            elEndGame.show(isWon)
        }, 1000);
    } else {
        elEndGame.show()
        setTimeout(() => {
            resetBarsWithAnimation(100, 100)
        }, 500);
    }


}

function getTextBars() {
    return words.reduce((bars, word) => {
        bars[word] = {
            notification: null,
            el: document.querySelector(`#${word}-bar`),
            max: BARS_START_PERCENT,
            _percent: 100,
            _isStarting: false,
            set isStarting(val) {
                this._isStarting = val
                setInterval(() => {
                    this._isStarting = false
                }, BAR_ANIMATION_SPEED);
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

                if (this.percent != 100 && this.percent > this.max + FEEDBACK_PER_PERCENT) {
                    const { x, y } = this.notification.startingPosition
                    this.max = this.percent;
                    feedbacks[word].play({ x, y });
                }
            },
            gainingPoints() {
                this.isGainingPoints = true
                this.el.style.transition = BARS_START_TRANSITION;
                setTimeout(() => {
                    this.isGainingPoints = false
                }, BAR_ANIMATION_SPEED);
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
            }, LOSE_WIN_NOTIFICATION_DELAY);
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
    }, BAR_ANIMATION_SPEED);

    setTimeout(() => {
        startLoseProgress(BARS_START_PERCENT);
    }, BAR_ANIMATION_SPEED * 2);

    timer.percent = 100;

    currentNoteMS = START_NOTE_SPANW_SPEED_MS;
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
            bars[word].percent -= BAR_LOSING_PT
        })
    }, BAR_LOSING_SPEED_MS);
}

function startNotifications(ms) {
    clearInterval(notificationsInterval);
    notificationsInterval = setInterval(() => {
        addNotification(NOTE_CONTAINER_SELECTOR);
        if (currentNoteMS >= END_NOTE_SPANW_SPEED_MS) {
            currentNoteMS -= NOTE_SPAWN_ACCELERATOR
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
    const prefix = rand(0, 100) <= GOOD_NOTIFICATION_PERCENT ? 'Good' : 'Bad'
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
    playSound(`${word}Audio`, NOTIFICATION_VOLUME)
}

function playSound(propName, volume) {
    const sound = sounds[propName].cloneNode()
    sound.volume = volume
    sound.play();
}

function clearNoteContaier() {
    document.querySelector(NOTE_CONTAINER_SELECTOR).innerHTML = ''
}