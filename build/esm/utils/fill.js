"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillArray = void 0;
function fillArrayAPI(array, value) {
    array.fill(value);
}
function fillArrayPolyfill(array, value) {
    for (var i = 0; i < array.length; ++i) {
        array[i] = value;
    }
}
var typedArrayPrototype = Object.getPrototypeOf(Uint8Array).prototype;
exports.fillArray = (typedArrayPrototype && typedArrayPrototype.fill !== undefined) ? fillArrayAPI : fillArrayPolyfill;
//# sourceMappingURL=fill.js.map