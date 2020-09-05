import { vec3 } from 'gl-matrix';
import { StageSerializedData } from './type';
export declare class VoxelIndex {
    aRGB: Uint8Array;
    aRMET: Uint8Array;
    aRi: Uint8Array;
    x: number;
    y: number;
    keys: any;
    constructor();
    clear(): void;
    get(v: any): number[];
}
declare type pbrVoxelData = {
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
export declare type voxleMaterialOpts = {
    red?: number;
    green?: number;
    blue?: number;
    rough?: number;
    metal?: number;
    emit?: number;
    transparent?: number;
    refract?: number;
};
export declare class Stage {
    private regl;
    private width;
    private height;
    private depth;
    private data;
    private vIndex;
    private tIndex;
    private tRGB;
    private tRMET;
    private tRi;
    private textureSize;
    constructor(regl: any, size: number[] | vec3);
    getSize(): number[];
    key(x: number, y: number, z: number): string;
    set(x: number, y: number, z: number, { red, green, blue, rough, metal, emit, transparent, refract, }: voxleMaterialOpts): void;
    setSize(width: number, height: number, depth: number): void;
    unset(x: number, y: number, z: number): void;
    get(x: number, y: number, z: number): pbrVoxelData;
    clear(): void;
    update(): void;
    serialize(): StageSerializedData;
    deserialize(d: StageSerializedData): void;
}
export {};
