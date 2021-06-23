"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var render_1 = require("./render");
var stage_1 = require("./stage");
var camera_1 = require("./camera");
var gl_matrix_1 = require("gl-matrix");
var regl_1 = require("./regl");
var createREGL = require("regl");
module.exports = (function () {
    function FastVixel(opts) {
        if (opts === void 0) { opts = {
            size: [32, 32, 32],
        }; }
        this._ground = { color: [1, 1, 1], rough: 1, metal: 0 };
        this._sun = { time: 11, azimuth: 5, radius: 16, intensity: 1 };
        this._dof = { distance: 0.5, magnitude: 0 };
        this._renderDirty = true;
        this._stageDirty = true;
        if (opts.canvas) {
            this._canvas = opts.canvas;
            this.regl = createREGL({
                canvas: opts.canvas,
                extensions: ['OES_texture_float'],
                attributes: {
                    antialias: false,
                    preserveDrawingBuffer: true,
                },
            });
        }
        else {
            this.regl = createREGL({
                extensions: ['OES_texture_float'],
                attributes: {
                    antialias: false,
                    preserveDrawingBuffer: true,
                },
            });
            this._canvas = this.regl._gl.canvas;
        }
        var reglLoader = regl_1.createREGLCache(this.regl, true);
        this._camera = new camera_1.Camera(this._canvas);
        this._renderer = render_1.getRenderer(this.regl, reglLoader);
        this._canvas = this.regl._gl.canvas;
        this._stage = new stage_1.Stage(this.regl, opts.size);
        this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
    }
    FastVixel.prototype.getSize = function () {
        return this._stage.getSize();
    };
    FastVixel.prototype.setSize = function (width, height, depth) {
        this._stage.setSize(width, height, depth);
        this._stageDirty = false;
    };
    FastVixel.prototype.set = function (x, y, z, opts) {
        this._stage.set(x, y, z, opts);
        this._stageDirty = true;
    };
    FastVixel.prototype.unset = function (x, y, z) {
        this._stage.unset(x, y, z);
        this._stageDirty = true;
    };
    FastVixel.prototype.get = function (x, y, z) {
        return this._stage.get(x, y, z);
    };
    FastVixel.prototype.clear = function () {
        this._stage.clear();
        this._stageDirty = true;
    };
    Object.defineProperty(FastVixel.prototype, "sampleCount", {
        get: function () {
            return this._renderer.sampleCount();
        },
        enumerable: false,
        configurable: true
    });
    FastVixel.prototype.setCamera = function (param) {
        if (param.eye && !gl_matrix_1.vec3.equals(param.eye, this._camera.eye)) {
            gl_matrix_1.vec3.copy(this._camera.eye, param.eye);
            this._renderDirty = true;
        }
        if (param.center && !gl_matrix_1.vec3.equals(param.center, this._camera.center)) {
            gl_matrix_1.vec3.copy(this._camera.center, param.center);
            this._renderDirty = true;
        }
        if (param.up && !gl_matrix_1.vec3.equals(param.up, this._camera.up)) {
            gl_matrix_1.vec3.copy(this._camera.up, param.up);
            this._renderDirty = true;
        }
        if (param.fov && param.fov !== this._camera.fov) {
            this._camera.fov = param.fov;
            this._renderDirty = true;
        }
    };
    FastVixel.prototype.getGround = function () {
        return {
            color: this._ground.color,
            rough: this._ground.rough,
            metal: this._ground.metal,
        };
    };
    FastVixel.prototype.setGround = function (param) {
        if (param.color !== undefined && !gl_matrix_1.vec3.equals(param.color, this._ground.color)) {
            this._ground.color[0] = param.color[0];
            this._ground.color[1] = param.color[1];
            this._ground.color[2] = param.color[2];
            this._renderDirty = true;
        }
        if (param.rough !== undefined && param.rough !== this._ground.rough) {
            this._ground.rough = param.rough;
            this._renderDirty = true;
        }
        if (param.metal !== undefined && param.metal !== this._ground.metal) {
            this._ground.metal = param.metal;
            this._renderDirty = true;
        }
    };
    FastVixel.prototype.getSun = function () {
        return {
            time: this._sun.time,
            azimuth: this._sun.azimuth,
            radius: this._sun.radius,
            intensity: this._sun.intensity,
        };
    };
    FastVixel.prototype.setSun = function (param) {
        if (param.time !== undefined && param.time !== this._sun.time) {
            this._sun.time = param.time;
            this._renderDirty = true;
        }
        if (param.azimuth !== undefined && param.azimuth !== this._sun.azimuth) {
            this._sun.azimuth = param.azimuth;
            this._renderDirty = true;
        }
        if (param.radius !== undefined && param.radius !== this._sun.radius) {
            this._sun.radius = param.radius;
            this._renderDirty = true;
        }
        if (param.intensity !== undefined && param.intensity !== this._sun.intensity) {
            this._sun.intensity = param.intensity;
            this._renderDirty = true;
        }
    };
    FastVixel.prototype.dof = function (distance, magnitude) {
        if (this._dof.distance === distance &&
            this._dof.magnitude === magnitude) {
            return;
        }
        this._dof.distance = distance;
        this._dof.magnitude = magnitude;
        this._renderDirty = true;
    };
    FastVixel.prototype.sample = function (count, totalCount) {
        if (totalCount === void 0) { totalCount = Infinity; }
        if (totalCount <= 0) {
            totalCount = Infinity;
        }
        if (this.oldCanvasSize[0] !== this._canvas.offsetWidth &&
            this.oldCanvasSize[1] !== this._canvas.offsetHeight) {
            this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
            this._renderDirty = true;
        }
        if (this._stageDirty) {
            this._stage.update();
            this._renderDirty = true;
            this._stageDirty = false;
        }
        if (this._renderDirty) {
            this._renderer.reset();
            this._renderDirty = false;
        }
        this.sampleCount < totalCount && this._renderer.sample(this._stage, this._camera, {
            groundColor: this._ground.color,
            groundRoughness: this._ground.rough,
            groundMetalness: this._ground.metal,
            time: this._sun.time,
            azimuth: this._sun.azimuth,
            lightRadius: this._sun.radius,
            lightIntensity: this._sun.intensity,
            dofDist: this._dof.distance,
            dofMag: this._dof.magnitude,
            count: count,
        });
        if (totalCount !== Infinity) {
            this.onProgressUpdate && this.onProgressUpdate((this.sampleCount / totalCount));
        }
    };
    FastVixel.prototype.display = function () {
        this._renderer.display();
    };
    FastVixel.prototype.serialize = function () {
        return {
            stage: this._stage.serialize(),
            camera: this._camera.serialize(),
            dof: JSON.parse(JSON.stringify(this._dof)),
            sun: JSON.parse(JSON.stringify(this._sun)),
            ground: JSON.parse(JSON.stringify(this._ground)),
        };
    };
    FastVixel.prototype.deserialize = function (data) {
        this._stage.deserialize(data.stage);
        this._camera.deserialize(data.camera);
        this._dof = JSON.parse(JSON.stringify(data.dof));
        this._sun = JSON.parse(JSON.stringify(data.sun));
        this._ground = JSON.parse(JSON.stringify(data.ground));
        this._stageDirty = true;
        this._renderDirty = true;
    };
    return FastVixel;
}());
//# sourceMappingURL=index.js.map