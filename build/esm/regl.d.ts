import _REGL = require('regl');
export declare type REGL = _REGL.Regl;
declare function _moduleLoader<ModType>(_: (regl: _REGL.Regl, requireREGL: REGLLoader) => ModType): ModType;
export interface REGLProfileData {
    count: number;
    cpuTime: number;
    gpuTime: number;
}
export interface REGLLoader {
    regl: _REGL.Regl;
    require: typeof _moduleLoader;
    cache: <StateType, PropType>(name: string, commandSpec: _REGL.DrawConfig, profile: boolean, flags?: {
        [symbol: string]: (state: StateType) => boolean | number;
    }) => (state: StateType) => (prop?: PropType, ...rest: any[]) => void;
    stats: () => {
        [name: string]: REGLProfileData;
    };
    floatBuffer: {
        type: 'uint8' | 'half float' | 'float';
        filter: 'nearest' | 'linear';
    };
    preloadShaders: <PropType>(state: PropType) => void;
}
export declare class CachedREGLCommand {
    flagFunc: ((state: any) => number | boolean)[];
    flags: number[];
    cmd: any;
    constructor(flagFunc: ((state: any) => number | boolean)[], flags: number[], cmd: any);
    test(state: any): boolean;
}
export declare function createREGLCache(regl: any, profile: boolean): REGLLoader;
export declare function safeProp<PropType>(regl: _REGL.Regl): (<K extends keyof PropType>(key: K) => (<K_1 extends keyof PropType[K]>(key: K_1) => (<K_2 extends keyof PropType[K][K_1]>(key: K_2) => (<K_3 extends keyof PropType[K][K_1][K_2]>(key: K_3) => (<K_4 extends keyof PropType[K][K_1][K_2][K_3]>(key: K_4) => (<K_5 extends keyof PropType[K][K_1][K_2][K_3][K_4]>(key: K_5) => (<K_6 extends keyof PropType[K][K_1][K_2][K_3][K_4][K_5]>(key: K_6) => (<K_7 extends keyof PropType[K][K_1][K_2][K_3][K_4][K_5][K_6]>(key: K_7) => (<K_8 extends keyof PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7]>(key: K_8) => (<K_9 extends keyof PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7][K_8]>(key: K_9) => (<K_10 extends keyof PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7][K_8][K_9]>(key: K_10) => any & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7][K_8][K_9][K_10]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7][K_8][K_9]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7][K_8]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4][K_5][K_6][K_7]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4][K_5][K_6]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4][K_5]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3][K_4]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2][K_3]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1][K_2]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K][K_1]>;
}) & {
    prop: _REGL.DynamicVariable<PropType[K]>;
}) & {
    prop: _REGL.DynamicVariable<PropType>;
};
export {};
