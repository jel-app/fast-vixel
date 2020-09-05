import { vec3 } from 'gl-matrix';
import { REGL } from './regl';
import { Framebuffer2D } from 'regl';
declare type envmap2dOpts = {
    sunDirection?: vec3 | number[];
    resolution?: number;
    envFBO?: Framebuffer2D;
};
export declare function create2DSkyMapRenderer(regl: REGL): (opts: envmap2dOpts) => Framebuffer2D;
export {};
