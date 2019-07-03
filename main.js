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
window.dragMoveListener = dragMoveListener;
interact('.draggable')
    .draggable({
        // enable inertial throwing
        inertia: true,
        // keep the element within the area of it's parent
        // modifiers: [
        //     interact.modifiers.restrict({
        //         restriction: "parent",
        //         endOnly: true,
        //         elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        //     }),
        // ],
        // enable autoScroll
        autoScroll: true,

        // call this function on every dragmove event
        onmove: dragMoveListener,
        // call this function on every dragend event
        onend: function (event) {
            const { target } = event
            target.parentNode.removeChild(target)
        }
    });


const ANIMATION_MS = 500;
const LOSE_ANIMATION_MS = 200;
const NOTE_CONTAINER_SELECTOR = '.notification-container'
const START_CONTAINER_SELECTOR = '.start-game-container'
const BARS_START_TRANSITION = `width ${ANIMATION_MS}ms cubic-bezier(.61,.17,.52,1.22)`
const LOSE_TRANSITION = `width ${LOSE_ANIMATION_MS}ms`
const STARTING_PERCENT = 15;

const CORRECT_ANSWER_PT = 10;
const WRONG_ASNWER_PT = -2
const LOSE_PROGRESS_PT = 0.05

const MAX_NOTE_MS = 1200;
const MIN_NOTE_MS = 250;
const LOSE_PROGRESS_MS = 50;
const TIME_MS = 100;

const words = ['growth', 'esteem', 'belong', 'safety', 'energy']
const notifications = [];
const bars = getTextBars();
const timer = getElTime();
const elEndGame = getElEndGame();

let timeInterval = 0
let loseProgressInterval = 0;
let notificationsInterval = 0;
let currentNoteMS = MAX_NOTE_MS;

window.onload = () => {
    elEndGame.hide();
    document.querySelector(START_CONTAINER_SELECTOR).style.display = 'none'
    restartGame();
}

document.addEventListener('mouseup', ({ target }) => {

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
    if (target.dataset.name == "reset-btn") {
        target.style.opacity = 0;
        target.style.pointerEvents = 'none';
        sounds.trashAudio.cloneNode().play()
        setTimeout(() => {
            restartGame();
        }, 500);
    }
})
function endGame() {

    elEndGame.show();
    setTimeout(() => {
        animateGameBars(100)
    }, 500);
    clearInterval(timeInterval);
    clearInterval(loseProgressInterval);
    clearInterval(notificationsInterval);

    let isWinner = true;
    words.forEach(word => {
        if (bars[word].percent <= 0) isWinner = false;
    })
}

function getTextBars() {
    return words.reduce((bars, word) => {
        bars[word] = {
            el: document.querySelector(`#${word}-bar`),
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
                if (this._percent <= 0) endGame();
                this.el.style.transition = this._isStarting || this.isGainingPoints ? BARS_START_TRANSITION : LOSE_TRANSITION
                this.el.style.width = `${this._percent}%`
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

    animateGameBars(100);
    setTimeout(() => {
        animateGameBars(STARTING_PERCENT);
    }, ANIMATION_MS);
    setTimeout(() => {
        startLoseProgress(STARTING_PERCENT);
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
    }, 500);
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
        addDraggable(NOTE_CONTAINER_SELECTOR);
        if (currentNoteMS >= MIN_NOTE_MS) {
            currentNoteMS -= 60
            startNotifications(currentNoteMS)
        }
    }, ms);
}

function animateGameBars(percent) {
    words.forEach(word => {
        bars[word].isStarting = true;
        bars[word].percent = percent;
    })
}
function getRandPicPath() {
    const prefix = rand(0, 10) > 3 ? 'Good' : 'Bad'
    const randPicNum = rand(1, words.length);
    const word = words[rand(0, words.length)]
    const path = `assets/notifications/${word}/${word}${prefix}${randPicNum}.svg`
    return { path, word, prefix }
}

function addDraggable(selector) {
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