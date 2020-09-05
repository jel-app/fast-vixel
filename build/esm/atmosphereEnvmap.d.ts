import { vec3 } from 'gl-matrix';
import { REGL } from './regl';
declare type envmapOpts = {
    sunDirection?: vec3 | number[];
    resolution?: number;
    cubeFBO?: any;
};
export declare function createSkyMapRenderer(regl: REGL): (opts: envmapOpts) => any;
export {};
