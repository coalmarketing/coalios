// Cards spotlight
class Spotlight {
    constructor(containerElement) {
        this.container = containerElement;
        this.cards = Array.from(this.container.children);
        this.mouse = {
            x: 0,
            y: 0,
        };
        this.containerSize = {
            w: 0,
            h: 0,
        };
        this.initContainer = this.initContainer.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.init();
    }

    initContainer() {
        this.containerSize.w = this.container.offsetWidth;
        this.containerSize.h = this.container.offsetHeight;
    }

    onMouseMove(event) {
        const { clientX, clientY } = event;
        const rect = this.container.getBoundingClientRect();
        const { w, h } = this.containerSize;
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const inside = x < w && x > 0 && y < h && y > 0;
        if (inside) {
            this.mouse.x = x;
            this.mouse.y = y;
            this.cards.forEach((card) => {
                const cardX = -(card.getBoundingClientRect().left - rect.left) + this.mouse.x;
                const cardY = -(card.getBoundingClientRect().top - rect.top) + this.mouse.y;
                card.style.setProperty('--mouse-x', `${cardX}px`);
                card.style.setProperty('--mouse-y', `${cardY}px`);
            });
        }

        this.cards.forEach((card) => {
            const rect = card.getBoundingClientRect();

            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const distances = {
                left: x,
                right: rect.width - x,
                top: y,
                bottom: rect.height - y,
            };

            const closestSide = Object.entries(distances)
                .sort((a, b) => a[1] - b[1])[0][0];

            const angleMap = {
                top: "180deg",
                right: "270deg",
                bottom: "0deg",
                left: "90deg",
            };

            card.style.setProperty("--border-angle", angleMap[closestSide]);
        });
    }

    init() {
        this.initContainer();
        window.addEventListener('resize', this.initContainer);
        window.addEventListener('mousemove', this.onMouseMove);
    }
}

// Init Spotlight
const spotlights = document.querySelectorAll('[data-spotlight]');
spotlights.forEach((spotlight) => {
    new Spotlight(spotlight);
});