"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
var gl_matrix_1 = require("gl-matrix");
var Camera = (function () {
    function Camera(canvas) {
        this.canvas = canvas;
        this.fov = Math.PI / 6;
        this.eye = [0, 0, 4];
        this.center = [0, 0, 0];
        this.up = [0, 1, 0];
    }
    Camera.prototype.view = function () {
        return gl_matrix_1.mat4.lookAt(gl_matrix_1.mat4.create(), this.eye, this.center, this.up);
    };
    Camera.prototype.projection = function () {
        return gl_matrix_1.mat4.perspective(gl_matrix_1.mat4.create(), this.fov, this.canvas.width / this.canvas.height, 0.1, 1000);
    };
    Camera.prototype.invpv = function () {
        var v = this.view();
        var p = this.projection();
        var pv = gl_matrix_1.mat4.multiply(gl_matrix_1.mat4.create(), p, v);
        return gl_matrix_1.mat4.invert(gl_matrix_1.mat4.create(), pv);
    };
    Camera.prototype.serialize = function () {
        return {
            fov: this.fov,
            eye: this.eye,
            center: this.center,
            up: this.up,
        };
    };
    Camera.prototype.deserialize = function (data) {
        this.fov = data.fov;
        this.eye = data.eye;
        this.center = data.center;
        this.up = data.up;
    };
    return Camera;
}());
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map