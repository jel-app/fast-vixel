import { vec3 } from 'gl-matrix';
export declare class PBRRenderer {
    private renderer;
    private stage;
    private camera;
    private _ground;
    private _sun;
    private _dof;
    private _renderDirty;
    private _stageDirty;
    private oldCanvasSize;
    private _canvas;
    _onProgressUpdate?: (progress: number) => void;
    totalSamplesCount: number;
    constructor(canvas: HTMLCanvasElement, width: any, height: any, depth: any);
    getWidth(): number;
    getHeight(): number;
    getDepth(): number;
    updateBounds(width: any, height: any, depth: any): void;
    set(x: any, y: any, z: any, opts: any): void;
    unset(x: any, y: any, z: any): void;
    get(x: any, y: any, z: any): {
        x: number;
        y: number;
        z: number;
        red: number;
        green: number;
        blue: number;
        rough: number;
        metal: number;
        emit: number;
        transparent: number;
        refract: number;
    };
    clear(): void;
    get sampleCount(): any;
    getGround(): {
        color: [number, number, number] | Float32Array | number[];
        rough: number;
        metal: number;
    };
    setGround(param: {
        color?: number[] | vec3;
        rough?: number;
        metal?: number;
    }): void;
    getSun(): {
        time: number;
        azimuth: number;
        radius: number;
        intensity: number;
    };
    setSun(param: {
        time?: number;
        azimuth?: number;
        radius?: number;
        intensity?: number;
    }): void;
    setDof(distance: number, magnitude: number): void;
    sample(count: number, totalCount?: number): void;
    display(): void;
}
