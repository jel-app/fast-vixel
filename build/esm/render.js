"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRenderer = void 0;
var gl_matrix_1 = require("gl-matrix");
var atmosphereEnvmap_1 = require("./atmosphereEnvmap");
var atmosphereEnvmap2d_1 = require("./atmosphereEnvmap2d");
var pingpong_1 = require("./pingpong");
var regl_1 = require("./regl");
function getRenderer(regl, reglLoader) {
    var canvas = regl._gl.canvas;
    var sunDistance = 149600000000;
    var enableCubeMap = false;
    var sunPosition = [146417025226.45273, 7829459053.944404, 29680200382.728428];
    var renderSkyMap = atmosphereEnvmap_1.createSkyMapRenderer(regl);
    var renderSkyMap2D = atmosphereEnvmap2d_1.create2DSkyMapRenderer(regl);
    var skyMap = renderSkyMap2D({
        sunDirection: gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), sunPosition),
        resolution: 1024,
    });
    var pingpong = pingpong_1.PingPong(regl, {
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        colorType: 'float',
    });
    var ndcBox = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
    var tRandSize = 512;
    var t2Sphere = (function () {
        var data = new Float32Array(tRandSize * tRandSize * 3);
        for (var i = 0; i < tRandSize * tRandSize; i++) {
            var r = gl_matrix_1.vec3.random(gl_matrix_1.vec3.create());
            data[i * 3 + 0] = r[0];
            data[i * 3 + 1] = r[1];
            data[i * 3 + 2] = r[2];
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: 'rgb',
            type: 'float',
            data: data,
            wrap: 'repeat',
        });
    })();
    var t3Sphere = (function () {
        var data = new Float32Array(tRandSize * tRandSize * 3);
        for (var i = 0; i < tRandSize * tRandSize; i++) {
            var r = gl_matrix_1.vec3.random(gl_matrix_1.vec3.create(), Math.random());
            data[i * 3 + 0] = r[0];
            data[i * 3 + 1] = r[1];
            data[i * 3 + 2] = r[2];
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: 'rgb',
            type: 'float',
            data: data,
            wrap: 'repeat',
        });
    })();
    var tUniform2 = (function () {
        var data = new Float32Array(tRandSize * tRandSize * 2);
        for (var i = 0; i < tRandSize * tRandSize; i++) {
            data[i * 2 + 0] = Math.random();
            data[i * 2 + 1] = Math.random();
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: 'luminance alpha',
            type: 'float',
            data: data,
            wrap: 'repeat',
        });
    })();
    var tUniform1 = (function () {
        var data = new Float32Array(tRandSize * tRandSize * 1);
        for (var i = 0; i < tRandSize * tRandSize; i++) {
            data[i] = Math.random();
        }
        return regl.texture({
            width: tRandSize,
            height: tRandSize,
            format: 'luminance',
            type: 'float',
            data: data,
            wrap: 'repeat',
        });
    })();
    var sampleProps = regl_1.safeProp(regl);
    var cmdSample = reglLoader.cache('voxel-sample', {
        vert: "\n        precision highp float;\n        attribute vec2 position;\n        void main() {\n          gl_Position = vec4(position, 0, 1);\n        }\n      ",
        frag: require('./glsl/sample.glsl'),
        attributes: {
            position: ndcBox,
        },
        uniforms: {
            tSky: skyMap,
            tUniform1: tUniform1,
            tUniform2: tUniform2,
            t2Sphere: t2Sphere,
            t3Sphere: t3Sphere,
            invResRand: [1 / tRandSize, 1 / tRandSize],
            source: sampleProps('source').prop,
            invpv: sampleProps('invpv').prop,
            eye: sampleProps('eye').prop,
            res: sampleProps('res').prop,
            tOffset: sampleProps('tOffset').prop,
            tRGB: sampleProps('tRGB').prop,
            tRMET: sampleProps('tRMET').prop,
            tRi: sampleProps('tRi').prop,
            tIndex: sampleProps('tIndex').prop,
            dofDist: sampleProps('dofDist').prop,
            dofMag: sampleProps('dofMag').prop,
            resStage: sampleProps('resStage').prop,
            lightPosition: sampleProps('lightPosition').prop,
            lightIntensity: sampleProps('lightIntensity').prop,
            lightRadius: sampleProps('lightRadius').prop,
            groundColor: sampleProps('groundColor').prop,
            groundRoughness: sampleProps('groundRoughness').prop,
            groundMetalness: sampleProps('groundMetalness').prop,
            bounds: sampleProps('bounds').prop,
        },
        depth: {
            enable: false,
            mask: false,
        },
        viewport: sampleProps('viewport').prop,
        framebuffer: sampleProps('destination').prop,
        count: 6,
    }, true);
    var displayProps = regl_1.safeProp(regl);
    var cmdDisplay = regl({
        vert: "\n    precision highp float;\n    attribute vec2 position;\n    varying vec2 vPos;\n    void main() {\n      gl_Position = vec4(position, 0, 1);\n      vPos = 0.5 * position + 0.5;\n    }\n    ",
        frag: "\n    precision highp float;\n    uniform sampler2D source;\n    varying vec2 vPos;\n    void main() {\n      vec4 src = texture2D(source, vPos);\n      vec3 color = src.rgb/max(src.a, 1.0);\n      color = pow(color, vec3(1.0/2.2));\n      gl_FragColor = vec4(color, 1);\n    }\n    ",
        attributes: {
            position: ndcBox,
        },
        uniforms: {
            source: displayProps('source').prop,
        },
        depth: {
            enable: false,
            mask: false,
        },
        viewport: displayProps('viewport').prop,
        count: 6,
    });
    function calculateSunPosition(time, azimuth) {
        var theta = (2 * Math.PI * (time - 6)) / 24;
        return [
            sunDistance * Math.cos(azimuth) * Math.cos(theta),
            sunDistance * Math.sin(theta),
            sunDistance * Math.sin(azimuth) * Math.cos(theta),
        ];
    }
    function computeNewEnvMap(sunPos) {
        if (enableCubeMap) {
            if (skyMap.name === 'reglFramebuffer') {
                skyMap.destroy();
                skyMap = renderSkyMap({
                    sunDirection: gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), sunPos),
                    resolution: 1024,
                });
            }
            else {
                renderSkyMap({
                    sunDirection: gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), sunPos),
                    cubeFBO: skyMap,
                });
            }
        }
        else {
            if (skyMap.name === 'reglFramebufferCube') {
                skyMap.destroy();
                skyMap = renderSkyMap2D({
                    sunDirection: gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), sunPos),
                    resolution: 1024,
                });
            }
            else {
                renderSkyMap2D({
                    sunDirection: gl_matrix_1.vec3.normalize(gl_matrix_1.vec3.create(), sunPos),
                    envFBO: skyMap,
                });
            }
        }
    }
    var sampleCount = 0;
    function sample(stage, camera, opts) {
        var sp = calculateSunPosition(opts.time, opts.azimuth);
        if (gl_matrix_1.vec3.distance(sp, sunPosition) > 0.001) {
            sunPosition = sp;
            computeNewEnvMap(sunPosition);
        }
        for (var i = 0; i < opts.count; i++) {
            cmdSample({
                source: pingpong.ping(),
                invpv: camera.invViewProjection,
                eye: camera.eye,
                res: [canvas.offsetWidth, canvas.offsetHeight],
                tOffset: [Math.random(), Math.random()],
                tRGB: stage.tRGB,
                tRMET: stage.tRMET,
                tRi: stage.tRi,
                tIndex: stage.tIndex,
                dofDist: opts.dofDist,
                dofMag: opts.dofMag,
                resStage: stage.tIndex.width,
                bounds: [stage.width, stage.height, stage.depth],
                lightPosition: sunPosition,
                lightIntensity: opts.lightIntensity,
                lightRadius: 695508000 * opts.lightRadius,
                groundColor: opts.groundColor,
                groundRoughness: opts.groundRoughness,
                groundMetalness: opts.groundMetalness,
                destination: pingpong.pong(),
                viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
            });
            pingpong.swap();
            sampleCount++;
        }
    }
    function display() {
        cmdDisplay({
            source: pingpong.ping(),
            viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        });
    }
    function reset() {
        if (pingpong.ping().width !== canvas.offsetWidth ||
            pingpong.ping().height !== canvas.offsetHeight) {
            pingpong.ping()({
                width: canvas.offsetWidth,
                height: canvas.offsetHeight,
                colorType: 'float',
            });
            pingpong.pong()({
                width: canvas.offsetWidth,
                height: canvas.offsetHeight,
                colorType: 'float',
            });
        }
        regl.clear({ color: [0, 0, 0, 0], framebuffer: pingpong.ping() });
        regl.clear({ color: [0, 0, 0, 0], framebuffer: pingpong.pong() });
        sampleCount = 0;
    }
    return {
        sample: sample,
        display: display,
        reset: reset,
        sampleCount: function () {
            return sampleCount;
        },
    };
}
exports.getRenderer = getRenderer;
//# sourceMappingURL=render.js.map