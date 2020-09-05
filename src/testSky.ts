export = function(regl) {
  let theta = 0;
  const draw = regl({
    vert: require('../glsl/sky_test_vert.glsl'),
    frag: require('../glsl/sky_test_frag.glsl'),
    attributes: {
      aPosition: [
        -1, -1, -1,
        1, -1, -1,
        1,  1, -1,
        -1, -1, -1,
        1,  1, -1,
        -1,  1, -1],
    },
    uniforms: {
      uSunPos: () => {
        theta += 0.0125;
        return [0, Math.cos(theta) * 0.3 + 0.2, -1];
      },
    },
    count: 6,
  });

  return function() {
    draw();
  };
};