"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage = exports.VoxelIndex = void 0;
var fill_1 = require("./utils/fill");
var VoxelIndex = (function () {
    function VoxelIndex() {
        this.x = -1;
        this.y = -1;
        this.keys = {};
        this.aRGB = new Uint8Array(256 * 256 * 3);
        this.aRMET = new Uint8Array(256 * 256 * 4);
        this.aRi = new Uint8Array(256 * 256);
        this.clear();
        if (!Object.entries) {
            Object.entries = function (obj) {
                var ownProps = Object.keys(obj);
                var i = ownProps.length;
                var resArray = new Array(i);
                while (i--) {
                    resArray[i] = [ownProps[i], obj[ownProps[i]]];
                }
                return resArray;
            };
        }
    }
    VoxelIndex.prototype.clear = function () {
        fill_1.fillArray(this.aRGB, 0);
        fill_1.fillArray(this.aRMET, 0);
        fill_1.fillArray(this.aRi, 0);
        this.x = 1;
        this.y = 0;
        this.keys = {};
    };
    VoxelIndex.prototype.get = function (v) {
        var h = v.red + " " + v.green + " " + v.blue + " " + v.rough + " " + v.metal + " " + v.emit + " " + v.transparent + " " + v.refract;
        if (this.keys[h] === undefined) {
            this.x++;
            if (this.x > 255) {
                this.x = 0;
                this.y++;
                if (this.y > 255) {
                    throw new Error('Exceeded voxel type limit of 65536');
                }
            }
            this.keys[h] = [this.x, this.y];
            var i = this.y * 256 + this.x;
            this.aRGB[i * 3 + 0] = v.red;
            this.aRGB[i * 3 + 1] = v.green;
            this.aRGB[i * 3 + 2] = v.blue;
            this.aRMET[i * 4 + 0] = v.rough;
            this.aRMET[i * 4 + 1] = v.metal;
            this.aRMET[i * 4 + 2] = v.emit;
            this.aRMET[i * 4 + 3] = v.transparent;
            this.aRi[i] = v.refract;
        }
        return this.keys[h];
    };
    return VoxelIndex;
}());
exports.VoxelIndex = VoxelIndex;
var Stage = (function () {
    function Stage(regl, width, height, depth) {
        this.data = {};
        this.vIndex = new VoxelIndex();
        this.textureSize = 0;
        this.regl = regl;
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.tIndex = this.regl.texture();
        this.tRGB = this.regl.texture();
        this.tRMET = this.regl.texture();
        this.tRi = this.regl.texture();
    }
    Stage.prototype.getWidth = function () {
        return this.width;
    };
    Stage.prototype.getHeight = function () {
        return this.height;
    };
    Stage.prototype.getDepth = function () {
        return this.depth;
    };
    Stage.prototype.key = function (x, y, z) {
        return x + " " + y + " " + z;
    };
    Stage.prototype.set = function (x, y, z, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.red, red = _c === void 0 ? 1 : _c, _d = _b.green, green = _d === void 0 ? 1 : _d, _e = _b.blue, blue = _e === void 0 ? 1 : _e, _f = _b.rough, rough = _f === void 0 ? 255 : _f, _g = _b.metal, metal = _g === void 0 ? 0 : _g, _h = _b.emit, emit = _h === void 0 ? 0 : _h, _j = _b.transparent, transparent = _j === void 0 ? 0 : _j, _k = _b.refract, refract = _k === void 0 ? 1 : _k;
        if (x < 0 || x >= this.width) {
            throw new Error('Voxel: set out of bounds.');
        }
        if (y < 0 || y >= this.height) {
            throw new Error('Voxel: set out of bounds.');
        }
        if (z < 0 || z >= this.depth) {
            throw new Error('Voxel: set out of bounds.');
        }
        this.data[this.key(x, y, z)] = {
            x: x, y: y, z: z,
            red: Math.round(red * 255),
            green: Math.round(green * 255),
            blue: Math.round(blue * 255),
            rough: rough,
            metal: metal,
            emit: emit,
            transparent: transparent,
            refract: refract,
        };
    };
    Stage.prototype.updateBounds = function (width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
    };
    Stage.prototype.unset = function (x, y, z) {
        if (Object.keys(this.data).length === 1) {
            return;
        }
        delete this.data[this.key(x, y, z)];
    };
    Stage.prototype.get = function (x, y, z) {
        return this.data[this.key(x, y, z)];
    };
    Stage.prototype.clear = function () {
        this.vIndex.clear();
        this.data = {};
    };
    Stage.prototype.update = function () {
        this.textureSize = 1;
        var volume = this.width * this.height * this.depth;
        while (this.textureSize * this.textureSize < volume) {
            this.textureSize *= 2;
        }
        var aIndex = new Uint8Array(this.textureSize * this.textureSize * 2);
        fill_1.fillArray(aIndex, 0);
        for (var _i = 0, _a = Object.entries(this.data); _i < _a.length; _i++) {
            var _b = _a[_i], _ = _b[0], v = _b[1];
            var vi = this.vIndex.get(v);
            var ai = v.y * this.width * this.depth + v.z * this.width + v.x;
            aIndex[ai * 2 + 0] = vi[0];
            aIndex[ai * 2 + 1] = vi[1];
        }
        this.tIndex({
            width: this.textureSize,
            height: this.textureSize,
            format: 'luminance alpha',
            data: aIndex,
        });
        this.tRGB({
            width: 256,
            height: 256,
            format: 'rgb',
            data: this.vIndex.aRGB,
        });
        this.tRMET({
            width: 256,
            height: 256,
            format: 'rgba',
            type: 'uint8',
            data: this.vIndex.aRMET,
        });
        this.tRi({
            width: 256,
            height: 256,
            format: 'luminance',
            type: 'uint8',
            data: this.vIndex.aRi,
        });
    };
    return Stage;
}());
exports.Stage = Stage;
//# sourceMappingURL=stage.js.map