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
    constructor(regl: any, width: any, height: any, depth: any);
    getWidth(): number;
    getHeight(): number;
    getDepth(): number;
    key(x: any, y: any, z: any): string;
    set(x: any, y: any, z: any, { red, green, blue, rough, metal, emit, transparent, refract, }?: {
        red?: number | undefined;
        green?: number | undefined;
        blue?: number | undefined;
        rough?: number | undefined;
        metal?: number | undefined;
        emit?: number | undefined;
        transparent?: number | undefined;
        refract?: number | undefined;
    }): void;
    updateBounds(width: any, height: any, depth: any): void;
    unset(x: any, y: any, z: any): void;
    get(x: any, y: any, z: any): pbrVoxelData;
    clear(): void;
    update(): void;
}
export {};
