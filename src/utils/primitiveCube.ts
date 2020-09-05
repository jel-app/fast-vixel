/**
 * the code is from https://github.com/vorg/primitive-cube
 */
export function createCube(sx:number, sy:number, sz:number, nx:number, ny:number, nz:number) {

    let vertexIndex = 0;
    const positions:number[][] = [];
    const normals:number[][] = [];
    const uvs:number[][] = [];
    const cells:number[][] = [];

    function makePlane(u:number, v:number, w:number, su:number, sv:number, nu:number, nv:number, pw:number, flipu:number, flipv:number) {
        const vertShift = vertexIndex;
        for (let j=0; j <= nv; j++) {
            for (let i=0; i <= nu; i++) {
            const vert = positions[vertexIndex] = [0, 0, 0];
            vert[u] = (-su / 2 + i * su / nu) * flipu;
            vert[v] = (-sv / 2 + j * sv / nv) * flipv;
            vert[w] = pw;

            const normal = normals[vertexIndex] = [0, 0, 0];
            normal[u] = 0;
            normal[v] = 0;
            normal[w] = pw / Math.abs(pw);

            const texCoord = uvs[vertexIndex] = [0, 0];
            texCoord[0] = i / nu;
            texCoord[1] = 1.0 - j / nv;

            ++vertexIndex;
            }
        }

        for (let j=0; j < nv; j++) {
            for (let i=0; i < nu; i++) {
                const n = vertShift + j * (nu + 1) + i;
                cells.push([n, n + nu  + 1, n + nu + 2]);
                cells.push([n, n + nu + 2, n + 1]);
            }
        }
    }

    makePlane(0, 1, 2, sx, sy, nx, ny,  sz / 2,  1, -1); //front
    makePlane(0, 1, 2, sx, sy, nx, ny, -sz / 2, -1, -1); //back
    makePlane(2, 1, 0, sz, sy, nz, ny, -sx / 2,  1, -1); //left
    makePlane(2, 1, 0, sz, sy, nz, ny,  sx / 2, -1, -1); //right
    makePlane(0, 2, 1, sx, sz, nx, nz,  sy / 2,  1,  1); //top
    makePlane(0, 2, 1, sx, sz, nx, nz, -sy / 2,  1, -1); //bottom

    return {
        positions,
        normals,
        uvs,
        cells,
    };
}