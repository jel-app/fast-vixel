"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create2DSkyMapRenderer = void 0;
var regl_1 = require("./regl");
function create2DSkyMapRenderer(regl) {
    var prop = regl_1.safeProp(regl);
    var envmap2dCommand = regl({
        vert: "\n      precision highp float;\n      attribute vec2 position;\n      varying vec2 uv;\n      void main() {\n        uv = position;\n        gl_Position = vec4(position, 0.999, 1);\n      }\n    ",
        frag: require('./glsl/atmosphere_envmap2d.glsl'),
        attributes: {
            position: [
                -4, 0,
                4, -4,
                4, 4,
            ],
        },
        uniforms: {
            sundir: prop('sundir').prop,
        },
        primitive: 'triangles',
        framebuffer: prop('framebuffer').prop,
        count: 3,
    });
    function render(opts) {
        var sunDirection = opts.sunDirection || [0, 0.25, -1];
        var resolution = opts.resolution || 1024;
        function renderer(config) {
            regl.clear({
                color: [0, 0, 0, 1],
                depth: 1,
                framebuffer: config.framebuffer,
            });
            envmap2dCommand({
                framebuffer: config.framebuffer,
                sundir: sunDirection,
            });
        }
        return render2dEnvmap(regl, renderer, {
            resolution: resolution,
            envFBO: opts.envFBO,
        });
    }
    return render;
}
exports.create2DSkyMapRenderer = create2DSkyMapRenderer;
function render2dEnvmap(regl, renderer, opts) {
    var resolution = opts.resolution || 1024;
    var envFBO = opts.envFBO === undefined ?
        regl.framebuffer({
            color: regl.texture({
                width: resolution * 2,
                height: resolution,
                type: 'float',
                format: 'rgba',
            }),
            depthStencil: false,
        }) : opts.envFBO;
    renderer({
        framebuffer: envFBO,
    });
    return envFBO;
}
//# sourceMappingURL=atmosphereEnvmap2d.js.map