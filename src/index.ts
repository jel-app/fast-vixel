import { getRenderer } from './render';
import { Stage, voxleMaterialOpts } from './stage';
import { Camera } from  './camera';
import { vec3, ReadonlyVec3 } from 'gl-matrix';
import { createREGLCache, REGL } from './regl';
import createREGL = require('regl');
import { GroungAttribute, SunAttribute, DOFAttribute, VixelSerializedData } from './type';

module.exports = class FastVixel {
    private _renderer;
    private _stage:Stage;
    private _camera:Camera;
    private _ground:GroungAttribute = { color: [1, 1, 1], rough: 1, metal: 0 };
    private _sun:SunAttribute = { time: 11, azimuth: 5, radius: 16, intensity:1 };
    private _dof:DOFAttribute = { distance: 0.5, magnitude: 0 };
    private _renderDirty = true;
    private _stageDirty = true;
    private oldCanvasSize:number[];
    private _canvas;
    public onProgressUpdate?:(progress:number) => void;
    public regl:REGL;

    constructor(opts:{
        canvas?:HTMLCanvasElement,
        size:number[]|vec3,
    } = {
        size: [32, 32, 32],
    }) {
        if (opts.canvas) {
            this._canvas = opts.canvas;
            this.regl = createREGL({
                canvas: opts.canvas,
                extensions: ['OES_texture_float'],
                attributes: {
                    antialias: false,
                    preserveDrawingBuffer: true,
                },
            });
        } else {
            this.regl = createREGL({
                extensions: ['OES_texture_float'],
                attributes: {
                    antialias: false,
                    preserveDrawingBuffer: true,
                },
            });
            this._canvas = this.regl._gl.canvas;
        }
        const reglLoader = createREGLCache(this.regl, true);
        this._camera = new Camera(this._canvas);
        this._renderer = getRenderer(this.regl, reglLoader);
        this._canvas = this.regl._gl.canvas;
        this._stage = new Stage(this.regl, opts.size);
        this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
    }

    public getSize() {
        return this._stage.getSize();
    }

    public setSize(width:number, height:number, depth:number) {
        this._stage.setSize(width, height, depth);
        this._stageDirty = false;
    }

    public set(x:number, y:number, z:number, opts:voxleMaterialOpts) {
        this._stage.set(x, y, z, opts);
        this._stageDirty = true;
    }

    public unset(x:number, y:number, z:number) {
        this._stage.unset(x, y, z);
        this._stageDirty = true;
    }

    public get(x, y, z) {
        return this._stage.get(x, y, z);
    }

    public clear() {
        this._stage.clear();
        this._stageDirty = true;
    }

    get sampleCount() {
        return this._renderer.sampleCount();
    }

    public setCamera(param:{eye?:number[]|vec3, center?:number[]|vec3, up?:number[]|vec3, fov?:number}) {
        if (param.eye && !vec3.equals(param.eye as ReadonlyVec3, this._camera.eye as ReadonlyVec3)) {
            vec3.copy(this._camera.eye as any, param.eye as ReadonlyVec3);
            this._renderDirty = true;
        }
        if (param.center && !vec3.equals(param.center as ReadonlyVec3, this._camera.center as ReadonlyVec3)) {
            vec3.copy(this._camera.center as any, param.center as ReadonlyVec3);
            this._renderDirty = true;
        }
        if (param.up && !vec3.equals(param.up as ReadonlyVec3, this._camera.up as ReadonlyVec3)) {
            vec3.copy(this._camera.up as any, param.up as ReadonlyVec3);
            this._renderDirty = true;
        }
        if (param.fov && param.fov !== this._camera.fov) {
            this._camera.fov = param.fov;
            this._renderDirty = true;
        }
    }

    public getGround() : GroungAttribute {
        return {
            color: this._ground.color,
            rough: this._ground.rough,
            metal: this._ground.metal,
        };
    }

    public setGround(param:{color?:number[]|vec3, rough?:number, metal?:number}) {
        if (param.color !== undefined && !vec3.equals(param.color as ReadonlyVec3, this._ground.color as ReadonlyVec3)) {
            this._ground.color[0] = param.color[0];
            this._ground.color[1] = param.color[1];
            this._ground.color[2] = param.color[2];
            this._renderDirty = true;
        }
        if (param.rough !== undefined && param.rough !== this._ground.rough) {
            this._ground.rough = param.rough;
            this._renderDirty = true;
        }
        if (param.metal !== undefined && param.metal !== this._ground.metal) {
            this._ground.metal = param.metal;
            this._renderDirty = true;
        }
    }

    public getSun() : SunAttribute {
        return {
            time: this._sun.time,
            azimuth: this._sun.azimuth,
            radius: this._sun.radius,
            intensity: this._sun.intensity,
        };
    }

    public setSun(param:{time?:number, azimuth?:number, radius?:number, intensity?:number}) {
        if (param.time !== undefined && param.time !== this._sun.time) {
            this._sun.time = param.time;
            this._renderDirty = true;
        }
        if (param.azimuth !== undefined && param.azimuth !== this._sun.azimuth) {
            this._sun.azimuth = param.azimuth;
            this._renderDirty = true;
        }
        if (param.radius !== undefined && param.radius !== this._sun.radius) {
            this._sun.radius = param.radius;
            this._renderDirty = true;
        }
        if (param.intensity !== undefined && param.intensity !== this._sun.intensity) {
            this._sun.intensity = param.intensity;
            this._renderDirty = true;
        }
    }

    public dof(distance:number, magnitude:number) {
        if (this._dof.distance === distance &&
            this._dof.magnitude === magnitude) {
            return;
        }
        this._dof.distance = distance;
        this._dof.magnitude = magnitude;
        this._renderDirty = true;
    }

    public sample(count:number, totalCount:number=Infinity) {
        if (totalCount <= 0) {
            totalCount = Infinity;
        }
        if (this.oldCanvasSize[0] !== this._canvas.offsetWidth &&
            this.oldCanvasSize[1] !== this._canvas.offsetHeight) {
            this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
            this._renderDirty = true;
        }
        if (this._stageDirty) {
            this._stage.update();
            this._renderDirty = true;
            this._stageDirty = false;
        }
        if (this._renderDirty) {
            this._renderer.reset();
            this._renderDirty = false;
        }
        this.sampleCount < totalCount && this._renderer.sample(this._stage, this._camera, {
            groundColor: this._ground.color,
            groundRoughness: this._ground.rough,
            groundMetalness: this._ground.metal,
            time: this._sun.time,
            azimuth: this._sun.azimuth,
            lightRadius: this._sun.radius,
            lightIntensity: this._sun.intensity,
            dofDist: this._dof.distance,
            dofMag: this._dof.magnitude,
            count: count,
        });
        if (totalCount !== Infinity) {
            this.onProgressUpdate && this.onProgressUpdate((this.sampleCount / totalCount));
        }
    }

    public display() {
        this._renderer.display();
    }

    public serialize() : VixelSerializedData {
        return {
            stage: this._stage.serialize(),
            camera: this._camera.serialize(),
            dof: JSON.parse(JSON.stringify(this._dof)),
            sun: JSON.parse(JSON.stringify(this._sun)),
            ground: JSON.parse(JSON.stringify(this._ground)),
        };
    }

    public  deserialize(data:VixelSerializedData) {
        this._stage.deserialize(data.stage);
        this._camera.deserialize(data.camera);
        this._dof = JSON.parse(JSON.stringify(data.dof));
        this._sun = JSON.parse(JSON.stringify(data.sun));
        this._ground = JSON.parse(JSON.stringify(data.ground));
        this._stageDirty = true;
        this._renderDirty = true;
    }
};