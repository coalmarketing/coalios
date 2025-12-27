import * as THREE from 'three';

const defaultColors = ['#5227FF', '#FF9FFC', '#B19EEF'];

export class LiquidEther {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            mouseForce: 20,
            cursorSize: 100,
            isViscous: false,
            viscous: 30,
            iterationsViscous: 32,
            iterationsPoisson: 32,
            dt: 0.014,
            BFECC: true,
            resolution: 0.5,
            isBounce: false,
            colors: defaultColors,
            autoDemo: true,
            autoSpeed: 0.5,
            autoIntensity: 2.2,
            takeoverDuration: 0.25,
            autoResumeDelay: 1000,
            autoRampDuration: 0.6,
            ...options
        };

        this.rafId = null;
        this.isVisible = true;
        this.init();
    }

    init() {
        // --- Helper: Palette Texture ---
        const makePaletteTexture = (stops) => {
            let arr = (Array.isArray(stops) && stops.length > 0) ? (stops.length === 1 ? [stops[0], stops[0]] : stops) : ['#ffffff', '#ffffff'];
            const w = arr.length;
            const data = new Uint8Array(w * 4);
            for (let i = 0; i < w; i++) {
                const c = new THREE.Color(arr[i]);
                data[i * 4 + 0] = Math.round(c.r * 255);
                data[i * 4 + 1] = Math.round(c.g * 255);
                data[i * 4 + 2] = Math.round(c.b * 255);
                data[i * 4 + 3] = 255;
            }
            const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearFilter;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.generateMipmaps = false;
            tex.needsUpdate = true;
            return tex;
        };

        const paletteTex = makePaletteTexture(this.options.colors);
        const bgVec4 = new THREE.Vector4(0, 0, 0, 0);

        // --- Common Class ---
        const Common = {
            width: 0, height: 0, aspect: 1, pixelRatio: 1,
            renderer: null, clock: null,
            init: (el) => {
                Common.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
                Common.resize(el);
                Common.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                Common.renderer.autoClear = false;
                Common.renderer.setClearColor(new THREE.Color(0x000000), 0);
                Common.renderer.setPixelRatio(Common.pixelRatio);
                Common.renderer.setSize(Common.width, Common.height);

                const canvas = Common.renderer.domElement;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';

                Common.clock = new THREE.Clock();
                Common.clock.start();
            },
            resize: (el) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                Common.width = Math.max(1, Math.floor(rect.width));
                Common.height = Math.max(1, Math.floor(rect.height));
                Common.aspect = Common.width / Common.height;
                if (Common.renderer) Common.renderer.setSize(Common.width, Common.height, false);
            },
            update: () => {
                if (Common.clock) Common.clock.getDelta();
            }
        };

        // --- Mouse Class ---
        const Mouse = {
            coords: new THREE.Vector2(),
            coords_old: new THREE.Vector2(),
            diff: new THREE.Vector2(),
            timer: null,
            isHoverInside: false,
            hasUserControl: false,
            isAutoActive: false,
            autoIntensity: this.options.autoIntensity,
            takeoverActive: false,
            takeoverStartTime: 0,
            takeoverDuration: this.options.takeoverDuration,
            takeoverFrom: new THREE.Vector2(),
            takeoverTo: new THREE.Vector2(),

            init: (el) => {
                window.addEventListener('mousemove', Mouse.onMouseMove);
                window.addEventListener('touchstart', Mouse.onTouchStart, { passive: true });
                window.addEventListener('touchmove', Mouse.onTouchMove, { passive: true });
                window.addEventListener('touchend', Mouse.onTouchEnd);
                document.addEventListener('mouseleave', Mouse.onLeave);
            },
            dispose: () => {
                window.removeEventListener('mousemove', Mouse.onMouseMove);
                window.removeEventListener('touchstart', Mouse.onTouchStart);
                window.removeEventListener('touchmove', Mouse.onTouchMove);
                window.removeEventListener('touchend', Mouse.onTouchEnd);
                document.removeEventListener('mouseleave', Mouse.onLeave);
            },
            updateHoverState: (x, y) => {
                if (!this.container) return false;
                const rect = this.container.getBoundingClientRect();
                Mouse.isHoverInside = (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
                return Mouse.isHoverInside;
            },
            setCoords: (x, y) => {
                if (!this.container) return;
                if (Mouse.timer) clearTimeout(Mouse.timer);
                const rect = this.container.getBoundingClientRect();
                const nx = (x - rect.left) / rect.width;
                const ny = (y - rect.top) / rect.height;
                Mouse.coords.set(nx * 2 - 1, -(ny * 2 - 1));
                Mouse.timer = setTimeout(() => { /* stopped moving */ }, 100);
            },
            setNormalized: (nx, ny) => {
                Mouse.coords.set(nx, ny);
            },
            onMouseMove: (e) => {
                if (!Mouse.updateHoverState(e.clientX, e.clientY)) return;
                if (this.onInteract) this.onInteract();

                if (Mouse.isAutoActive && !Mouse.hasUserControl && !Mouse.takeoverActive) {
                    const rect = this.container.getBoundingClientRect();
                    const nx = (e.clientX - rect.left) / rect.width;
                    const ny = (e.clientY - rect.top) / rect.height;
                    Mouse.takeoverFrom.copy(Mouse.coords);
                    Mouse.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
                    Mouse.takeoverStartTime = performance.now();
                    Mouse.takeoverActive = true;
                    Mouse.hasUserControl = true;
                    Mouse.isAutoActive = false;
                    return;
                }
                Mouse.setCoords(e.clientX, e.clientY);
                Mouse.hasUserControl = true;
            },
            onTouchStart: (e) => {
                if (e.touches.length !== 1) return;
                const t = e.touches[0];
                if (!Mouse.updateHoverState(t.clientX, t.clientY)) return;
                if (this.onInteract) this.onInteract();
                Mouse.setCoords(t.clientX, t.clientY);
                Mouse.hasUserControl = true;
            },
            onTouchMove: (e) => {
                if (e.touches.length !== 1) return;
                const t = e.touches[0];
                if (!Mouse.updateHoverState(t.clientX, t.clientY)) return;
                if (this.onInteract) this.onInteract();
                Mouse.setCoords(t.clientX, t.clientY);
            },
            onTouchEnd: () => { Mouse.isHoverInside = false; },
            onLeave: () => { Mouse.isHoverInside = false; },
            update: () => {
                if (Mouse.takeoverActive) {
                    const t = (performance.now() - Mouse.takeoverStartTime) / (Mouse.takeoverDuration * 1000);
                    if (t >= 1) {
                        Mouse.takeoverActive = false;
                        Mouse.coords.copy(Mouse.takeoverTo);
                        Mouse.coords_old.copy(Mouse.coords);
                        Mouse.diff.set(0, 0);
                    } else {
                        const k = t * t * (3 - 2 * t);
                        Mouse.coords.copy(Mouse.takeoverFrom).lerp(Mouse.takeoverTo, k);
                    }
                }
                Mouse.diff.subVectors(Mouse.coords, Mouse.coords_old);
                Mouse.coords_old.copy(Mouse.coords);
                if (Mouse.coords_old.x === 0 && Mouse.coords_old.y === 0) Mouse.diff.set(0, 0);
                if (Mouse.isAutoActive && !Mouse.takeoverActive) Mouse.diff.multiplyScalar(Mouse.autoIntensity);
            }
        };

        // --- AutoDriver Class ---
        class AutoDriver {
            constructor(mouse, opts) {
                this.mouse = mouse;
                this.enabled = opts.enabled;
                this.speed = opts.speed;
                this.resumeDelay = opts.resumeDelay;
                this.rampDurationMs = opts.rampDuration * 1000;
                this.active = false;
                this.current = new THREE.Vector2(0, 0);
                this.target = new THREE.Vector2();
                this.lastTime = performance.now();
                this.activationTime = 0;
                this.margin = 0.2;
                this._tmpDir = new THREE.Vector2();
                this.pickNewTarget();
            }
            pickNewTarget() {
                const r = Math.random;
                this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
            }
            forceStop() {
                this.active = false;
                this.mouse.isAutoActive = false;
            }
            update(lastInteraction) {
                if (!this.enabled) return;
                const now = performance.now();
                const idle = now - lastInteraction;

                if (idle < this.resumeDelay) {
                    if (this.active) this.forceStop();
                    return;
                }
                if (this.mouse.isHoverInside) {
                    if (this.active) this.forceStop();
                    return;
                }
                if (!this.active) {
                    this.active = true;
                    this.current.copy(this.mouse.coords);
                    this.lastTime = now;
                    this.activationTime = now;
                }
                if (!this.active) return;

                this.mouse.isAutoActive = true;
                let dtSec = (now - this.lastTime) / 1000;
                this.lastTime = now;
                if (dtSec > 0.2) dtSec = 0.016;

                const dir = this._tmpDir.subVectors(this.target, this.current);
                const dist = dir.length();
                if (dist < 0.01) {
                    this.pickNewTarget();
                    return;
                }
                dir.normalize();
                let ramp = 1;
                if (this.rampDurationMs > 0) {
                    const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
                    ramp = t * t * (3 - 2 * t);
                }
                const step = this.speed * dtSec * ramp;
                const move = Math.min(step, dist);
                this.current.addScaledVector(dir, move);
                this.mouse.setNormalized(this.current.x, this.current.y);
            }
        }

        // --- Shaders ---
        const face_vert = `attribute vec3 position; uniform vec2 px; uniform vec2 boundarySpace; varying vec2 uv; void main(){ vec3 pos = position; vec2 scale = 1.0 - boundarySpace * 2.0; pos.xy = pos.xy * scale; uv = vec2(0.5)+(pos.xy)*0.5; gl_Position = vec4(pos, 1.0); }`;
        const line_vert = `attribute vec3 position; uniform vec2 px; varying vec2 uv; void main(){ vec3 pos = position; uv = 0.5 + pos.xy * 0.5; vec2 n = sign(pos.xy); pos.xy = abs(pos.xy) - px * 1.0; pos.xy *= n; gl_Position = vec4(pos, 1.0); }`;
        const mouse_vert = `attribute vec3 position; attribute vec2 uv; uniform vec2 center; uniform vec2 scale; uniform vec2 px; varying vec2 vUv; void main(){ vec2 pos = position.xy * scale * 2.0 * px + center; vUv = uv; gl_Position = vec4(pos, 0.0, 1.0); }`;
        const advection_frag = `precision highp float; uniform sampler2D velocity; uniform float dt; uniform bool isBFECC; uniform vec2 fboSize; uniform vec2 px; varying vec2 uv; void main(){ vec2 ratio = max(fboSize.x, fboSize.y) / fboSize; if(isBFECC == false){ vec2 vel = texture2D(velocity, uv).xy; vec2 uv2 = uv - vel * dt * ratio; vec2 newVel = texture2D(velocity, uv2).xy; gl_FragColor = vec4(newVel, 0.0, 0.0); } else { vec2 spot_new = uv; vec2 vel_old = texture2D(velocity, uv).xy; vec2 spot_old = spot_new - vel_old * dt * ratio; vec2 vel_new1 = texture2D(velocity, spot_old).xy; vec2 spot_new2 = spot_old + vel_new1 * dt * ratio; vec2 error = spot_new2 - spot_new; vec2 spot_new3 = spot_new - error / 2.0; vec2 vel_2 = texture2D(velocity, spot_new3).xy; vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio; vec2 newVel2 = texture2D(velocity, spot_old2).xy; gl_FragColor = vec4(newVel2, 0.0, 0.0); } }`;
        const color_frag = `precision highp float; uniform sampler2D velocity; uniform sampler2D palette; uniform vec4 bgColor; varying vec2 uv; void main(){ vec2 vel = texture2D(velocity, uv).xy; float lenv = clamp(length(vel), 0.0, 1.0); vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb; vec3 outRGB = mix(bgColor.rgb, c, lenv); float outA = mix(bgColor.a, 1.0, lenv); gl_FragColor = vec4(outRGB, outA); }`;
        const divergence_frag = `precision highp float; uniform sampler2D velocity; uniform float dt; uniform vec2 px; varying vec2 uv; void main(){ float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x; float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x; float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y; float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y; float divergence = (x1 - x0 + y1 - y0) / 2.0; gl_FragColor = vec4(divergence / dt); }`;
        const externalForce_frag = `precision highp float; uniform vec2 force; uniform vec2 center; uniform vec2 scale; uniform vec2 px; varying vec2 vUv; void main(){ vec2 circle = (vUv - 0.5) * 2.0; float d = 1.0 - min(length(circle), 1.0); d *= d; gl_FragColor = vec4(force * d, 0.0, 1.0); }`;
        const poisson_frag = `precision highp float; uniform sampler2D pressure; uniform sampler2D divergence; uniform vec2 px; varying vec2 uv; void main(){ float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r; float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r; float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r; float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r; float div = texture2D(divergence, uv).r; float newP = (p0 + p1 + p2 + p3) / 4.0 - div; gl_FragColor = vec4(newP); }`;
        const pressure_frag = `precision highp float; uniform sampler2D pressure; uniform sampler2D velocity; uniform vec2 px; uniform float dt; varying vec2 uv; void main(){ float step = 1.0; float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r; float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r; float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r; float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r; vec2 v = texture2D(velocity, uv).xy; vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5; v = v - gradP * dt; gl_FragColor = vec4(v, 0.0, 1.0); }`;
        const viscous_frag = `precision highp float; uniform sampler2D velocity; uniform sampler2D velocity_new; uniform float v; uniform vec2 px; uniform float dt; varying vec2 uv; void main(){ vec2 old = texture2D(velocity, uv).xy; vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy; vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy; vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy; vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy; vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3); newv /= 4.0 * (1.0 + v * dt); gl_FragColor = vec4(newv, 0.0, 0.0); }`;

        // --- ShaderPass Helper ---
        class ShaderPass {
            constructor(props) {
                this.props = props;
                this.uniforms = props.material?.uniforms;
                this.scene = new THREE.Scene();
                this.camera = new THREE.Camera();
                if (this.uniforms) {
                    this.material = new THREE.RawShaderMaterial(props.material);
                    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
                    this.scene.add(this.plane);
                }
            }
            update() {
                Common.renderer.setRenderTarget(this.props.output || null);
                Common.renderer.render(this.scene, this.camera);
                Common.renderer.setRenderTarget(null);
            }
        }

        // --- Simulation Classes ---
        class Advection extends ShaderPass {
            constructor(simProps) {
                super({
                    material: {
                        vertexShader: face_vert, fragmentShader: advection_frag, uniforms: {
                            boundarySpace: { value: simProps.cellScale }, px: { value: simProps.cellScale },
                            fboSize: { value: simProps.fboSize }, velocity: { value: simProps.src.texture },
                            dt: { value: simProps.dt }, isBFECC: { value: true }
                        }
                    },
                    output: simProps.dst
                });
                this.initBoundary();
            }
            initBoundary() {
                const boundaryG = new THREE.BufferGeometry();
                const vertices = new Float32Array([-1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0]);
                boundaryG.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                const boundaryM = new THREE.RawShaderMaterial({ vertexShader: line_vert, fragmentShader: advection_frag, uniforms: this.uniforms });
                this.line = new THREE.LineSegments(boundaryG, boundaryM);
                this.scene.add(this.line);
            }
            update({ dt, isBounce, BFECC }) {
                this.uniforms.dt.value = dt;
                this.line.visible = isBounce;
                this.uniforms.isBFECC.value = BFECC;
                super.update();
            }
        }

        class ExternalForce extends ShaderPass {
            constructor(simProps) {
                super({ output: simProps.dst });
                const mouseG = new THREE.PlaneGeometry(1, 1);
                const mouseM = new THREE.RawShaderMaterial({
                    vertexShader: mouse_vert, fragmentShader: externalForce_frag,
                    blending: THREE.AdditiveBlending, depthWrite: false,
                    uniforms: {
                        px: { value: simProps.cellScale },
                        force: { value: new THREE.Vector2(0, 0) },
                        center: { value: new THREE.Vector2(0, 0) },
                        // FIX: changed cursor_size to cursorSize
                        scale: { value: new THREE.Vector2(simProps.cursorSize, simProps.cursorSize) }
                    }
                });
                this.mouse = new THREE.Mesh(mouseG, mouseM);
                this.scene.add(this.mouse);
            }
            update(props) {
                // FIX: changed mouse_force to mouseForce
                const forceX = (Mouse.diff.x / 2) * props.mouseForce;
                const forceY = (Mouse.diff.y / 2) * props.mouseForce;

                // FIX: changed cursor_size to cursorSize
                const cursorSizeX = props.cursorSize * props.cellScale.x;
                const cursorSizeY = props.cursorSize * props.cellScale.y;

                const centerX = Math.min(Math.max(Mouse.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
                const centerY = Math.min(Math.max(Mouse.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);

                this.mouse.material.uniforms.force.value.set(forceX, forceY);
                this.mouse.material.uniforms.center.value.set(centerX, centerY);

                // FIX: changed cursor_size to cursorSize
                this.mouse.material.uniforms.scale.value.set(props.cursorSize, props.cursorSize);
                super.update();
            }
        }

        class Viscous extends ShaderPass {
            constructor(simProps) {
                super({
                    material: {
                        vertexShader: face_vert, fragmentShader: viscous_frag, uniforms: {
                            boundarySpace: { value: simProps.boundarySpace }, velocity: { value: simProps.src.texture },
                            velocity_new: { value: simProps.dst_.texture }, v: { value: simProps.viscous },
                            px: { value: simProps.cellScale }, dt: { value: simProps.dt }
                        }
                    },
                    output: simProps.dst, output0: simProps.dst_, output1: simProps.dst
                });
            }
            update({ viscous, iterations, dt }) {
                this.uniforms.v.value = viscous;
                this.uniforms.dt.value = dt;
                let fbo_in, fbo_out;
                for (let i = 0; i < iterations; i++) {
                    if (i % 2 === 0) { fbo_in = this.props.output0; fbo_out = this.props.output1; }
                    else { fbo_in = this.props.output1; fbo_out = this.props.output0; }
                    this.uniforms.velocity_new.value = fbo_in.texture;
                    this.props.output = fbo_out;
                    super.update();
                }
                return fbo_out;
            }
        }

        class Divergence extends ShaderPass {
            constructor(simProps) {
                super({
                    material: {
                        vertexShader: face_vert, fragmentShader: divergence_frag, uniforms: {
                            boundarySpace: { value: simProps.boundarySpace }, velocity: { value: simProps.src.texture },
                            px: { value: simProps.cellScale }, dt: { value: simProps.dt }
                        }
                    },
                    output: simProps.dst
                });
            }
            update({ vel }) {
                this.uniforms.velocity.value = vel.texture;
                super.update();
            }
        }

        class Poisson extends ShaderPass {
            constructor(simProps) {
                super({
                    material: {
                        vertexShader: face_vert, fragmentShader: poisson_frag, uniforms: {
                            boundarySpace: { value: simProps.boundarySpace }, pressure: { value: simProps.dst_.texture },
                            divergence: { value: simProps.src.texture }, px: { value: simProps.cellScale }
                        }
                    },
                    output: simProps.dst, output0: simProps.dst_, output1: simProps.dst
                });
            }
            update({ iterations }) {
                let p_in, p_out;
                for (let i = 0; i < iterations; i++) {
                    if (i % 2 === 0) { p_in = this.props.output0; p_out = this.props.output1; }
                    else { p_in = this.props.output1; p_out = this.props.output0; }
                    this.uniforms.pressure.value = p_in.texture;
                    this.props.output = p_out;
                    super.update();
                }
                return p_out;
            }
        }

        class Pressure extends ShaderPass {
            constructor(simProps) {
                super({
                    material: {
                        vertexShader: face_vert, fragmentShader: pressure_frag, uniforms: {
                            boundarySpace: { value: simProps.boundarySpace }, pressure: { value: simProps.src_p.texture },
                            velocity: { value: simProps.src_v.texture }, px: { value: simProps.cellScale }, dt: { value: simProps.dt }
                        }
                    },
                    output: simProps.dst
                });
            }
            update({ vel, pressure }) {
                this.uniforms.velocity.value = vel.texture;
                this.uniforms.pressure.value = pressure.texture;
                super.update();
            }
        }

        // --- Main Simulation Manager ---
        class Simulation {
            constructor(opts) {
                this.options = opts;
                this.fboSize = new THREE.Vector2();
                this.cellScale = new THREE.Vector2();
                this.boundarySpace = new THREE.Vector2();
                this.fbos = {};

                const type = (/(iPad|iPhone|iPod)/i.test(navigator.userAgent)) ? THREE.HalfFloatType : THREE.FloatType;
                const fboOpts = { type, depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
                ['vel_0', 'vel_1', 'vel_viscous0', 'vel_viscous1', 'div', 'pressure_0', 'pressure_1'].forEach(k => {
                    this.fbos[k] = new THREE.WebGLRenderTarget(1, 1, fboOpts);
                });
                this.init();
            }
            init() {
                this.calcSize();
                this.resize();
                this.advection = new Advection({ cellScale: this.cellScale, fboSize: this.fboSize, dt: this.options.dt, src: this.fbos.vel_0, dst: this.fbos.vel_1 });

                // FIX: passed cursorSize instead of cursor_size
                this.externalForce = new ExternalForce({ cellScale: this.cellScale, cursorSize: this.options.cursorSize, dst: this.fbos.vel_1 });

                this.viscous = new Viscous({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, viscous: this.options.viscous, src: this.fbos.vel_1, dst: this.fbos.vel_viscous1, dst_: this.fbos.vel_viscous0, dt: this.options.dt });
                this.divergence = new Divergence({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.vel_viscous0, dst: this.fbos.div, dt: this.options.dt });
                this.poisson = new Poisson({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.div, dst: this.fbos.pressure_1, dst_: this.fbos.pressure_0 });
                this.pressure = new Pressure({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src_p: this.fbos.pressure_0, src_v: this.fbos.vel_viscous0, dst: this.fbos.vel_0, dt: this.options.dt });
            }
            calcSize() {
                const width = Math.max(1, Math.round(this.options.resolution * Common.width));
                const height = Math.max(1, Math.round(this.options.resolution * Common.height));
                this.cellScale.set(1 / width, 1 / height);
                this.fboSize.set(width, height);
            }
            resize() {
                this.calcSize();
                Object.values(this.fbos).forEach(fbo => fbo.setSize(this.fboSize.x, this.fboSize.y));
            }
            update() {
                if (this.options.isBounce) this.boundarySpace.set(0, 0); else this.boundarySpace.copy(this.cellScale);

                this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC });

                // FIX: Updated property names to camelCase
                this.externalForce.update({ cursorSize: this.options.cursorSize, mouseForce: this.options.mouseForce, cellScale: this.cellScale });

                let vel = this.fbos.vel_1;
                if (this.options.isViscous) {
                    // FIX: Updated property name to camelCase
                    vel = this.viscous.update({ viscous: this.options.viscous, iterations: this.options.iterationsViscous, dt: this.options.dt });
                }
                this.divergence.update({ vel });

                // FIX: This was the main crash. Updated property name to camelCase (iterationsPoisson)
                const pressure = this.poisson.update({ iterations: this.options.iterationsPoisson });

                this.pressure.update({ vel, pressure });
            }
        }

        // --- Wiring it up ---
        Common.init(this.container);
        Mouse.init(this.container);
        this.container.appendChild(Common.renderer.domElement);

        const simulation = new Simulation(this.options);
        const outputMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.RawShaderMaterial({
                vertexShader: face_vert, fragmentShader: color_frag, transparent: true, depthWrite: false,
                uniforms: { velocity: { value: simulation.fbos.vel_0.texture }, boundarySpace: { value: new THREE.Vector2() }, palette: { value: paletteTex }, bgColor: { value: bgVec4 } }
            })
        );
        const scene = new THREE.Scene();
        scene.add(outputMesh);
        const camera = new THREE.Camera();

        this.lastUserInteraction = performance.now();
        this.onInteract = () => { this.lastUserInteraction = performance.now(); if (autoDriver) autoDriver.forceStop(); };

        const autoDriver = new AutoDriver(Mouse, { enabled: this.options.autoDemo, speed: this.options.autoSpeed, resumeDelay: this.options.autoResumeDelay, rampDuration: this.options.autoRampDuration });

        const loop = () => {
            if (!this.rafId) return;
            autoDriver.update(this.lastUserInteraction);
            Mouse.update();
            Common.update();
            simulation.update();
            Common.renderer.setRenderTarget(null);
            Common.renderer.render(scene, camera);
            this.rafId = requestAnimationFrame(loop);
        };

        // Public methods on the instance
        this.start = () => { if (!this.rafId) { this.rafId = requestAnimationFrame(loop); } };
        this.stop = () => { if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; } };
        this.resize = () => { Common.resize(this.container); simulation.resize(); };
        this.destroy = () => {
            this.stop();
            window.removeEventListener('resize', this.resize);
            Mouse.dispose();
            if (Common.renderer && Common.renderer.domElement && this.container.contains(Common.renderer.domElement)) {
                this.container.removeChild(Common.renderer.domElement);
            }
            Common.renderer.dispose();
        };

        // Start
        window.addEventListener('resize', () => { requestAnimationFrame(this.resize); });
        this.start();
    }
}