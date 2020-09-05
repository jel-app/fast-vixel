import { vec3, mat4, ReadonlyVec3 } from 'gl-matrix';
import { create2DSkyMapRenderer } from './atmosphereEnvmap2d';
import { PingPong } from './pingpong';
import { Camera } from  './camera';
import { REGL, safeProp, REGLLoader } from './regl';
import { Framebuffer2D, Texture2D } from 'regl';

type SampleOpts = {
  groundColor:vec3|number[];
  groundRoughness:number;
  groundMetalness:number;
  time:number;
  azimuth:number,
  lightRadius:number,
  lightIntensity:number,
  dofDist:number,
  dofMag:number,
  count:number,
};

type SampleProps = {
  source:Framebuffer2D,
  invpv:mat4,
  eye:vec3|number[],
  res:number[],
  tOffset:number[],
  tRGB:Texture2D,
  tRMET:Texture2D,
  tRi:Texture2D,
  tIndex:Texture2D,
  dofDist:number,
  dofMag:number,
  resStage:number,
  bounds:vec3|number[],
  lightPosition:vec3|number[],
  lightIntensity:number,
  lightRadius:number,
  groundColor:vec3|number[],
  groundRoughness:number,
  groundMetalness:number,
  destination:Framebuffer2D,
  viewport:{ x:number, y:number, width:number, height:number },
};

type DisplayProps = {
  source:Framebuffer2D,
  viewport:{ x:number, y:number, width:number, height:number },
};

