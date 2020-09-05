window.onload = () => {

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    document.body.appendChild(canvas);
    
    const SIZE = [64, 64, 64];
    const vixel = new FastVixel({canvas, size:SIZE });
    window.vixel = vixel;
    
    const c = [SIZE[0] / 2, SIZE[1] / 2, SIZE[2] / 2];
    const skullScale = 27;
    for (let i = 0; i < SIZE[0]; i++) {
        for (let j = 0; j < SIZE[1]; j++) {
            for (let k = 0; k < SIZE[2]; k++) {
                if (skull([(i - c[0]) / skullScale, (j - c[1]) / skullScale, (k - c[2] / 2) / skullScale]) <= 0) {
                    vixel.set( i, j, k, {
                        red: 0.2,
                        green: 0.2,
                        blue: 0.2,
                    });
                }
            }
        }
    }

    for (let i = 0; i < SIZE[0]; i++) {
        for (let k = 0; k < SIZE[2]; k++) {
            vixel.set( i, 0, k, {
                red: 1,
                green: 1,
                blue: 1,
                emit: 255
            });
            if (len([i - c[0], k - c[2]]) > 20 && len([i - c[0], k - c[2]]) < 25) {
                vixel.set( i, SIZE[1] - 1, k, {
                    red: 1,
                    green: 1,
                    blue: 1,
                    emit: 255
                });
            }
        }
    }

    for (let k = 0; k < SIZE[2]; k++) {
        for (let j = 0; j < SIZE[1]; j++) {
            vixel.set( SIZE[0] - 1, j, k, {
                red: 1,
                green: 1,
                blue: 1,
                rough: 10,
                metal: 255,
                refract: 0,
            });
        }
    }

    vixel.setCamera({
        eye: [-30, 40, -80], // Camera position
        center: [32, 32, 32], // Camera target
        up: [0, 1, 0], // Up
        fov: Math.PI / 4 // Field of view
    });

    vixel.setSun({time: 5});
    
    vixel.regl.frame(() => {
        vixel.sample(1);
        vixel.display();
    });
}
