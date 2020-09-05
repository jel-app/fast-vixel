import { fillArray } from './utils/fill';
import { Texture2D } from 'regl';

export class VoxelIndex {
  public aRGB:Uint8Array;
  public aRMET:Uint8Array;
  public aRi:Uint8Array;
  public x:number = -1;
  public y:number = -1;
  public keys:any = {};

  constructor() {
    this.aRGB = new Uint8Array(256 * 256 * 3);
    this.aRMET = new Uint8Array(256 * 256 * 4);
    this.aRi = new Uint8Array(256 * 256);
    this.clear();

    if (!Object.entries) {
      Object.entries = function(obj) {
        const ownProps = Object.keys(obj);
        let i = ownProps.length;
        const resArray = new Array(i); // preallocate the Array
        while (i--) {
          resArray[i] = [ownProps[i], obj[ownProps[i]]];
        }
        return resArray;
      };
    }
  }

  public clear() {
    fillArray(this.aRGB, 0);
    fillArray(this.aRMET, 0);
    fillArray(this.aRi, 0);
    this.x = 1;
    this.y = 0;
    this.keys = {};
  }

  public get(v) : number[] {
    const h = `${v.red} ${v.green} ${v.blue} ${v.rough} ${v.metal} ${v.emit} ${v.transparent} ${v.refract}`;
    if (this.keys[h] === undefined) {
      // 将 voxel 的 color、pbr 信息存储进一张 texture 中，这里就是计算将会存储在 texture 中的坐标值
      this.x++;
      if (this.x > 255) {
        this.x = 0;
        this.y++;
        if (this.y > 255) {
          throw new Error('Exceeded voxel type limit of 65536');
        }
      }
      this.keys[h] = [this.x, this.y];
      const i = this.y * 256 + this.x;
      this.aRGB[i * 3 + 0] = v.red;
      this.aRGB[i * 3 + 1] = v.green;
      this.aRGB[i * 3 + 2] = v.blue;
      this.aRMET[i * 4 + 0] = v.rough;
      this.aRMET[i * 4 + 1] = v.metal;
      this.aRMET[i * 4 + 2] = v.emit;
      this.aRMET[i * 4 + 3] = v.transparent;
      this.aRi[i] = v.refract;
    }
    return this.keys[h];
  }
}

type pbrVoxelData = {
  x:number;
  y:number;
  z:number;
  red:number;
  green:number;
  blue:number;
  rough:number,
  metal:number,
  emit:number;
  transparent:number;
  refract:number;
};

export class Stage {
  private regl:any;
  private width:number;
  private height:number;
  private depth:number;
  private data:{[key:string]:pbrVoxelData} = {};
  private vIndex = new VoxelIndex();
  private tIndex:Texture2D;
  private tRGB:Texture2D;
  private tRMET:Texture2D;
  private tRi:Texture2D;
  private textureSize = 0;

  constructor(regl, width, height, depth) {
    this.regl = regl;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.tIndex = this.regl.texture();
    this.tRGB = this.regl.texture();
    this.tRMET = this.regl.texture();
    this.tRi = this.regl.texture();
  }

  public getWidth() {
    return this.width;
  }

  public getHeight() {
    return this.height;
  }

  public getDepth() {
    return this.depth;
  }

  public key(x, y, z) {
    return `${x} ${y} ${z}`;
  }

  public set(x, y, z, {
                      red = 1,
                      green = 1,
                      blue = 1,
                      rough = 255,
                      metal = 0,
                      emit = 0,
                      transparent = 0,
                      refract = 1,
                      } = {}) {
    if (x < 0 || x >= this.width) {
      throw new Error('Voxel: set out of bounds.');
    }
    if (y < 0 || y >= this.height) {
      throw new Error('Voxel: set out of bounds.');
    }
    if (z < 0 || z >= this.depth) {
      throw new Error('Voxel: set out of bounds.');
    }
    this.data[this.key(x, y, z)] = {
      x, y, z,
      red: Math.round(red * 255),
      green: Math.round(green * 255),
      blue: Math.round(blue * 255),
      rough,
      metal,
      emit,
      transparent,
      refract,
    };
  }

  public updateBounds(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
  }

  public unset(x, y, z) {
    if (Object.keys(this.data).length === 1) {
      return;
    }
    delete this.data[this.key(x, y, z)];
  }

  public get(x, y, z) {
    return this.data[this.key(x, y, z)];
  }

  public clear() {
    this.vIndex.clear();
    this.data = {};
  }

  public update() {
    this.textureSize = 1;
    const volume = this.width * this.height * this.depth;
    while (this.textureSize * this.textureSize < volume) {
      this.textureSize *= 2;
    }
    const aIndex = new Uint8Array(this.textureSize * this.textureSize * 2);
    fillArray(aIndex, 0);
    // data 记录着 类似 voxelView 中的 data， 记录着所有方块的坐标
    for (const [_, v] of Object.entries(this.data)) {
      // 如何将三维的 x，y，z 数据映射到 二维 的数组中是需要特别注意的。
      const vi = this.vIndex.get(v); // 存儲材質，得到材質表中的存儲 “座標”
      const ai = v.y * this.width * this.depth + v.z * this.width + v.x;
      aIndex[ai * 2 + 0] = vi[0];
      aIndex[ai * 2 + 1] = vi[1];
    }
    // pack coordination, rgb, pbr data into texture
    this.tIndex({
      width: this.textureSize,
      height: this.textureSize,
      format: 'luminance alpha',
      data: aIndex,
    });
    this.tRGB({
      width: 256,
      height: 256,
      format: 'rgb',
      data: this.vIndex.aRGB,
    });
    this.tRMET({
      width: 256,
      height: 256,
      format: 'rgba',
      type: 'uint8',
      data: this.vIndex.aRMET,
    });
    this.tRi({
      width: 256,
      height: 256,
      format: 'luminance',
      type: 'uint8',
      data: this.vIndex.aRi,
    });
  }
}