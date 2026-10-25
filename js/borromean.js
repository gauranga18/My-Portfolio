/*
 * Borromean rings built as triangulated truss tubes, drawn on a 2D canvas.
 *
 * The three centerlines are mutually orthogonal ellipses, which is the classic
 * construction of the Borromean rings: no two rings are linked, yet all three
 * together cannot be separated.
 */
(() => {
    "use strict";

    const canvas = document.getElementById("borromean-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------------------------------------------------------------------------
    // Settings
    // ---------------------------------------------------------------------------
    const CFG = {
        segments: 72,       // bays around each ring (keep even so the pattern closes)
sides: 6,           // nodes per cross-section
 semiMajor: 1.0,     // ellipse long radius
 semiMinor: 0.5,     // ellipse short radius (must be < semiMajor)
tube: 0.085,        // truss tube radius
 camDist: 5,         // perspective strength (smaller = stronger)
fit: 0.44,          // fraction of the canvas the model fills
 nodeRadius: 2.2,    // node size in px at a 900px canvas
 roll: 0.2,          // fixed tilt
 spinYaw: 0.0035,    // idle auto-rotation per 60fps frame
 spinPitch: 0.0012,
 waveSpeed: 0.12,    // light pulses travelling along the rings (laps/second)
waveTail: 0.14,     // pulse length as a fraction of the ring
 slideSpeed: 0.05,   // truss spins along the rings, opposite to the light (laps/second)
depthBuckets: 24,   // precomputed depth shades for struts
    };

    // Monochrome palette: warm "dial" paper, printed in three tones of ink.
    const PAPER = "FF206E";
    const INK = "#fff";

    const RINGS = [
        { name: "silver",   rgb: [220, 220, 220] },
        { name: "graphite", rgb: [160, 160, 160] },
        { name: "ash",      rgb: [100, 100, 100] },
    ];

    // ---------------------------------------------------------------------------
    // Geometry
    // ---------------------------------------------------------------------------
    const S = CFG.segments;
    const SIDES = CFG.sides;
    const LONG = CFG.semiMajor;
    const SHORT = CFG.semiMinor;

    // Each ring: centerline f(t), and the unit normal of the plane it lies in.
    const curves = [
        { f: (t) => [LONG * Math.cos(t), SHORT * Math.sin(t), 0], n: [0, 0, 1] },
 { f: (t) => [0, LONG * Math.cos(t), SHORT * Math.sin(t)], n: [1, 0, 0] },
 { f: (t) => [SHORT * Math.sin(t), 0, LONG * Math.cos(t)], n: [0, 1, 0] },
    ];

    const cross = (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
    const normalize = (v) => {
        const l = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / l, v[1] / l, v[2] / l];
    };

    // Parameter values that split the curve into `count` pieces of equal length,
    // so every bay of the truss has the same size.
    function arcLengthParams(f, count) {
        const M = 4096;
        const cum = new Float64Array(M + 1);
        let prev = f(0);
        for (let k = 1; k <= M; k++) {
            const p = f((k / M) * TAU);
            cum[k] = cum[k - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]);
            prev = p;
        }
        const total = cum[M];
        const out = new Float64Array(count);
        let k = 0;
        for (let i = 0; i < count; i++) {
            const target = (total * i) / count;
            while (cum[k + 1] < target) k++;
            const frac = (target - cum[k]) / (cum[k + 1] - cum[k]);
            out[i] = ((k + frac) / M) * TAU;
        }
        return out;
    }

    const N = RINGS.length * S * SIDES;
    const pos = new Float32Array(N * 3);
    const nodeRing = new Uint8Array(N);
    const nodeParam = new Float32Array(N);
    const idx = (r, i, j) => (r * S + i) * SIDES + j;

    // Lookup tables: parameter t at evenly spaced arc-length fractions of each ring.
    const TABLE = 4096;
    const tables = curves.map((curve) => arcLengthParams(curve.f, TABLE));
    const tAt = (tab, u) => {
        const x = u * TABLE;
        const k = Math.floor(x) % TABLE;
        const next = k + 1 === TABLE ? TAU : tab[k + 1];
        return tab[k] + (next - tab[k]) * (x - Math.floor(x));
    };
    const wrap01 = (v) => ((v % 1) + 1) % 1;

    // Rebuild node positions with the truss slid `phase` bays along each ring.
    function updatePositions(phase) {
        curves.forEach((curve, r) => {
            const tab = tables[r];
            for (let i = 0; i < S; i++) {
                const t = tAt(tab, wrap01((i - phase) / S));
                const c = curve.f(t);
                const a = curve.f(t - 1e-4);
                const b = curve.f(t + 1e-4);
                const T = normalize([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
                // The ring is planar, so the frame is simple and closes with no twist:
                // u lies in the ring's plane, n is perpendicular to it.
                const u = cross(curve.n, T);
                const stagger = (i & 1) * 0.5; // alternate hoops are offset by half a step
                for (let j = 0; j < SIDES; j++) {
                    const ang = ((j + stagger) / SIDES) * TAU;
                    const cs = Math.cos(ang) * CFG.tube;
                    const sn = Math.sin(ang) * CFG.tube;
                    const id = idx(r, i, j);
                    pos[id * 3]     = c[0] + u[0] * cs + curve.n[0] * sn;
                    pos[id * 3 + 1] = c[1] + u[1] * cs + curve.n[1] * sn;
                    pos[id * 3 + 2] = c[2] + u[2] * cs + curve.n[2] * sn;
                    nodeRing[id] = r;
                    nodeParam[id] = wrap01((i - phase) / S); // position along the ring in world space
                }
            }
        });
    }
    updatePositions(0);

    // Struts: one hoop edge plus two diagonals per node, forming triangles all
    // the way round each tube.
    const eA = [], eB = [], eRing = [], eKind = [], eParam = [];
    const addEdge = (a, b, r, kind, param) => {
        eA.push(a); eB.push(b); eRing.push(r); eKind.push(kind); eParam.push(param);
    };
    for (let r = 0; r < RINGS.length; r++) {
        for (let i = 0; i < S; i++) {
            const i2 = (i + 1) % S;
            const even = (i & 1) === 0;
            for (let j = 0; j < SIDES; j++) {
                const a = idx(r, i, j);
                const param = i / S;
                addEdge(a, idx(r, i, (j + 1) % SIDES), r, 0, param);                 // hoop
                addEdge(a, idx(r, i2, j), r, 1, param);                              // diagonal
                addEdge(a, idx(r, i2, even ? (j + SIDES - 1) % SIDES : (j + 1) % SIDES), r, 1, param);
            }
        }
    }
    const E = eA.length;
    const edgeA = Uint32Array.from(eA);
    const edgeB = Uint32Array.from(eB);
    const edgeRing = Uint8Array.from(eRing);
    const edgeKind = Uint8Array.from(eKind);
    const edgeParam = Float32Array.from(eParam);

    // ---------------------------------------------------------------------------
    // Pre-rendered shading
    // ---------------------------------------------------------------------------
    const BUCKETS = CFG.depthBuckets;
    const edgeColors = RINGS.map(({ rgb }) =>
    Array.from({ length: BUCKETS }, (_, b) => {
        const t = b / (BUCKETS - 1);
        return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(0.10 + 0.65 * t).toFixed(2)})`;
    })
    );

    function makeSprite(rgb) {
        const s = 64;
        const c = document.createElement("canvas");
        c.width = c.height = s;
        const g = c.getContext("2d");
        // Flat printed dot with a paper-coloured keyline so it separates from the struts.
        g.fillStyle = PAPER;
        g.beginPath();
        g.arc(s / 2, s / 2, s / 2 - 1, 0, TAU);
        g.fill();
        g.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        g.beginPath();
        g.arc(s / 2, s / 2, s * 0.36, 0, TAU);
        g.fill();
        return c;
    }

    const sprites = RINGS.map((r) => makeSprite(r.rgb));

    // Colour of a strut that a light pulse is passing through.
    function litColor(ring, t01, w) {
        // Passing pulse: the strut darkens to full ink.
        const rgb = RINGS[ring].rgb;
        const m = w * 0.9;
        const r = rgb[0] + (INK[0] - rgb[0]) * m;
        const g = rgb[1] + (INK[1] - rgb[1]) * m;
        const b = rgb[2] + (INK[2] - rgb[2]) * m;
        const a = Math.min(1, 0.10 + 0.65 * t01 + w * 0.6);
        return `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(2)})`;
    }

    // A comet: bright at the head, fading along the tail behind it.
    const pulse = (s, head) => {
        const behind = (head - s + 1) % 1;
        if (behind >= CFG.waveTail) return 0;
        const w = 1 - behind / CFG.waveTail;
        return w * w;
    };

    // ---------------------------------------------------------------------------
    // View state and interaction
    // ---------------------------------------------------------------------------
    const HOME = { yaw: 0.6, pitch: 0.4 };
    let yaw = HOME.yaw, pitch = HOME.pitch;
    let targetYaw = yaw, targetPitch = pitch;
    let velYaw = 0, velPitch = 0;
    let autoBlend = 0;
    let lastInput = -1e9;
    let dragging = false;
    let lastX = 0, lastY = 0;
    const hint = document.querySelector(".borromean-hint");

    canvas.addEventListener("pointerdown", (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        velYaw = velPitch = 0;
        lastInput = performance.now();
        canvas.setPointerCapture(e.pointerId);
        if (hint) hint.classList.add("is-hidden");
    });

        canvas.addEventListener("pointermove", (e) => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            velYaw = dx * 0.008;
            velPitch = dy * 0.008;
            targetYaw += velYaw;
            targetPitch += velPitch;
            lastInput = performance.now();
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            lastInput = performance.now();
        };
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);

        canvas.addEventListener("dblclick", () => {
            // Snap back to the nearest equivalent of the home view (no multi-turn unwinding).
            targetYaw = HOME.yaw + Math.round((yaw - HOME.yaw) / TAU) * TAU;
            targetPitch = HOME.pitch + Math.round((pitch - HOME.pitch) / TAU) * TAU;
            velYaw = velPitch = 0;
            lastInput = performance.now();
        });

        // ---------------------------------------------------------------------------
        // Sizing
        // ---------------------------------------------------------------------------
        let W = 0, H = 0, dpr = 1, unit = 1, pxPerUnit = 1;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            W = rect.width;
            H = rect.height;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            unit = Math.min(W, H) / 900;
            pxPerUnit = (CFG.fit * Math.min(W, H)) / (LONG + CFG.tube);
        }
        new ResizeObserver(resize).observe(canvas);
        resize();

        // ---------------------------------------------------------------------------
        // Rendering
        // ---------------------------------------------------------------------------
        const rotX = (a) => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
        const rotY = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
        const rotZ = (a) => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
        const mul = (A, B) => {
            const R = new Array(9);
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
                }
            }
            return R;
        };

        const sx = new Float32Array(N);
        const sy = new Float32Array(N);
        const sz = new Float32Array(N);
        const sf = new Float32Array(N);
        const ITEMS = E + N;
        const depth = new Float32Array(ITEMS);
        const order = new Uint32Array(ITEMS);
        for (let i = 0; i < ITEMS; i++) order[i] = i;
        const byDepth = (a, b) => depth[a] - depth[b];

    const Z_RANGE = LONG + CFG.tube + 0.05; // for mapping depth to 0..1 shading
    const heads = [0, 0, 0];

    // Printed minute track around the edge, like a watch dial.
    function drawDial() {
        const cx = W / 2, cy = H / 2;
        const R = Math.min(W, H) * 0.485;
        ctx.lineCap = "butt";
        ctx.strokeStyle = "rgba(18,18,18,0.7)";
        for (let k = 0; k < 60; k++) {
            const a = (k / 60) * TAU;
            const quarter = k % 15 === 0;
            const five = k % 5 === 0;
            const len = (quarter ? 0.034 : five ? 0.022 : 0.011) * Math.min(W, H);
            ctx.lineWidth = (quarter ? 2.2 : five ? 1.4 : 0.7) * unit;
            const cs = Math.cos(a), sn = Math.sin(a);
            ctx.beginPath();
            ctx.moveTo(cx + cs * R, cy + sn * R);
            ctx.lineTo(cx + cs * (R - len), cy + sn * (R - len));
            ctx.stroke();
        }
        ctx.lineCap = "round";
    }

    let lastTime = 0;
    let raf = 0;
    let visible = true;

    function frame(now) {
        raf = 0;
        if (!visible) return;

        if (!lastTime) lastTime = now;
        const dt = Math.min(50, now - lastTime) / 16.667; // 1 = one 60fps frame
        lastTime = now;

        // --- update view ---
        if (!dragging) {
            targetYaw += velYaw * dt;
            targetPitch += velPitch * dt;
            const decay = Math.pow(0.94, dt);
            velYaw *= decay;
            velPitch *= decay;
        }
        const wantAuto = !reduceMotion && !dragging && now - lastInput > 1800;
        autoBlend += ((wantAuto ? 1 : 0) - autoBlend) * (1 - Math.pow(0.97, dt));
        targetYaw += CFG.spinYaw * autoBlend * dt;
        targetPitch += CFG.spinPitch * autoBlend * dt;
        const ease = 1 - Math.pow(0.86, dt);
        yaw += (targetYaw - yaw) * ease;
        pitch += (targetPitch - pitch) * ease;

        // --- slide the truss along each ring (against the direction of the pulses) ---
        if (!reduceMotion) updatePositions((now / 1000) * CFG.slideSpeed * S);

        // --- transform + project nodes ---
        const M = mul(rotZ(CFG.roll), mul(rotX(pitch), rotY(yaw)));
        const cx = W / 2, cy = H / 2;
        for (let n = 0; n < N; n++) {
            const x = pos[n * 3], y = pos[n * 3 + 1], z = pos[n * 3 + 2];
            const rx = M[0] * x + M[1] * y + M[2] * z;
            const ry = M[3] * x + M[4] * y + M[5] * z;
            const rz = M[6] * x + M[7] * y + M[8] * z;
            const f = CFG.camDist / (CFG.camDist - rz); // 1 at the centre, bigger when nearer
            sx[n] = cx + rx * f * pxPerUnit;
            sy[n] = cy - ry * f * pxPerUnit;
            sz[n] = rz;
            sf[n] = f;
        }

        // --- depth sort (painter's algorithm) ---
        for (let e = 0; e < E; e++) depth[e] = (sz[edgeA[e]] + sz[edgeB[e]]) * 0.5;
        for (let n = 0; n < N; n++) depth[E + n] = sz[n] + 0.03; // nodes sit just in front of their struts
        order.sort(byDepth);

        // --- pulses ---
        const t = reduceMotion ? 0 : now / 1000;
        for (let r = 0; r < 3; r++) heads[r] = (t * CFG.waveSpeed + r / 3) % 1;

        // --- draw ---
        ctx.clearRect(0, 0, W, H);
        ctx.lineCap = "round";
        ctx.globalAlpha = 1;
        const nodeR = CFG.nodeRadius * unit;
        const hoopW = 1.0 * unit;
        const diagW = 0.8 * unit;

        drawDial();

        for (let q = 0; q < ITEMS; q++) {
            const id = order[q];

            if (id < E) {
                const a = edgeA[id], b = edgeB[id], r = edgeRing[id];
                const t01 = clamp01((depth[id] + Z_RANGE) / (2 * Z_RANGE));
                const w = reduceMotion ? 0 : pulse(nodeParam[a], heads[r]);
                ctx.strokeStyle = w > 0.03
                ? litColor(r, t01, w)
                : edgeColors[r][(t01 * (BUCKETS - 1)) | 0];
                ctx.lineWidth = (edgeKind[id] === 0 ? hoopW : diagW) * (sf[a] + sf[b]) * 0.5;
                ctx.beginPath();
                ctx.moveTo(sx[a], sy[a]);
                ctx.lineTo(sx[b], sy[b]);
                ctx.stroke();
            } else {
                const n = id - E;
                const r = nodeRing[n];
                const t01 = clamp01((sz[n] + Z_RANGE) / (2 * Z_RANGE));
                const rad = nodeR * sf[n];
                ctx.globalAlpha = 0.45 + 0.55 * t01;
                ctx.drawImage(sprites[r], sx[n] - rad, sy[n] - rad, rad * 2, rad * 2);

                const w = reduceMotion ? 0 : pulse(nodeParam[n], heads[r]);
                if (w > 0.05) {
                    // A hairline ripple around the node as the pulse passes.
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = `rgba(18,18,18,${(w * 0.85).toFixed(2)})`;
                    ctx.lineWidth = 0.8 * unit;
                    ctx.beginPath();
                    ctx.arc(sx[n], sy[n], rad * (1.8 + 2.6 * (1 - w)), 0, TAU);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }
        }

        raf = requestAnimationFrame(frame);
    }

    // Pause rendering while the canvas is off-screen.
    new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible && !raf) {
            lastTime = 0;
            raf = requestAnimationFrame(frame);
        }
    }).observe(canvas);

    raf = requestAnimationFrame(frame);
})();