export function getRenderer(regl:REGL, reglLoader:REGLLoader) {
  const canvas:HTMLCanvasElement = regl._gl.canvas as HTMLCanvasElement;
  const sunDistance = 149600000000;
  // let enableCubeMap = true;

  const sunPosition = vec3.scale(
    vec3.create(),
    vec3.normalize(vec3.create(), [1.11, -0.0, 0.25]),
    sunDistance,
  );

  const renderSkyMap2D = create2DSkyMapRenderer(regl);

  const skyMap = renderSkyMap2D({
    sunDirection: vec3.normalize(vec3.create(), sunPosition as ReadonlyVec3),
    resolution: 1024,
  });

  const pingpong = PingPong(regl, {
    width: canvas.offsetWidth,
    height: canvas.offsetHeight,
    colorType: 'float',
  });

  const ndcBox = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
  const tRandSize = 512; //1024;

  const t2Sphere = (function() {
    const data = new Float32Array(tRandSize * tRandSize * 3);
    for (let i = 0; i < tRandSize * tRandSize; i++) {
      const r = vec3.random(vec3.create()); // 单位向量
      data[i * 3 + 0] = r[0];
      data[i * 3 + 1] = r[1];
      data[i * 3 + 2] = r[2];
    }
    return regl.texture({
      width: tRandSize,
      height: tRandSize,
      format: 'rgb',
      type: 'float',
      data: data,
      wrap: 'repeat',
    });
  })();

  const t3Sphere = (function() {
    const data = new Float32Array(tRandSize * tRandSize * 3);
    for (let i = 0; i < tRandSize * tRandSize; i++) {
      const r = vec3.random(vec3.create(), Math.random());
      data[i * 3 + 0] = r[0];
      data[i * 3 + 1] = r[1];
      data[i * 3 + 2] = r[2];
    }
    return regl.texture({
      width: tRandSize,
      height: tRandSize,
      format: 'rgb',
      type: 'float',
      data: data,
      wrap: 'repeat',
    });
  })();

  const tUniform2 = (function() {
    const data = new Float32Array(tRandSize * tRandSize * 2);
    for (let i = 0; i < tRandSize * tRandSize; i++) {
      data[i * 2 + 0] = Math.random();
      data[i * 2 + 1] = Math.random();
    }
    return regl.texture({
      width: tRandSize,
      height: tRandSize,
      format: 'luminance alpha',
      type: 'float',
      data: data,
      wrap: 'repeat',
    });
  })();

  const tUniform1 = (function() {
    const data = new Float32Array(tRandSize * tRandSize * 1);
    for (let i = 0; i < tRandSize * tRandSize; i++) {
      data[i] = Math.random();
    }
    return regl.texture({
      width: tRandSize,
      height: tRandSize,
      format: 'luminance',
      type: 'float',
      data: data,
      wrap: 'repeat',
    });
  })();
  const sampleProps = safeProp<SampleProps>(regl);
  const cmdSample = reglLoader.cache<SampleProps, {}>(
    'voxel-sample',
    {
      vert: `
        precision highp float;
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0, 1);
        }
      `,
      frag: require('./glsl/sample.glsl'),
      attributes: {
        position: ndcBox,
      },
      uniforms: {
        tSky: skyMap,
        tUniform1: tUniform1,
        tUniform2: tUniform2,
        t2Sphere: t2Sphere,
        t3Sphere: t3Sphere,
        invResRand: [1 / tRandSize, 1 / tRandSize],
        source: sampleProps('source').prop,
        invpv: sampleProps('invpv').prop,
        eye: sampleProps('eye').prop,
        res: sampleProps('res').prop,
        tOffset: sampleProps('tOffset').prop,
        tRGB: sampleProps('tRGB').prop,
        tRMET: sampleProps('tRMET').prop,
        tRi: sampleProps('tRi').prop,
        tIndex: sampleProps('tIndex').prop,
        dofDist: sampleProps('dofDist').prop,
        dofMag: sampleProps('dofMag').prop,
        resStage: sampleProps('resStage').prop,
        lightPosition: sampleProps('lightPosition').prop,
        lightIntensity: sampleProps('lightIntensity').prop,
        lightRadius: sampleProps('lightRadius').prop,
        groundColor: sampleProps('groundColor').prop,
        groundRoughness: sampleProps('groundRoughness').prop,
        groundMetalness: sampleProps('groundMetalness').prop,
        bounds: sampleProps('bounds').prop,
      },
      depth: {
        enable: false,
        mask: false,
      },
      viewport: sampleProps('viewport').prop,
      framebuffer: sampleProps('destination').prop,
      count: 6,
    },
    true,
    // {
    //   ENVMAP: () => {
    //     console.log('ENVMAP', enableCubeMap);
    //     return enableCubeMap;
    //   },
    // },
  );

  const displayProps = safeProp<DisplayProps>(regl);
  const cmdDisplay = regl({
    vert: `
    precision highp float;
    attribute vec2 position;
    varying vec2 vPos;
    void main() {
      gl_Position = vec4(position, 0, 1);
      vPos = 0.5 * position + 0.5;
    }
    `,
    frag: `
    precision highp float;
    uniform sampler2D source;
    varying vec2 vPos;
    void main() {
      vec4 src = texture2D(source, vPos);
      vec3 color = src.rgb/max(src.a, 1.0);
      color = pow(color, vec3(1.0/2.2));
      gl_FragColor = vec4(color, 1);
    }
    `,
    attributes: {
      position: ndcBox,
    },
    uniforms: {
      source: displayProps('source').prop,
    },
    depth: {
      enable: false,
      mask: false,
    },
    viewport: displayProps('viewport').prop,
    count: 6,
  });

  function calculateSunPosition(time, azimuth) {
    const theta = (2 * Math.PI * (time - 6)) / 24;
    return [
      sunDistance * Math.cos(azimuth) * Math.cos(theta),
      sunDistance * Math.sin(theta),
      sunDistance * Math.sin(azimuth) * Math.cos(theta),
    ];
  }

  function computeNewEnvMap(sunPos:vec3|number[]) {
    // if (enableCubeMap) {
    //   if (skyMap.name === 'reglFramebuffer') {
    //     skyMap.destroy();
    //     skyMap = renderSkyMap({
    //       sunDirection: vec3.normalize(vec3.create(), sunPos as ReadonlyVec3),
    //       resolution: 1024,
    //     });
    //   } else {
    //     renderSkyMap({
    //       sunDirection: vec3.normalize(vec3.create(), sunPos as ReadonlyVec3),
    //       cubeFBO: skyMap,
    //     });
    //   }
    // } else {
    //   if (skyMap.name === 'reglFramebufferCube') {
    //     skyMap.destroy();
    //     skyMap = renderSkyMap2D({
    //       sunDirection: vec3.normalize(vec3.create(), sunPos as ReadonlyVec3),
    //       resolution: 1024,
    //     });
    //   } else {
    //   }
    // }
    renderSkyMap2D({
      sunDirection: vec3.normalize(vec3.create(), sunPos as ReadonlyVec3),
      envFBO: skyMap,
    });
  }

  let sampleCount = 0;
  function sample(stage, camera:Camera, opts:SampleOpts) {
    const sp = (calculateSunPosition(opts.time, opts.azimuth) as any) as ReadonlyVec3;
    if (vec3.distance(sp, sunPosition as ReadonlyVec3) > 0.001) {
      (sunPosition as ReadonlyVec3) = sp;
      computeNewEnvMap(sunPosition);
    }
    for (let i = 0; i < opts.count; i++) {
      cmdSample({
        source: pingpong.ping(),
        invpv: camera.invpv(),
        eye: camera.eye,
        res: [canvas.offsetWidth, canvas.offsetHeight],
        tOffset: [Math.random(), Math.random()],
        tRGB: stage.tRGB,
        tRMET: stage.tRMET,
        tRi: stage.tRi,
        tIndex: stage.tIndex,
        dofDist: opts.dofDist,
        dofMag: opts.dofMag,
        resStage: stage.tIndex.width,
        bounds: [stage.width, stage.height, stage.depth],
        lightPosition: sunPosition,
        lightIntensity: opts.lightIntensity,
        lightRadius: 695508000 * opts.lightRadius,
        groundColor: opts.groundColor,
        groundRoughness: opts.groundRoughness,
        groundMetalness: opts.groundMetalness,
        destination: pingpong.pong(),
        viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      });
      pingpong.swap();
      sampleCount++;
    }
  }

  function display() {
    cmdDisplay({
      source: pingpong.ping(),
      viewport: { x: 0, y: 0, width: canvas.width, height: canvas.height},
    });
  }

  function reset() {
    if (pingpong.ping().width !== canvas.offsetWidth ||
        pingpong.ping().height !== canvas.offsetHeight) {
      pingpong.ping()({
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        colorType: 'float',
      });
      pingpong.pong()({
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        colorType: 'float',
      });
    }
    regl.clear({ color: [0, 0, 0, 0], framebuffer: pingpong.ping() });
    regl.clear({ color: [0, 0, 0, 0], framebuffer: pingpong.pong() });
    sampleCount = 0;
  }

  return {
    sample,
    display,
    reset,
    // useCubeMap: (flag:boolean) => {
    //   enableCubeMap = flag;
    // },
    sampleCount: () => {
      return sampleCount;
    },
  };
}