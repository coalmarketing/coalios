import { Renderer, Triangle, Program, Mesh } from 'ogl';

export class Prism {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            height: 3.5,
            baseWidth: 5.5,
            animationType: 'rotate', // 'rotate' | 'hover' | '3drotate'
            glow: 1,
            offset: { x: 0, y: 0 },
            noise: 0.5,
            transparent: true,
            scale: 3.6,
            hueShift: 0,
            colorFrequency: 1,
            hoverStrength: 2,
            inertia: 0.05,
            bloom: 1,
            suspendWhenOffscreen: false,
            timeScale: 0.5,
            ...options
        };

        this.rafId = null;
        this.ro = null;
        this.io = null;
        this.renderer = null;
        this.gl = null;
        this.mesh = null;
        this.program = null;

        // Animation state
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;
        this.pointer = { x: 0, y: 0, inside: false };
        this.startTime = performance.now();

        // Helper buffers
        this.rotBuf = new Float32Array(9);
        this.iResBuf = new Float32Array(2);
        this.offsetPxBuf = new Float32Array(2);

        // Random rotation parameters for 3drotate mode
        const rnd = () => Math.random();
        this.wX = (0.3 + rnd() * 0.6) * 1;
        this.wY = (0.2 + rnd() * 0.7) * 1;
        this.wZ = (0.1 + rnd() * 0.5) * 1;
        this.phX = rnd() * Math.PI * 2;
        this.phZ = rnd() * Math.PI * 2;

        this.init();
    }

    init() {
        const {
            height, baseWidth, glow, noise, offset, transparent, scale,
            hueShift, colorFrequency, bloom, timeScale
        } = this.options;

        const H = Math.max(0.001, height);
        const BW = Math.max(0.001, baseWidth);
        const BASE_HALF = BW * 0.5;
        const GLOW = Math.max(0.0, glow);
        const NOISE = Math.max(0.0, noise);
        const offX = offset?.x ?? 0;
        const offY = offset?.y ?? 0;
        const SAT = transparent ? 1.5 : 1;
        const SCALE = Math.max(0.001, scale);
        const HUE = hueShift || 0;
        const CFREQ = Math.max(0.0, colorFrequency || 1);
        const BLOOM = Math.max(0.0, bloom || 1);
        const TS = Math.max(0, timeScale || 1);

        this.dpr = Math.min(1.5, window.devicePixelRatio || 1);

        // 1. Setup Renderer
        this.renderer = new Renderer({
            dpr: this.dpr,
            alpha: transparent,
            antialias: false
        });
        this.gl = this.renderer.gl;
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        Object.assign(gl.canvas.style, {
            position: 'absolute',
            inset: '0',
            width: '100%',
            height: '100%',
            display: 'block'
        });
        this.container.appendChild(gl.canvas);

        // 2. Shaders
        const vertex = /* glsl */ `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            uniform vec2  iResolution;
            uniform float iTime;
            uniform float uHeight;
            uniform float uBaseHalf;
            uniform mat3  uRot;
            uniform int   uUseBaseWobble;
            uniform float uGlow;
            uniform vec2  uOffsetPx;
            uniform float uNoise;
            uniform float uSaturation;
            uniform float uScale;
            uniform float uHueShift;
            uniform float uColorFreq;
            uniform float uBloom;
            uniform float uCenterShift;
            uniform float uInvBaseHalf;
            uniform float uInvHeight;
            uniform float uMinAxis;
            uniform float uPxScale;
            uniform float uTimeScale;

            vec4 tanh4(vec4 x){
                vec4 e2x = exp(2.0*x);
                return (e2x - 1.0) / (e2x + 1.0);
            }
            float rand(vec2 co){
                return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            float sdOctaAnisoInv(vec3 p){
                vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
                float m = q.x + q.y + q.z - 1.0;
                return m * uMinAxis * 0.5773502691896258;
            }
            float sdPyramidUpInv(vec3 p){
                float oct = sdOctaAnisoInv(p);
                float halfSpace = -p.y;
                return max(oct, halfSpace);
            }
            mat3 hueRotation(float a){
                float c = cos(a), s = sin(a);
                mat3 W = mat3(0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114);
                mat3 U = mat3(0.701, -0.587, -0.114, -0.299, 0.413, -0.114, -0.300, -0.588, 0.886);
                mat3 V = mat3(0.168, -0.331, 0.500, 0.328, 0.035, -0.500, -0.497, 0.296, 0.201);
                return W + U * c + V * s;
            }
            void main(){
                vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;
                float z = 5.0;
                float d = 0.0;
                vec3 p;
                vec4 o = vec4(0.0);
                float centerShift = uCenterShift;
                float cf = uColorFreq;
                mat2 wob = mat2(1.0);
                if (uUseBaseWobble == 1) {
                    float t = iTime * uTimeScale;
                    float c0 = cos(t + 0.0);
                    float c1 = cos(t + 33.0);
                    float c2 = cos(t + 11.0);
                    wob = mat2(c0, c1, c2, c0);
                }
                const int STEPS = 100;
                for (int i = 0; i < STEPS; i++) {
                    p = vec3(f, z);
                    p.xz = p.xz * wob;
                    p = uRot * p;
                    vec3 q = p;
                    q.y += centerShift;
                    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
                    z -= d;
                    o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
                }
                o = tanh4(o * o * (uGlow * uBloom) / 1e5);
                vec3 col = o.rgb;
                float n = rand(gl_FragCoord.xy + vec2(iTime));
                col += (n - 0.5) * uNoise;
                col = clamp(col, 0.0, 1.0);
                float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
                col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);
                if(abs(uHueShift) > 0.0001){
                    col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
                }
                gl_FragColor = vec4(col, o.a);
            }
        `;

        // 3. Geometry & Program
        const geometry = new Triangle(gl);

        // Pre-calculate buffers for resize
        this.offsetPxBuf[0] = offX * this.dpr;
        this.offsetPxBuf[1] = offY * this.dpr;

        this.program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                iResolution: { value: this.iResBuf },
                iTime: { value: 0 },
                uHeight: { value: H },
                uBaseHalf: { value: BASE_HALF },
                uUseBaseWobble: { value: 1 },
                uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
                uGlow: { value: GLOW },
                uOffsetPx: { value: this.offsetPxBuf },
                uNoise: { value: NOISE },
                uSaturation: { value: SAT },
                uScale: { value: SCALE },
                uHueShift: { value: HUE },
                uColorFreq: { value: CFREQ },
                uBloom: { value: BLOOM },
                uCenterShift: { value: H * 0.25 },
                uInvBaseHalf: { value: 1 / BASE_HALF },
                uInvHeight: { value: 1 / H },
                uMinAxis: { value: Math.min(BASE_HALF, H) },
                uPxScale: { value: 1 }, // updated in resize
                uTimeScale: { value: TS }
            }
        });

        this.mesh = new Mesh(gl, { geometry, this: this.program, program: this.program });

        // 4. Event Listeners & Logic
        this.setupEvents();

        // 5. Resize Observer
        this.resize = this.resize.bind(this);
        this.ro = new ResizeObserver(this.resize);
        this.ro.observe(this.container);
        this.resize();

        // 6. Start Loop
        this.animate = this.animate.bind(this);
        if (this.options.suspendWhenOffscreen) {
            this.io = new IntersectionObserver((entries) => {
                if (entries.some(e => e.isIntersecting)) {
                    this.start();
                } else {
                    this.stop();
                }
            });
            this.io.observe(this.container);
        } else {
            this.start();
        }
    }

    setupEvents() {
        if (this.options.animationType === 'hover') {
            this.onPointerMove = (e) => {
                const ww = Math.max(1, window.innerWidth);
                const wh = Math.max(1, window.innerHeight);
                const cx = ww * 0.5;
                const cy = wh * 0.5;
                const nx = (e.clientX - cx) / (ww * 0.5);
                const ny = (e.clientY - cy) / (wh * 0.5);
                this.pointer.x = Math.max(-1, Math.min(1, nx));
                this.pointer.y = Math.max(-1, Math.min(1, ny));
                this.pointer.inside = true;
                this.start(); // Ensure loop is running when moving
            };
            this.onLeave = () => { this.pointer.inside = false; };

            window.addEventListener('pointermove', this.onPointerMove, { passive: true });
            window.addEventListener('mouseleave', this.onLeave);
            window.addEventListener('blur', this.onLeave);
            this.program.uniforms.uUseBaseWobble.value = 0;
        } else if (this.options.animationType === '3drotate') {
            this.program.uniforms.uUseBaseWobble.value = 0;
        } else {
            this.program.uniforms.uUseBaseWobble.value = 1;
        }
    }

    resize() {
        const w = this.container.clientWidth || 1;
        const h = this.container.clientHeight || 1;
        this.renderer.setSize(w, h);
        this.iResBuf[0] = this.gl.drawingBufferWidth;
        this.iResBuf[1] = this.gl.drawingBufferHeight;

        // Re-calculate scale uniform based on new height
        const SCALE = Math.max(0.001, this.options.scale);
        this.program.uniforms.uPxScale.value = 1 / ((this.gl.drawingBufferHeight || 1) * 0.1 * SCALE);
    }

    setMat3FromEuler(yaw, pitch, roll, out) {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const cx = Math.cos(pitch), sx = Math.sin(pitch);
        const cz = Math.cos(roll), sz = Math.sin(roll);

        const r00 = cy * cz + sy * sx * sz;
        const r01 = -cy * sz + sy * sx * cz;
        const r02 = sy * cx;

        const r10 = cx * sz;
        const r11 = cx * cz;
        const r12 = -sx;

        const r20 = -sy * cz + cy * sx * sz;
        const r21 = sy * sz + cy * sx * cz;
        const r22 = cy * cx;

        out[0] = r00; out[1] = r10; out[2] = r20;
        out[3] = r01; out[4] = r11; out[5] = r21;
        out[6] = r02; out[7] = r12; out[8] = r22;
        return out;
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    animate(t) {
        this.rafId = requestAnimationFrame(this.animate);

        const time = (t - this.startTime) * 0.001;
        this.program.uniforms.iTime.value = time;

        const { animationType, hoverStrength, inertia, timeScale } = this.options;
        const TS = Math.max(0, timeScale || 1);

        if (animationType === 'hover') {
            const HOVSTR = Math.max(0, hoverStrength || 1);
            const INERT = Math.max(0, Math.min(1, inertia || 0.12));

            const maxPitch = 0.6 * HOVSTR;
            const maxYaw = 0.6 * HOVSTR;

            this.targetYaw = (this.pointer.inside ? -this.pointer.x : 0) * maxYaw;
            this.targetPitch = (this.pointer.inside ? this.pointer.y : 0) * maxPitch;

            this.yaw = this.lerp(this.yaw, this.targetYaw, INERT);
            this.pitch = this.lerp(this.pitch, this.targetPitch, INERT);
            this.roll = this.lerp(this.roll, 0, 0.1);

            this.program.uniforms.uRot.value = this.setMat3FromEuler(this.yaw, this.pitch, this.roll, this.rotBuf);
        }
        else if (animationType === '3drotate') {
            const tScaled = time * TS;
            this.yaw = tScaled * this.wY;
            this.pitch = Math.sin(tScaled * this.wX + this.phX) * 0.6;
            this.roll = Math.sin(tScaled * this.wZ + this.phZ) * 0.5;
            this.program.uniforms.uRot.value = this.setMat3FromEuler(this.yaw, this.pitch, this.roll, this.rotBuf);
        }
        else {
            // "rotate" (wobble) mode uses the Identity matrix here, 
            // rotation is handled inside the shader via uUseBaseWobble
            this.rotBuf.fill(0);
            this.rotBuf[0] = 1; this.rotBuf[4] = 1; this.rotBuf[8] = 1;
            this.program.uniforms.uRot.value = this.rotBuf;
        }

        this.renderer.render({ scene: this.mesh });
    }

    start() {
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(this.animate);
        }
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    destroy() {
        this.stop();
        if (this.ro) this.ro.disconnect();
        if (this.io) this.io.disconnect();

        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('mouseleave', this.onLeave);
        window.removeEventListener('blur', this.onLeave);

        if (this.gl && this.gl.canvas.parentElement === this.container) {
            this.container.removeChild(this.gl.canvas);
        }
        // Optional: Lose context if needed, though usually not required for simple pages
        // this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}