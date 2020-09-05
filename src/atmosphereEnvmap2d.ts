import { vec3, mat4 } from 'gl-matrix';
import { REGL, safeProp } from './regl';
import { Framebuffer2D } from 'regl';

type envmap2dOpts = {
  sunDirection?:vec3|number[];
  resolution?:number;
  envFBO?:Framebuffer2D;
};

type env2dMapOpts = {
  resolution?:number;
  envFBO?:Framebuffer2D;
};

type atmosphereProp = {
  sundir:vec3|number[],
  view:mat4,
  projection:mat4,
  framebuffer:Framebuffer2D,
};

export function create2DSkyMapRenderer(regl:REGL) {
  const prop = safeProp<atmosphereProp>(regl);
  const envmap2dCommand = regl({
    vert: `
      precision highp float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = position;
        gl_Position = vec4(position, 0.999, 1);
      }
    `,
    frag: require('./glsl/atmosphere_envmap2d.glsl'),
    attributes: {
      position: [
        -4, 0,
        4, -4,
        4, 4,
      ],
    },
    uniforms: {
      sundir: prop('sundir').prop,
    },
    primitive: 'triangles',
    framebuffer: prop('framebuffer').prop,
    count: 3,
  });

  function render(opts:envmap2dOpts) {
    const sunDirection = opts.sunDirection || [0, 0.25, -1];
    const resolution = opts.resolution || 1024;

    function renderer(config) {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1,
        framebuffer: config.framebuffer,
      });
      envmap2dCommand({
        framebuffer: config.framebuffer,
        sundir: sunDirection,
      });
    }
    return render2dEnvmap(regl, renderer, {
      resolution,
      envFBO: opts.envFBO,
    });
  }
  return render;
}

function render2dEnvmap(regl, renderer, opts:env2dMapOpts) : Framebuffer2D {
  const resolution = opts.resolution || 1024;
  const envFBO = opts.envFBO === undefined ?
          regl.framebuffer({
            color: regl.texture({
                width: resolution * 2,
                height: resolution,
                type: 'float',
                format: 'rgba',
            }),
            depthStencil: false,
        }) : opts.envFBO;
  renderer({
    framebuffer: envFBO,
  });
  return envFBO;
}