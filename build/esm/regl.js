"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeProp = exports.createREGLCache = exports.CachedREGLCommand = void 0;
function _moduleLoader(_) {
    return void 0;
}
var CachedREGLCommand = (function () {
    function CachedREGLCommand(flagFunc, flags, cmd) {
        this.flagFunc = flagFunc;
        this.flags = flags;
        this.cmd = cmd;
    }
    CachedREGLCommand.prototype.test = function (state) {
        var _a = this, flags = _a.flags, flagFunc = _a.flagFunc;
        for (var i = 0; i < flags.length; ++i) {
            if (flags[i] !== +flagFunc[i](state)) {
                return false;
            }
        }
        return true;
    };
    return CachedREGLCommand;
}());
exports.CachedREGLCommand = CachedREGLCommand;
function createREGLCache(regl, profile) {
    var definitionCache = [];
    var valueCache = [];
    var commandCache = {};
    var commandDefinitionSet = [];
    var type = 'half float';
    var filter = 'linear';
    if (regl.hasExtension('OES_texture_half_float')) {
        if (!regl.hasExtension('OES_texture_half_float_linear')) {
            filter = 'nearest';
        }
    }
    else if (regl.hasExtension('OES_texture_float')) {
        type = 'float';
        if (!regl.hasExtension('OES_texture_float_linear')) {
            filter = 'nearest';
        }
    }
    else {
        type = 'uint8';
    }
    if (type !== 'uint8') {
        var gl = regl._gl;
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        var color = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, color);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, (type === 'float' ? gl.FLOAT : 0x8D61), null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
        if (gl.getError() || gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            type = 'uint8';
            filter = 'linear';
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(color);
        regl._refresh();
    }
    function preloadShaders(state) {
        for (var i = 0; i < commandDefinitionSet.length; ++i) {
            (commandDefinitionSet[i])(state);
        }
    }
    var loader = {
        regl: regl,
        cache: cacheCommand,
        require: requireModule,
        stats: function () {
            var result = {};
            Object.keys(commandCache).map(function (key) {
                var commands = commandCache[key];
                var x = {
                    count: 0,
                    cpuTime: 0,
                    gpuTime: 0,
                };
                for (var i = 0; i < commands.length; ++i) {
                    x.count += commands[i].cmd.stats.count;
                    x.cpuTime += commands[i].cmd.stats.cpuTime;
                    x.gpuTime += commands[i].cmd.stats.gpuTime;
                }
                result[key] = x;
            });
            return result;
        },
        floatBuffer: {
            type: type,
            filter: filter,
        },
        preloadShaders: preloadShaders,
    };
    function cacheCommand(name, commandSpec, noProfile, flags) {
        var commandList = [];
        var baseFrag = commandSpec.frag;
        var baseVert = commandSpec.vert;
        if (baseFrag && regl.hasExtension('OES_standard_derivatives')) {
            baseFrag = '#extension GL_OES_standard_derivatives : enable\n' + baseFrag;
        }
        if (baseFrag && regl.hasExtension('EXT_shader_texture_lod')) {
            baseFrag = '#extension GL_EXT_shader_texture_lod : enable\n' + baseFrag;
        }
        if (!flags) {
            var spec = Object.assign(__assign(__assign({}, commandSpec), { profile: profile && !noProfile }));
            if (baseFrag) {
                spec.frag = baseFrag;
            }
            if (baseVert) {
                spec.vert = baseVert;
            }
            var cmd = regl(spec);
            commandList.push(new CachedREGLCommand([], [], cmd));
            return cmd;
        }
        commandCache[name] = commandList;
        var flagSymbol = Object.keys(flags);
        var flagFunc = flagSymbol.map(function (sym) { return flags[sym]; });
        function generatePrefix(flagVals) {
            var result = [];
            for (var i = 0; i < flagSymbol.length; ++i) {
                if (flagVals[i]) {
                    result.push("#define " + flagSymbol[i] + " " + flagVals[i].toFixed(1));
                }
            }
            return result.join('\n') + '\n';
        }
        function generateCommand(state) {
            var flagVals = flagFunc.map(function (f) { return +f(state); });
            var cmd = regl(__assign(__assign({}, commandSpec), { frag: generatePrefix(flagVals) + baseFrag, vert: generatePrefix(flagVals) + baseVert, profile: profile }));
            commandList.unshift(new CachedREGLCommand(flagFunc, flagVals, cmd));
            return cmd;
        }
        function getCommand(state) {
            for (var i = 0; i < commandList.length; ++i) {
                var cmd = commandList[i];
                if (cmd.test(state)) {
                    if (i > 0) {
                        for (var j = i; j > 0; --j) {
                            commandList[j] = commandList[j - 1];
                        }
                        commandList[0] = cmd;
                    }
                    return cmd.cmd;
                }
            }
            return generateCommand(state);
        }
        commandDefinitionSet.push(getCommand);
        return getCommand;
    }
    function requireModule(moduleDefinition) {
        var idx = definitionCache.indexOf(moduleDefinition);
        if (idx >= 0) {
            return valueCache[idx];
        }
        var moduleValue = moduleDefinition(regl, loader);
        definitionCache.push(moduleDefinition);
        valueCache.push(moduleValue);
        return moduleValue;
    }
    return loader;
}
exports.createREGLCache = createREGLCache;
function safeProp(regl) {
    function next(ret, prop) {
        function m(key) {
            var r = ret.slice();
            r.push(key);
            var p = regl.prop(r.join('.'));
            return next(r, p);
        }
        return Object.assign(m, {
            prop: prop,
        });
    }
    var _prop = regl.prop('');
    return next([], (function (_, x) { return x; }));
}
exports.safeProp = safeProp;
//# sourceMappingURL=regl.js.map