// target elements with the "draggable" class
HTMLElement.prototype.show = function (shouldShow = true, styles) {
    this.style.transition = 'opacity 300ms'
    this.style.pointerEvents = shouldShow ? 'all' : 'none'
    this.style.opacity = shouldShow ? 1 : 0
    for (const key in styles) {
        console.log('styles:', styles)
        this.style[key] = styles[key]
    }
}

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

interact('.draggable').draggable({
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
const BARS_START_TRANSITION = `width ${BAR_ANIMATION_SPEED}ms cubic-bezier(0.61,0.17,0.52,1.22)`
const LOSE_TRANSITION = `width ${LOSE_ANIMATION_MS}ms`

const words = ['growth', 'esteem', 'belong', 'safety', 'energy']
const notifications = [];
const bars = getTextBars();
const timer = getElTime();
const elEndGame = getElEndGame();
const feedbacks = getFeedbacks();
const feedbackContainer = document.querySelector(FEEDBACK_CONTAINER)
const intro = getIntro(() => restartGame());

let isGameEnded = true;
let timeInterval = 0
let loseProgressInterval = 0;
let notificationsInterval = 0;
let currentNoteMS = START_NOTE_SPANW_SPEED_MS;

window.onload = () => {
    elEndGame.hide();
}


function getIntro(onEnd) {
    const intro = {
        introContainer: document.querySelector('.intro-container'),
        introVideo: document.querySelector('.intro'),
        tutorialVideo: document.querySelector('.tutorial'),
        tutorialTimeout: 0,
        returnToIntroTimeout: 0,
        transitionTimeout: 0,
        introTransitionMS: 1500,
        introClick() {
            console.log('this.introVideo:', this)
            this.introVideo.pause()
            this.introVideo.style.opacity = 0
            this.introVideo.style.pointerEvents = 'none'
            setTimeout(() => {
                this.introVideo.style.display = 'none'
            }, 200);

            this.tutorialVideo.play();
            this.tutorialTimeout = setTimeout(() => {
                this.stopTutorial()
            }, TUTORIAL_LENGHT_MS);
        },
        stopTutorial() {
            clearTimeout(this.tutorialTimeout)
            this.animateIntroInOut()
            this.tutorialVideo.style.pointerEvents = 'none'
            this.tutorialVideo.pause();

            setTimeout(() => {
                this.tutorialVideo.style.display = 'none'
                onEnd();
            }, 1000);
        },
        animateIntroInOut() {
            clearTimeout(this.transitionTimeout)
            this.introContainer.style.transition = `all ${this.introTransitionMS}ms ease-in-out`
            this.introContainer.style.transform = 'translate(0,-100%)';
            this.introContainer.style.opacity = 0;
            this.introContainer.style.filter = `blur(${INTRO_BLUR}px)`;
            // this.introContainer.style.height = 0;
            // this.introContainer.style.width = 0;
            // this.introContainer.style.borderRadius = '1000px';
            this.introContainer.style.pointerEvents = 'none'
        },
        startReturnToIntro(onEnd) {
            this.returnToIntroTimeout = setTimeout(() => {
                this.resetIntro()
                setTimeout(() => {
                    onEnd()
                }, this.introTransitionMS);
            }, RETURN_TO_INTRO_SECONDS * 1000);
        },
        stopReturnToIntro() {
            clearTimeout(this.returnToIntroTimeout);
        },
        resetIntro() {
            this.introContainer.setAttribute('style', '')
            this.introVideo.setAttribute('style', '')
            this.tutorialVideo.setAttribute('style', '')
            this.introContainer.style.transition = `all ${this.introTransitionMS}ms ease-in-out`
            this.transitionTimeout = setTimeout(() => {
                this.introContainer.style.transition = ''
            }, this.introTransitionMS);
            this.introVideo.currentTime = 0
            this.introVideo.play()
            this.tutorialVideo.currentTime = 0
            this.tutorialVideo.pause()
        }
    }

    intro.introVideo.addEventListener('click', () => intro.introClick())
    intro.tutorialVideo.addEventListener('click', () => intro.stopTutorial())

    return intro
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


function createFeedbackElement(path, { x, y }, onload) {
    const img = document.createElement('img')
    const radius = 325;

    y = y < radius ? radius : y + radius > window.innerHeight ? window.innerHeight - radius : y;
    x = x < radius ? radius : x + radius > window.innerWidth ? window.innerWidth - radius : x;

    img.className = 'feedback';
    img.setAttribute('width', `${radius * 2}px`)
    img.style.top = y + 'px';
    img.style.left = x + 'px';
    img.style.transform = 'translate(-50%,-50%)';
    img.style.pointerEvents = 'none'
    img.src = `${path}?a=${new Date()}`
    img.onload = onload;
    return img
}

function resetVidIndexes() {
    words.forEach(word => {
        feedbacks[word].vidIndex = 0
        console.log('feedbacks[word].vidIndex:', feedbacks[word].vidIndex)
    })
}

function getFeedbacks() {
    return words.reduce((feedbacks, word) => {
        feedbacks[word] = {
            videos: getFeedbackVideos(word),
            elContainer: document.querySelector(FEEDBACK_CONTAINER),
            selectedVideo: null,
            isPlaying: false,
            vidIndex: 0,
            randVideo() {
                return this.videos[++this.vidIndex % 3]
            },
            play({ x, y }) {
                this.elContainer.show();
                pauseGame();
                this.selectedVideo = this.randVideo();
                const video = this.selectedVideo
                const gif = createFeedbackElement(video.gifSrc, { x, y }, () => {
                    video.audio.onended = () => {
                        resumeGame();
                        this.elContainer.removeChild(gif)
                        this.elContainer.show(false);
                        this.isPlaying = false;
                    }
                    this.isPlaying = true;
                    video.audio.play();
                });
                this.elContainer.appendChild(gif)
            },
        }
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
        intro.stopReturnToIntro();
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

function pauseGame() {
    clearInterval(timeInterval);
    clearInterval(loseProgressInterval);
    clearInterval(notificationsInterval);
}

function resumeGame() {
    startLoseProgress()
    startNotifications(currentNoteMS)
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
            clearNoteContaier();
        }, 1000);
    } else {
        elEndGame.show()
        setTimeout(() => {
            resetBarsWithAnimation(100, 100)
            clearNoteContaier();
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
    const el = document.querySelector('.endgame-container')
    el.children[0].children[0].volume = LOSE_WIN_VOLUME
    el.children[1].children[0].volume = LOSE_WIN_VOLUME
    return {
        el,
        addNoteTimeout: 0,
        show(isWon) {
            intro.startReturnToIntro(() => this.hide());
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
            clearTimeout(this.addNoteTimeout)
            this.el.children[2].innerHTML = ''
            this.el.style.opacity = 0
            this.el.style.pointerEvents = 'none'
        },
        renderInnerHTML() {
            this.el.children[2].innerHTML = ''
            this.addNoteTimeout = setTimeout(() => {
                addNotification('.endgame-notes', { isResetBtn: true })
            }, LOSE_WIN_NOTIFICATION_DELAY_MS);
        }
    }
}
function clearFeedbackContainer() {
    document.querySelector(FEEDBACK_CONTAINER).innerHTML = '';
}

function restartGame() {
    isGameEnded = false;
    elEndGame.hide();
    feedbackContainer.show(false)

    resetVidIndexes();
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

var prevPath = ''

function testRandPic() {
    for (let i = 0; i < 1000; i++) {
        getRandPicPath()
    }
}

function getRandPicPath() {
    let prefix = rand(0, 100) <= GOOD_NOTIFICATION_PERCENT ? 'Good' : 'Bad'
    let word = words[rand(0, words.length)]
    let randPicNum = rand(1, words.length);
    let path = `assets/notifications/${word}/${word}${prefix}${randPicNum}.svg`

    while (path == prevPath) {
        console.log('Duplication, choosing somthing else')
        console.log(prevPath, path)
        word = words[rand(0, words.length)]
        randPicNum = rand(1, words.length)
        prefix = rand(0, 100) <= GOOD_NOTIFICATION_PERCENT ? 'Good' : 'Bad'
        path = `assets/notifications/${word}/${word}${prefix}${randPicNum}.svg`
    }
    prevPath = path;

    return { path, word, prefix }
}

function addNotification(selector, { isResetBtn } = {}) {
    const { path, word, prefix } = getRandPicPath();
    // const [x, y] = [rand(1200, 1300), rand(100, 700)]
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