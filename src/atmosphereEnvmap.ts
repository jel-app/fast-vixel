import { unindex } from './utils/unindexMesh';
import { createCube } from './utils/primitiveCube';
import { vec3, mat4, ReadonlyVec3 } from 'gl-matrix';
import { REGL, safeProp } from './regl';
import { Framebuffer2D } from 'regl';

type envmapOpts = {
  sunDirection?:vec3|number[];
  resolution?:number;
  cubeFBO?:any;
};

type envCubeMapOpts = {
  resolution?:number;
  near?:number;
  far?:number;
  eye?:vec3|number[];
  cubeFBO?:any;
};

type atmosphereProp = {
  sundir:number[]|vec3,
  view:mat4,
  projection:mat4,
  viewport:number[],
  framebuffer:Framebuffer2D,
};

export function createSkyMapRenderer(regl:REGL) {
  const rawCube = createCube(1, 1, 1, 1, 1, 1);
  const cube = unindex(rawCube.positions, rawCube.cells);
  const prop = safeProp<atmosphereProp>(regl);
  const envmapCommand = regl({
    vert: `
      precision highp float;
      attribute vec3 position;
      uniform mat4 view, projection;
      varying vec3 pos;

      void main() {
        gl_Position = projection * view * vec4(position, 1);
        pos = position;
      }
    `,
    frag: require('./glsl/atmosphere_envmap.glsl'),
    attributes: {
      position: cube,
    },
    uniforms: {
      sundir: prop('sundir').prop,
      view: prop('view').prop,
      projection: prop('projection').prop,
    },
    viewport: prop('viewport').prop,
    framebuffer: prop('framebuffer').prop,
    count: cube.length / 3,
  });

  function render(opts:envmapOpts) {
    const sunDirection = opts.sunDirection || [0, 0.25, -1];
    const resolution = opts.resolution || 1024;

    function renderer(config) {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1,
        framebuffer: config.framebuffer,
      });
      envmapCommand({
        view: config.view,
        projection: config.projection,
        viewport: config.viewport,
        framebuffer: config.framebuffer,
        sundir: sunDirection,
      });
    }
    return renderCubemap(regl, renderer, {
      resolution,
      cubeFBO: opts.cubeFBO,
    });
  }

  return render;
}

function renderCubemap(regl, renderer, opts:envCubeMapOpts) {
  const resolution = opts.resolution || 1024;
  const near = opts.near || 0.1;
  const far = opts.far || 1000;
  const eye = (opts.eye || [0, 0, 0]) as ReadonlyVec3;
  const cubeFBO = opts.cubeFBO === undefined ? regl.framebufferCube(resolution) : opts.cubeFBO;

  const faces = [
    { center: [1, 0, 0] as ReadonlyVec3, up: [0, -1, 0] as ReadonlyVec3, fbo: cubeFBO.faces[0] },
    { center: [-1, 0, 0] as ReadonlyVec3, up: [0, -1, 0] as ReadonlyVec3, fbo: cubeFBO.faces[1] },
    { center: [0, 1, 0] as ReadonlyVec3, up: [0, 0, 1] as ReadonlyVec3, fbo: cubeFBO.faces[2] },
    { center: [0, -1, 0] as ReadonlyVec3, up: [0, 0, -1] as ReadonlyVec3, fbo: cubeFBO.faces[3] },
    { center: [0, 0, 1] as ReadonlyVec3, up: [0, -1, 0] as ReadonlyVec3, fbo: cubeFBO.faces[4] },
    { center: [0, 0, -1] as ReadonlyVec3, up: [0, -1, 0] as ReadonlyVec3, fbo: cubeFBO.faces[5] },
  ];

  for (const f of faces) {
    const view = mat4.lookAt(mat4.create(), eye, vec3.add(vec3.create(), eye, f.center), f.up);
    const projection  = mat4.perspective(
      mat4.create(),
      Math.PI / 2,
      1,
      near,
      far,
    );
    const viewport = {
      x: 0,
      y: 0,
      width: cubeFBO.width,
      height: cubeFBO.height,
    };
    renderer({
      view,
      projection,
      viewport,
      framebuffer: f.fbo,
    });
  }

  return cubeFBO;
}