"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = exports.CameraEvent = void 0;
var gl_matrix_1 = require("gl-matrix");
var mouseWheel = require('mouse-wheel');
var events_1 = require("events");
var DEFAULT_FOV_Y = Math.PI / 4;
var DEFAULT_Z_NEAR = 1;
var DEFAULT_Z_FAR = 1024;
var DEFAULT_GAMMA = 2.2;
var right = new Float32Array([1, 0, 0]);
var front = new Float32Array([0, 0, 1]);
exports.CameraEvent = {
    cameraMoveEnd: 'cameraMoveEnd',
    cameraMoveBegin: 'cameraMoveBegin',
};
var Camera = (function (_super) {
    __extends(Camera, _super);
    function Camera(canvas) {
        var _this = _super.call(this) || this;
        _this.viewportWidth = 1;
        _this.viewportHeight = 1;
        _this.view = gl_matrix_1.mat4.create();
        _this.fixedView = gl_matrix_1.mat4.create();
        _this.projection = gl_matrix_1.mat4.create();
        _this.viewProjection = gl_matrix_1.mat4.create();
        _this.invView = gl_matrix_1.mat4.create();
        _this.invProjection = gl_matrix_1.mat4.create();
        _this.invViewProjection = gl_matrix_1.mat4.create();
        _this.eye = gl_matrix_1.vec3.create();
        _this.rotation = gl_matrix_1.quat.create();
        _this.target = gl_matrix_1.vec3.create();
        _this.up = new Float32Array([0, 1, 0]);
        _this.fovY = DEFAULT_FOV_Y;
        _this.zNear = DEFAULT_Z_NEAR;
        _this.zFar = DEFAULT_Z_FAR;
        _this.gamma = DEFAULT_GAMMA;
        _this.prevX = 0;
        _this.prevY = 0;
        _this.metaDown = false;
        _this.startRotate = false;
        _this.keyThetaRotate = false;
        _this.keyPhiRotate = false;
        _this.keyZoomIn = false;
        _this.keyZoomOut = false;
        _this.lastScrollTime = 0;
        _this.theta = 0;
        _this.phi = 0;
        _this.distance = 10;
        _this.dtheta = 0;
        _this.dphi = 0;
        _this.ddistance = 0;
        _this.minDistance = 0.002;
        _this.maxDistance = 100;
        _this.canvas = canvas;
        mouseWheel(document.body, function (dx, dy, dz, ev) {
            if (ev.target != canvas) {
                return;
            }
            if ((_this.distance < 0.003 && ev.deltaY < 0) || (_this.distance > 6.5 && ev.deltaY > 0)) {
                return;
            }
            _this.ddistance += dy / _this.canvas.offsetHeight / 2;
            _this.lastScrollTime = Date.now();
        });
        _this._onContextMenu = _this._onContextMenu.bind(_this);
        _this._onMouseDown = _this._onMouseDown.bind(_this);
        _this._onMouseMove = _this._onMouseMove.bind(_this);
        _this._onMouseUp = _this._onMouseUp.bind(_this);
        _this._onTouchStart = _this._onTouchStart.bind(_this);
        _this._onTouchMove = _this._onTouchMove.bind(_this);
        _this._onTouchEnd = _this._onTouchEnd.bind(_this);
        return _this;
    }
    Camera.prototype.isRotating = function () {
        return this.startRotate;
    };
    Camera.prototype.setPosition = function (dimension) {
        this.target[0] = dimension[0] / 2;
        this.target[1] = dimension[1] / 2;
        this.target[2] = dimension[2] / 2;
        this.ddistance = 5.987249185732558;
        this.phi = 0.5089343452708008;
        this.theta = 30.628504829794284;
    };
    Camera.prototype.calcProjection = function () {
        this.viewportWidth = this.canvas.offsetWidth;
        this.viewportHeight = this.canvas.offsetHeight;
        gl_matrix_1.mat4.perspective(this.projection, this.fovY, this.viewportWidth / this.viewportHeight, this.zNear, this.zFar);
        gl_matrix_1.mat4.invert(this.invProjection, this.projection);
    };
    Camera.prototype.calcView = function () {
        var _a = this, eye = _a.eye, view = _a.view, target = _a.target, up = _a.up;
        gl_matrix_1.mat4.lookAt(view, eye, target, up);
        gl_matrix_1.mat4.invert(this.invView, view);
        var dir = gl_matrix_1.vec3.sub(gl_matrix_1.vec3.create(), target, eye);
        gl_matrix_1.vec3.normalize(dir, dir);
        gl_matrix_1.mat4.lookAt(this.fixedView, eye, gl_matrix_1.vec3.add(gl_matrix_1.vec3.create(), dir, eye), up);
    };
    Camera.prototype.recalc = function () {
        var _a = this, viewProjection = _a.viewProjection, invViewProjection = _a.invViewProjection, projection = _a.projection, view = _a.view;
        this.calcView();
        this.calcProjection();
        gl_matrix_1.mat4.mul(viewProjection, projection, view);
        gl_matrix_1.mat4.invert(invViewProjection, viewProjection);
    };
    Camera.prototype.reset = function () {
        gl_matrix_1.vec3.set(this.target, 0, 0, 0);
        gl_matrix_1.quat.identity(this.rotation);
        this.fovY = DEFAULT_FOV_Y;
        this.zNear = DEFAULT_Z_NEAR;
        this.zFar = DEFAULT_Z_FAR;
        this.gamma = DEFAULT_GAMMA;
        this.recalc();
    };
    Camera.prototype.updateCamera = function () {
        var target = this.target;
        var eye = this.eye;
        var up = this.up;
        this.theta += this.dtheta;
        this.phi = this.clamp(this.phi + this.dphi, -Math.PI / 2.001, Math.PI / 2.001);
        if (this.keyZoomIn && !this.keyZoomOut) {
            this.ddistance += -30 / this.canvas.offsetHeight / 2;
        }
        else if (!this.keyZoomIn && this.keyZoomOut) {
            this.ddistance += 30 / this.canvas.offsetHeight / 2;
        }
        if (!this.keyThetaRotate) {
            this.dtheta = 0;
        }
        if (!this.keyPhiRotate) {
            this.dphi = 0;
        }
        this.distance = this.clamp(this.distance + this.ddistance, this.minDistance, this.maxDistance);
        this.distance = this.damp(this.ddistance);
        var theta = this.theta;
        var phi = this.phi;
        var r = Math.exp(this.distance);
        var vf = r * Math.sin(theta) * Math.cos(phi);
        var vr = r * Math.cos(theta) * Math.cos(phi);
        var vu = r * Math.sin(phi);
        for (var i = 0; i < 3; i++) {
            eye[i] = target[i] + vf * front[i] + vr * right[i] + vu * up[i];
        }
        this.recalc();
        if (this.lastScrollTime !== 0 && Date.now() - this.lastScrollTime > 500) {
            this.emit(exports.CameraEvent.cameraMoveEnd);
            this.lastScrollTime = 0;
        }
    };
    Camera.prototype._onMouseDown = function (e) {
        if (e.button == 2 || (e.button == 0 && this.metaDown == true)) {
            this.startRotate = true;
        }
    };
    Camera.prototype._onTouchStart = function (e) {
        e.stopPropagation();
        if (e.cancelable) {
            if (!e.defaultPrevented) {
                e.preventDefault();
            }
        }
        this.startRotate = true;
        return false;
    };
    Camera.prototype._onTouchMove = function (e) {
        e.stopPropagation();
        if (e.cancelable) {
            if (!e.defaultPrevented) {
                e.preventDefault();
            }
        }
        e.clientY = e.touches[0].clientY;
        e.clientX = e.touches[0].clientX;
        this._onMouseMove(e);
    };
    Camera.prototype._onTouchEnd = function (e) {
        this.startRotate = false;
    };
    Camera.prototype._onContextMenu = function (e) {
        e.stopPropagation();
        e.preventDefault();
    };
    Camera.prototype._onMouseMove = function (e) {
        var x = e.clientX - this.canvas.offsetLeft;
        var y = e.clientY - this.canvas.offsetTop;
        if (this.startRotate) {
            x = e.clientX - this.canvas.offsetLeft;
            y = e.clientY - this.canvas.offsetTop;
            var dx = (x - this.prevX) / this.canvas.offsetWidth / 2;
            var dy = (y - this.prevY) / this.canvas.offsetHeight / 2;
            var w = Math.max(3 * this.distance, 0.5);
            this.dtheta += w * dx;
            this.dphi += w * dy;
        }
        this.prevX = x;
        this.prevY = y;
    };
    Camera.prototype._onMouseUp = function (e) {
        if (this.startRotate) {
            this.startRotate = false;
            this.emit(exports.CameraEvent.cameraMoveEnd);
        }
    };
    Camera.prototype.damp = function (x) {
        var xd = x * 0.8;
        if (xd < 0.005 && xd > -0.005) {
            return 0;
        }
        return xd;
    };
    Camera.prototype.clamp = function (x, lo, hi) {
        return Math.min(Math.max(x, lo), hi);
    };
    Camera.prototype.attachEventListener = function () {
        document.body.addEventListener('mousedown', this._onMouseDown);
        document.body.addEventListener('contextmenu', this._onContextMenu);
        document.body.addEventListener('mousemove', this._onMouseMove);
        document.body.addEventListener('mouseup', this._onMouseUp);
        document.body.addEventListener('touchstart', this._onTouchStart);
        document.body.addEventListener('touchmove', this._onTouchMove);
        document.body.addEventListener('touchend', this._onTouchEnd);
    };
    Camera.prototype.releaseEventListener = function () {
        document.body.removeEventListener('mousedown', this._onMouseDown);
        document.body.removeEventListener('contextmenu', this._onContextMenu);
        document.body.removeEventListener('mousemove', this._onMouseMove);
        document.body.removeEventListener('mouseup', this._onMouseUp);
        document.body.removeEventListener('touchstart', this._onTouchStart);
        document.body.removeEventListener('touchmove', this._onTouchMove);
        document.body.removeEventListener('touchend', this._onTouchEnd);
    };
    return Camera;
}(events_1.EventEmitter));
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map