import { vec3 } from 'gl-matrix';

export type StageSerializedData = {
    version:number;
    width:number;
    height:number;
    depth:number;
    xyz:number[];
    rgb:number[];
    rough:number[];
    metal:number[];
    emit:number[];
    transparent:number[];
    refract:number[];
};

export type CameraSerializedData = {
    fov:number;
    eye:number[]|vec3;
    center:number[]|vec3;
    up:number[]|vec3;
};

export type SunAttribute = {
    time:number,
    azimuth:number,
    radius:number,
    intensity:number,
};

export type GroungAttribute = {
    color:vec3|number[],
    rough:number,
    metal:number,
};

export type DOFAttribute = {
    distance:number,
    magnitude:number,
};

export type VixelSerializedData = {
    stage:StageSerializedData,
    camera:CameraSerializedData,
    dof:DOFAttribute,
    sun:SunAttribute,
    ground:GroungAttribute,
}