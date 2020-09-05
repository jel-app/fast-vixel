window.onload = () => {

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    document.body.appendChild(canvas);
    
    const vixel = new FastVixel({size:[64, 64, 64]});
    window.vixel = vixel;
    
    const abs = Math.abs;
    const max = Math.max;
    const min = Math.min;
    const sqrt = Math.sqrt;
    
    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
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
    
    function sdBox(p, b) {
        const d = [abs(p[0]) - b[0], abs(p[1]) - b[1], abs(p[2]) - b[2]];
        return min(max(d[0], max(d[1], d[2])), 0) + len([max(d[0], 0), max(d[1], 0), max(d[2], 0)]);
    }
    
    function sdPryamid4(p, h) {
        // Tetrahedron = Octahedron - Cube
        const box = sdBox([p[0], p[1] + (2 * h[2]), p[2]], [2 * h[2], 2 * h[2], 2 * h[2]]);
        let d = 0;
        d = max(d, abs(dot(p, [-h[0], h[1],     0])));
        d = max(d, abs(dot(p, [ h[0], h[1],     0])));
        d = max(d, abs(dot(p, [   0,  h[1],  h[0]])));
        d = max(d, abs(dot(p, [   0,  h[1], -h[0]])));
        const octa = d - h[2];
        return max(-box, octa);
    }
    
    const PI = Math.PI;
    const _param = [Math.cos(30 * PI / 180), Math.sin(30 * PI / 180), 25];
    const SIZE = [64, 64, 64];
    const c = [SIZE[0] / 2, SIZE[1] / 2, SIZE[2] / 2];
    for (let i = 0; i < SIZE[0]; i++) {
        for (let j = 0; j < SIZE[1]; j++) {
            for (let k = 0; k < SIZE[2]; k++) {
                if (sdPryamid4([i - c[0], j, k - c[2]], _param) <= 0) {
                    vixel.set( i, j, k, {
                        red: 1,
                        green: 0.1,
                        blue: 0.1,
                    });
                } else {
                    vixel.set(i , j, k, {
                        red: 0.9,
                        red: 0.9,
                        blue: 0.9,
                        rough: 10,
                        transparent: 255,
                        refract: 85 * 1.333,
                    });
                }
            }
        }
    }
    vixel.setCamera({
        eye: [130, 100, 100], // Camera position
        center: [0.5, 0.5, 0.5], // Camera target
        up: [0, 1, 0], // Up
        fov: Math.PI / 4 // Field of view
    });
    
    vixel.regl.frame(() => {
        vixel.sample(1);
        vixel.display();
    });
}
