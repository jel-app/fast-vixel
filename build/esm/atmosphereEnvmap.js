"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSkyMapRenderer = void 0;
var unindexMesh_1 = require("./utils/unindexMesh");
var primitiveCube_1 = require("./utils/primitiveCube");
var gl_matrix_1 = require("gl-matrix");
var regl_1 = require("./regl");
function createSkyMapRenderer(regl) {
    var rawCube = primitiveCube_1.createCube(1, 1, 1, 1, 1, 1);
    var cube = unindexMesh_1.unindex(rawCube.positions, rawCube.cells);
    var prop = regl_1.safeProp(regl);
    var envmapCommand = regl({
        vert: "\n      precision highp float;\n      attribute vec3 position;\n      uniform mat4 view, projection;\n      varying vec3 pos;\n\n      void main() {\n        gl_Position = projection * view * vec4(position, 1);\n        pos = position;\n      }\n    ",
        frag: require('./glsl/atmosphere_envmap.glsl'),
        attributes: {
            position: cube,
        },
        uniforms: {
            sundir: prop('sundir').prop,
            view: prop('view').prop,
            projection: prop('projection').prop,
        },
        viewport: prop('viewport').prop,
        framebuffer: prop('framebuffer').prop,
        count: cube.length / 3,
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
            envmapCommand({
                view: config.view,
                projection: config.projection,
                viewport: config.viewport,
                framebuffer: config.framebuffer,
                sundir: sunDirection,
            });
        }
        return renderCubemap(regl, renderer, {
            resolution: resolution,
            cubeFBO: opts.cubeFBO,
        });
    }
    return render;
}
exports.createSkyMapRenderer = createSkyMapRenderer;
function renderCubemap(regl, renderer, opts) {
    var resolution = opts.resolution || 1024;
    var near = opts.near || 0.1;
    var far = opts.far || 1000;
    var eye = (opts.eye || [0, 0, 0]);
    var cubeFBO = opts.cubeFBO === undefined ? regl.framebufferCube(resolution) : opts.cubeFBO;
    var faces = [
        { center: [1, 0, 0], up: [0, -1, 0], fbo: cubeFBO.faces[0] },
        { center: [-1, 0, 0], up: [0, -1, 0], fbo: cubeFBO.faces[1] },
        { center: [0, 1, 0], up: [0, 0, 1], fbo: cubeFBO.faces[2] },
        { center: [0, -1, 0], up: [0, 0, -1], fbo: cubeFBO.faces[3] },
        { center: [0, 0, 1], up: [0, -1, 0], fbo: cubeFBO.faces[4] },
        { center: [0, 0, -1], up: [0, -1, 0], fbo: cubeFBO.faces[5] },
    ];
    for (var _i = 0, faces_1 = faces; _i < faces_1.length; _i++) {
        var f = faces_1[_i];
        var view = gl_matrix_1.mat4.lookAt(gl_matrix_1.mat4.create(), eye, gl_matrix_1.vec3.add(gl_matrix_1.vec3.create(), eye, f.center), f.up);
        var projection = gl_matrix_1.mat4.perspective(gl_matrix_1.mat4.create(), Math.PI / 2, 1, near, far);
        var viewport = {
            x: 0,
            y: 0,
            width: cubeFBO.width,
            height: cubeFBO.height,
        };
        renderer({
            view: view,
            projection: projection,
            viewport: viewport,
            framebuffer: f.fbo,
        });
    }
    return cubeFBO;
}
//# sourceMappingURL=atmosphereEnvmap.js.map