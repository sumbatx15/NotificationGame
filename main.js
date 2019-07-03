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

        }
    });

document.addEventListener('mouseup', ({ target }) => {
    const item = notifications.find(item => item.el == target)
    if (item) {
        const isCollecting = item.el.dataset.x < item.startingPosition.x
        const { word, quality } = item.el.dataset

        if (isCollecting && quality == 'Good') bars[word].percent += 5
        if (isCollecting && quality == 'Bad') bars[word].percent -= 5
        if (!isCollecting && quality == 'Bad') bars[word].percent += 2

        item.el.style.opacity = 0;
        item.el.style.pointerEvents = 'none';
    }
})


const NOT_CONTAINER_SELECTOR = '.notification-container'
const BARS_START_TRANSITION = 'width 500ms cubic-bezier(.61,.17,.52,1.22)'
const BARS_NORMAL_TRANSITION = 'width 500ms'
const STARTING_PERCENT = 15;

const words = ['growth', 'esteem', 'belong', 'safety', 'energy']
const notifications = [];
const bars = getTextBars();
let notificationsIntervar = 0;

window.onload = () => {
    restartGame();
}
function restartGame() {
    clearNotContaier();
    animateGameBars(100);
    setTimeout(() => {
        animateGameBars(STARTING_PERCENT);
    }, 500);

    clearInterval(notificationsIntervar);
    notificationsIntervar = setInterval(() => {
        addDraggable();
    }, 1000);
}

function getTextBars() {
    return words.reduce((bars, word) => {
        bars[word] = {
            el: document.querySelector(`#${word}-bar`),
            _percent: 100,
            isStarting: true,
            get percent() {
                return this._percent;
            },
            set percent(percent) {
                this._percent = percent
                this.el.style.transition = this.isStarting ? BARS_START_TRANSITION : BARS_NORMAL_TRANSITION;
                this.el.style.width = `${percent}%`
            }
        }
        return bars;
    }, {})
}

function animateGameBars(percent) {
    words.forEach(word => {
        bars[word].percent = percent;
    })
}

const imgSrcs = ['growthGood6.png', 'esteemBad1.png']


function addDraggable() {
    const prefix = rand(0, 10) > 3 ? 'Good' : 'Bad'
    const randPicNum = rand(1, words.length);
    const word = words[rand(0, words.length)]
    const picName = `assets/notifications/${word}/${word}${prefix}${randPicNum}.svg`
    const [x, y] = [rand(100, 1500), rand(100, 700)]

    const el = document.createElement('div')
    el.className = 'draggable'
    el.style.transform = `translate(${x}px, ${y}px)`
    el.dataset.word = word;
    el.dataset.quality = prefix;
    el.dataset.x = x;
    el.dataset.y = y;
    el.innerHTML = `<img src="${picName}" />`

    const item = {
        startingPosition: { x, y },
        el: el
    }

    notifications.push(item)
    document.querySelector(NOT_CONTAINER_SELECTOR).appendChild(el)
}

function clearNotContaier() {
    document.querySelector(NOT_CONTAINER_SELECTOR).innerHTML = ''
}