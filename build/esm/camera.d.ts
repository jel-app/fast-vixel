import { vec3, mat4 } from 'gl-matrix';
import { CameraSerializedData } from './type';
export declare class Camera {
    canvas: HTMLCanvasElement;
    fov: number;
    eye: number[] | vec3;
    center: number[] | vec3;
    up: number[] | vec3;
    constructor(canvas: HTMLCanvasElement);
    view(): mat4;
    projection(): mat4;
    invpv(): mat4;
    serialize(): CameraSerializedData;
    deserialize(data: CameraSerializedData): void;
}
