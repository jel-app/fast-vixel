import { vec3 } from 'gl-matrix';
import { Camera } from './camera';
import { REGL, REGLLoader } from './regl';
declare type SampleOpts = {
    groundColor: vec3 | number[];
    groundRoughness: number;
    groundMetalness: number;
    time: number;
    azimuth: number;
    lightRadius: number;
    lightIntensity: number;
    dofDist: number;
    dofMag: number;
    count: number;
};
export declare function getRenderer(regl: REGL, reglLoader: REGLLoader): {
    sample: (stage: any, camera: Camera, opts: SampleOpts) => void;
    display: () => void;
    reset: () => void;
    sampleCount: () => number;
};
export {};
