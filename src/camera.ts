import { vec3, mat4, ReadonlyVec3 } from 'gl-matrix';
import { CameraSerializedData } from './type';

export class Camera {
    public fov:number;
    public eye:number[]|vec3;
    public center:number[]|vec3;
    public up:number[]|vec3;

    constructor(public canvas:HTMLCanvasElement) {
        this.fov = Math.PI / 6;
        this.eye = [0, 0, 4];
        this.center = [0, 0, 0];
        this.up = [0, 1, 0];
    }

    public view() {
        return mat4.lookAt(
                mat4.create(),
                this.eye as ReadonlyVec3,
                this.center as ReadonlyVec3,
                this.up as ReadonlyVec3);
    }

    public projection() {
        return mat4.perspective(
            mat4.create(),
            this.fov,
            this.canvas.width / this.canvas.height,
            0.1,
            1000,
        );
    }

    public invpv() {
        const v = this.view();
        const p = this.projection();
        const pv = mat4.multiply(mat4.create(), p, v);
        return mat4.invert(mat4.create(), pv);
    }

    public serialize() : CameraSerializedData {
        return {
            fov: this.fov,
            eye: this.eye,
            center: this.center,
            up: this.up,
        };
    }

    public deserialize(data:CameraSerializedData) {
        this.fov = data.fov;
        this.eye = data.eye;
        this.center = data.center;
        this.up = data.up;
    }
}
