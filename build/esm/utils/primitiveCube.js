"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCube = void 0;
function createCube(sx, sy, sz, nx, ny, nz) {
    var vertexIndex = 0;
    var positions = [];
    var normals = [];
    var uvs = [];
    var cells = [];
    function makePlane(u, v, w, su, sv, nu, nv, pw, flipu, flipv) {
        var vertShift = vertexIndex;
        for (var j = 0; j <= nv; j++) {
            for (var i = 0; i <= nu; i++) {
                var vert = positions[vertexIndex] = [0, 0, 0];
                vert[u] = (-su / 2 + i * su / nu) * flipu;
                vert[v] = (-sv / 2 + j * sv / nv) * flipv;
                vert[w] = pw;
                var normal = normals[vertexIndex] = [0, 0, 0];
                normal[u] = 0;
                normal[v] = 0;
                normal[w] = pw / Math.abs(pw);
                var texCoord = uvs[vertexIndex] = [0, 0];
                texCoord[0] = i / nu;
                texCoord[1] = 1.0 - j / nv;
                ++vertexIndex;
            }
        }
        for (var j = 0; j < nv; j++) {
            for (var i = 0; i < nu; i++) {
                var n = vertShift + j * (nu + 1) + i;
                cells.push([n, n + nu + 1, n + nu + 2]);
                cells.push([n, n + nu + 2, n + 1]);
            }
        }
    }
    makePlane(0, 1, 2, sx, sy, nx, ny, sz / 2, 1, -1);
    makePlane(0, 1, 2, sx, sy, nx, ny, -sz / 2, -1, -1);
    makePlane(2, 1, 0, sz, sy, nz, ny, -sx / 2, 1, -1);
    makePlane(2, 1, 0, sz, sy, nz, ny, sx / 2, -1, -1);
    makePlane(0, 2, 1, sx, sz, nx, nz, sy / 2, 1, 1);
    makePlane(0, 2, 1, sx, sz, nx, nz, -sy / 2, 1, -1);
    return {
        positions: positions,
        normals: normals,
        uvs: uvs,
        cells: cells,
    };
}
exports.createCube = createCube;
//# sourceMappingURL=primitiveCube.js.map