const abs = Math.abs;
const max = Math.max;
const min = Math.min;
const sin = Math.sin;
const cos = Math.cos;
const sqrt = Math.sqrt;
const pow = Math.pow;
const exp = Math.exp;
const log = Math.log;

const PI = 3.14159265359;
const PI2 = 6.28318530718;

function clamp(a, J, L) {
    if (J > L) {
        const t = J;
        J = L;
        L = t;
    }
    return min( max(a, J), L);
}

function sign(n) {
    return n < 0 ? -1 : (n > 0 ? 1 : 0);
}

function mix(x, y, a) {
    a = max(0, a);
    a = min(1, a);
    return x * (1 - a) + y * a;
}

function sminp(a, b, k) {
    const h = clamp( 0.5 + 0.5 * (b - a) / k, 0.0, 1.0 );
    return mix( b, a, h ) - k * h * (1.0 - h);
}

function smine(a, b, k) {
    const res = exp( -k * a ) + exp( -k * b );
    return -log(res) / k;
}

function rotateX(p, a) {
    const sa = sin(a);
    const ca = cos(a);
    const r = [0, 0, 0];
    r[0] = p[0];
    r[1] = ca * p[1] - sa * p[2];
    r[2] = sa * p[1] + ca * p[2];
    return r;
}

function len(v) {
    if (v.length) {
        let sum = 0;
        for (let i = 0; i < v.length; i++) {
            sum += v[i]*v[i];
        }
        return sqrt(sum);
    }
    return 0;
}

function sdRoundBox(p, b, r) {
    const q = [abs(p[0]) - b[0], abs(p[1]) - b[1], abs(p[2]) - b[2]];
    return min(max(q[0], max(q[1], q[2])), 0) + len([max(q[0], 0), max(q[1], 0), max(q[2], 0)]) - r;
}

function sdTorus(p, t) {
    let q = [len([p[0], p[2]]) - t[0], p[1]];
    return len(q) - t[1];
}

function skull(p) {
    const q = [p[0], p[1], p[2]];
    p[1] += sin(p[1] * 1.6) * 0.2;
    p[2] -= p[0] * 0.05;
    const e = sdTorus(rotateX([p[0] - 0.4, p[1], p[2]], 3.14 / 2.0), [0.3, 0.1]);   //eye
    p[2] = q[2];
    p[2] += p[0] * 0.05;
    const f=sdTorus(rotateX([p[0] + 0.4, p[1], p[2]], 3.14 / 2.0) , [0.3, 0.1]);   //eye
    p[0] += sin(p[0]);
    const n = sdTorus([p[0], p[1] + 0.45, p[2] + 0.19], [0.2, 0.05]);  //nose
    p[0] = q[0]; p[1] = q[1]; p[2] = q[2];
    p[0] += sin(p[0] * 0.07);
    p[0] *= cos(p[1] * 0.6 + abs(cos(3.7 + p[1]) * 0.2) * 1.1) ;
    let s = len([p[0], p[1] - 0.14, p[2] - 0.79]) - 0.98; //back
    p[0] = q[0]; p[1] = q[1]; p[2] = q[2];
    p[1] += sin(p[1] * 1.7) * 0.3;
    let d = len([p[0] - 0.4, p[1], p[2] + 0.1]) - 0.25; //eyehole
    s = max(s, -d);
    d = len([p[0] + 0.4, p[1], p[2] + 0.1]) - 0.25;  //eyehole
    s = max(s, -d);
    p[0] = q[0]; p[1] = q[1]; p[2] = q[2];
    p[2] += p[2] - p[1] * 0.4;
    const v = sdRoundBox([p[0], p[1] + 0.68, p[2] - 0.7], [0.02, 0.07, 0.8], 0.27);   //chin
    let o= sminp(e, f, 0.5);
    o = smine(o, n, 14.0);
    o = sminp(o, s, 0.09);
    return smine(o, v, 12.0);
}