"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBRRenderer = void 0;
var render_1 = require("./render");
var stage_1 = require("./stage");
var camera_1 = require("./camera");
var gl_matrix_1 = require("gl-matrix");
var regl_1 = require("./regl");
var createREGL = require("regl");
var PBRRenderer = (function () {
    function PBRRenderer(canvas, width, height, depth) {
        var _this = this;
        this._ground = { color: [0.55, 0.55, 0.55], rough: 1, metal: 0.6 };
        this._sun = { time: 6.2, azimuth: 0.2, radius: 16, intensity: 1 };
        this._dof = { distance: 0.5, magnitude: 0 };
        this._renderDirty = true;
        this._stageDirty = true;
        this.totalSamplesCount = 512;
        this._canvas = canvas;
        var regl = createREGL({
            canvas: canvas,
            extensions: ['OES_texture_float'],
            attributes: {
                antialias: false,
                preserveDrawingBuffer: true,
            },
        });
        var reglLoader = regl_1.createREGLCache(regl, true);
        this.camera = new camera_1.Camera(this._canvas);
        this.renderer = render_1.getRenderer(regl, reglLoader);
        this._canvas = regl._gl.canvas;
        this.stage = new stage_1.Stage(regl, width, height, depth);
        this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
        this.camera.on(camera_1.CameraEvent.cameraMoveEnd, function () {
            _this._renderDirty = true;
        });
        var lastResizeTime = 0;
        window.addEventListener('resize', function () {
            lastResizeTime = Date.now();
            setTimeout(function () {
                if (Date.now() - lastResizeTime >= 500) {
                    _this._renderDirty = true;
                }
            }, 500);
        });
    }
    PBRRenderer.prototype.getWidth = function () {
        return this.stage.getWidth();
    };
    PBRRenderer.prototype.getHeight = function () {
        return this.stage.getHeight();
    };
    PBRRenderer.prototype.getDepth = function () {
        return this.stage.getDepth();
    };
    PBRRenderer.prototype.updateBounds = function (width, height, depth) {
        this.stage.updateBounds(width, height, depth);
        this._stageDirty = false;
    };
    PBRRenderer.prototype.set = function (x, y, z, opts) {
        this.stage.set(x, y, z, opts);
        this._stageDirty = true;
    };
    PBRRenderer.prototype.unset = function (x, y, z) {
        this.stage.unset(x, y, z);
        this._stageDirty = true;
    };
    PBRRenderer.prototype.get = function (x, y, z) {
        return this.stage.get(x, y, z);
    };
    PBRRenderer.prototype.clear = function () {
        this.stage.clear();
        this._stageDirty = true;
    };
    Object.defineProperty(PBRRenderer.prototype, "sampleCount", {
        get: function () {
            return this.renderer.sampleCount();
        },
        enumerable: false,
        configurable: true
    });
    PBRRenderer.prototype.getGround = function () {
        return {
            color: this._ground.color,
            rough: this._ground.rough,
            metal: this._ground.metal,
        };
    };
    PBRRenderer.prototype.setGround = function (param) {
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
    PBRRenderer.prototype.getSun = function () {
        return {
            time: this._sun.time,
            azimuth: this._sun.azimuth,
            radius: this._sun.radius,
            intensity: this._sun.intensity,
        };
    };
    PBRRenderer.prototype.setSun = function (param) {
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
    PBRRenderer.prototype.setDof = function (distance, magnitude) {
        if (this._dof.distance === distance &&
            this._dof.magnitude === magnitude) {
            return;
        }
        this._dof.distance = distance;
        this._dof.magnitude = magnitude;
        this._renderDirty = true;
    };
    PBRRenderer.prototype.sample = function (count, totalCount) {
        if (totalCount === void 0) { totalCount = Infinity; }
        if (this.oldCanvasSize[0] !== this._canvas.offsetWidth &&
            this.oldCanvasSize[1] !== this._canvas.offsetHeight) {
            this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
            this._renderDirty = true;
        }
        if (this._stageDirty) {
            this.stage.update();
            this._renderDirty = true;
            this._stageDirty = false;
        }
        if (this._renderDirty) {
            this.renderer.reset();
            this._renderDirty = false;
        }
        this.sampleCount < totalCount && this.renderer.sample(this.stage, this.camera, {
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
        this._onProgressUpdate && this._onProgressUpdate((this.sampleCount / totalCount));
    };
    PBRRenderer.prototype.display = function () {
        this.renderer.display();
    };
    return PBRRenderer;
}());
exports.PBRRenderer = PBRRenderer;
//# sourceMappingURL=index.js.map