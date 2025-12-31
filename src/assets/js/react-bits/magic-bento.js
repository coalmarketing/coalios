class MagicBento {
    constructor(container) {
        this.container = container;
        this.cards = Array.from(container.querySelectorAll('.border-gradient'));

        // Spotlight configuration from Data Attributes
        const mode = container.dataset.spotlight || 'both';
        this.enableAmbient = mode === 'both' || mode === 'ambient';
        this.enableBorder = mode === 'both' || mode === 'border';

        this.spotlightRadius = parseInt(container.dataset.radius) || 400;
        this.glowRgb = container.dataset.color || "255, 158, 27";

        // Intensity thresholds
        this.proximity = this.spotlightRadius * 0.5;
        this.fadeDistance = this.spotlightRadius * 0.8;

        this.init();
    }

    init() {
        if (this.enableAmbient) {
            this.createGlobalSpotlight();
        }

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.container.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    createGlobalSpotlight() {
        this.globalSpotlight = document.createElement('div');
        this.globalSpotlight.className = 'global-spotlight';
        document.body.appendChild(this.globalSpotlight);
    }

    updateCard(card, e, intensity) {
        const rect = card.getBoundingClientRect();

        // Calculate relative position within the card for the radial gradient
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--glow-x', `${x}px`);
        card.style.setProperty('--glow-y', `${y}px`);
        card.style.setProperty('--glow-intensity', intensity);
        card.style.setProperty('--glow-radius', `${this.spotlightRadius}px`);
        card.style.setProperty('--glow-rgb', this.glowRgb);
    }

    handleMouseMove(e) {
        const containerRect = this.container.getBoundingClientRect();
        const isInside = (
            e.clientX >= containerRect.left &&
            e.clientX <= containerRect.right &&
            e.clientY >= containerRect.top &&
            e.clientY <= containerRect.bottom
        );

        if (!isInside) {
            this.handleMouseLeave();
            return;
        }

        // 1. Update Global Spotlight Position
        if (this.enableAmbient && this.globalSpotlight) {
            this.globalSpotlight.style.left = `${e.clientX}px`;
            this.globalSpotlight.style.top = `${e.clientY}px`;
            this.globalSpotlight.style.opacity = '1';
        }

        let minDistance = Infinity;

        // 2. Update individual cards
        if (this.enableBorder) {
            this.cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Magic Bento distance formula
                const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(rect.width, rect.height) / 2;
                const effectiveDistance = Math.max(0, distance);

                minDistance = Math.min(minDistance, effectiveDistance);

                let intensity = 0;
                if (effectiveDistance <= this.proximity) {
                    intensity = 1;
                } else if (effectiveDistance <= this.fadeDistance) {
                    intensity = (this.fadeDistance - effectiveDistance) / (this.fadeDistance - this.proximity);
                }

                this.updateCard(card, e, intensity.toFixed(2));
            });
        }

        // Adjust Global Spotlight opacity based on proximity to nearest card
        const globalOpacity = minDistance <= this.proximity
            ? 1
            : minDistance <= this.fadeDistance
                ? (this.fadeDistance - minDistance) / (this.fadeDistance - this.proximity)
                : 0;

        this.globalSpotlight.style.opacity = globalOpacity;
    }

    handleMouseLeave() {
        if (this.globalSpotlight) this.globalSpotlight.style.opacity = '0';
        if (this.enableBorder) {
            this.cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        }
    }
}

// Initialize on your [data-spotlight] containers
document.querySelectorAll('[data-spotlight]').forEach(container => {
    new MagicBento(container);
});