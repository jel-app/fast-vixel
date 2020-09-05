import { getRenderer } from './render';
import { Stage } from './stage';
import { Camera, CameraEvent } from  './camera';
import { vec3, ReadonlyVec3 } from 'gl-matrix';
import { createREGLCache } from './regl';
import createREGL = require('regl');

export class PBRRenderer {
    private renderer;
    private stage:Stage;
    private camera:Camera;
    private _ground:{color:vec3|number[], rough:number, metal:number} = { color: [0.55, 0.55, 0.55], rough: 1, metal: 0.6 };
    private _sun = { time: 6.2, azimuth: 0.2, radius: 16, intensity:1 };
    private _dof = { distance: 0.5, magnitude: 0 };
    private _renderDirty = true;
    private _stageDirty = true;
    private oldCanvasSize:number[];
    private _canvas;
    public _onProgressUpdate?:(progress:number) => void;
    public totalSamplesCount:number = 512;

    constructor(canvas:HTMLCanvasElement, width, height, depth) {
        this._canvas = canvas;
        const regl = createREGL({
            canvas: canvas,
            extensions: ['OES_texture_float'],
            attributes: {
                antialias: false,
                preserveDrawingBuffer: true,
            },
        });
        const reglLoader = createREGLCache(regl, true);
        this.camera = new Camera(this._canvas);
        this.renderer = getRenderer(regl, reglLoader);
        this._canvas = regl._gl.canvas;
        this.stage = new Stage(regl, width, height, depth);
        this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];

        this.camera.on(CameraEvent.cameraMoveEnd, () => {
        this._renderDirty = true;
        });
        let lastResizeTime = 0;
        window.addEventListener('resize', () => {
        lastResizeTime = Date.now();
        setTimeout(() => {
            if (Date.now() - lastResizeTime >= 500) {
            this._renderDirty = true;
            }
        }, 500);
        });
    }

    public getWidth() {
        return this.stage.getWidth();
    }

    public getHeight() {
        return this.stage.getHeight();
    }

    public getDepth() {
        return this.stage.getDepth();
    }

    public updateBounds(width, height, depth) {
        this.stage.updateBounds(width, height, depth);
        this._stageDirty = false;
    }

    public set(x, y, z, opts) {
        this.stage.set(x, y, z, opts);
        this._stageDirty = true;
    }

    public unset(x, y, z) {
        this.stage.unset(x, y, z);
        this._stageDirty = true;
    }

    public get(x, y, z) {
        return this.stage.get(x, y, z);
    }

    public clear() {
        this.stage.clear();
        this._stageDirty = true;
    }

    get sampleCount() {
        return this.renderer.sampleCount();
    }

    public getGround() {
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

    public getSun() {
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

    public setDof(distance:number, magnitude:number) {
        if (this._dof.distance === distance &&
            this._dof.magnitude === magnitude) {
        return;
        }
        this._dof.distance = distance;
        this._dof.magnitude = magnitude;
        this._renderDirty = true;
    }

    public sample(count:number, totalCount:number=Infinity) {
        if (this.oldCanvasSize[0] !== this._canvas.offsetWidth &&
            this.oldCanvasSize[1] !== this._canvas.offsetHeight) {
        this.oldCanvasSize = [this._canvas.offsetWidth, this._canvas.offsetHeight];
        this._renderDirty = true;
        }
        if (this._stageDirty) {
        this.stage.update();
        this._renderDirty = true;
        this._stageDirty = false;
        }
        if (this._renderDirty) {
        this.renderer.reset();
        this._renderDirty = false;
        }
        this.sampleCount < totalCount && this.renderer.sample(this.stage, this.camera, {
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
        this._onProgressUpdate && this._onProgressUpdate((this.sampleCount / totalCount));
    }

    public display() {
        this.renderer.display();
    }
}