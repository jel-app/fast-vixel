import { vec3 } from 'gl-matrix';
export declare type StageSerializedData = {
    version: number;
    width: number;
    height: number;
    depth: number;
    xyz: number[];
    rgb: number[];
    rough: number[];
    metal: number[];
    emit: number[];
    transparent: number[];
    refract: number[];
};
export declare type CameraSerializedData = {
    fov: number;
    eye: number[] | vec3;
    center: number[] | vec3;
    up: number[] | vec3;
};
export declare type SunAttribute = {
    time: number;
    azimuth: number;
    radius: number;
    intensity: number;
};
export declare type GroungAttribute = {
    color: vec3 | number[];
    rough: number;
    metal: number;
};
export declare type DOFAttribute = {
    distance: number;
    magnitude: number;
};
export declare type VixelSerializedData = {
    stage: StageSerializedData;
    camera: CameraSerializedData;
    dof: DOFAttribute;
    sun: SunAttribute;
    ground: GroungAttribute;
};
