"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingPong = void 0;
function PingPong(regl, opts) {
    var fbos = [regl.framebuffer(opts), regl.framebuffer(opts)];
    var index = 0;
    function ping() {
        return fbos[index];
    }
    function pong() {
        return fbos[1 - index];
    }
    function swap() {
        index = 1 - index;
    }
    function resize(width, height) {
        opts.width = width;
        opts.height = height;
        ping()(opts);
        pong()(opts);
    }
    return {
        ping: ping,
        pong: pong,
        swap: swap,
        resize: resize,
    };
}
exports.PingPong = PingPong;
//# sourceMappingURL=pingpong.js.map