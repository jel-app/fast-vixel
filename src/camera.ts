import { mat4, vec3, quat } from 'gl-matrix';
const mouseWheel = require('mouse-wheel');
import { EventEmitter } from 'events';

const DEFAULT_FOV_Y = Math.PI / 4;
const DEFAULT_Z_NEAR = 1;
const DEFAULT_Z_FAR = 1024;
const DEFAULT_GAMMA = 2.2;
const right = new Float32Array([1, 0, 0]);
const front = new Float32Array([0, 0, 1]);

export const CameraEvent = {
    cameraMoveEnd: 'cameraMoveEnd',
    cameraMoveBegin: 'cameraMoveBegin',
};

export class Camera extends EventEmitter {
    public viewportWidth:number = 1;
    public viewportHeight:number = 1;
    public view:mat4 = mat4.create();

    public fixedView:mat4 = mat4.create();

    public projection:mat4 = mat4.create();
    public viewProjection:mat4 = mat4.create();

    public invView:mat4 = mat4.create();
    public invProjection:mat4 = mat4.create();
    public invViewProjection:mat4 = mat4.create();

    public eye:vec3 = vec3.create();
    public rotation:quat = quat.create();
    public target:vec3 = vec3.create();
    public up = new Float32Array([0, 1, 0]);

    public fovY:number = DEFAULT_FOV_Y;
    public zNear:number = DEFAULT_Z_NEAR;
    public zFar:number = DEFAULT_Z_FAR;
    public gamma:number = DEFAULT_GAMMA;

    public canvas:HTMLCanvasElement;

    private prevX = 0;
    private prevY = 0;

    private metaDown = false;
    // private ctrlDown = false;
    private startRotate = false;
    private keyThetaRotate = false;
    private keyPhiRotate = false;
    private keyZoomIn = false;
    private keyZoomOut = false;

    private lastScrollTime = 0;

    public theta = 0;
    public phi = 0;
    public distance = 10;

    public dtheta = 0;
    public dphi = 0;
    public ddistance = 0;

    public minDistance = 0.002;
    public maxDistance = 100;

    constructor(canvas:HTMLCanvasElement) {
        super();
        this.canvas = canvas;
        mouseWheel(document.body, (dx, dy, dz, ev) => {
            if (ev.target != canvas) {
                return;
            }
            if ((this.distance < 0.003 && ev.deltaY < 0) || (this.distance > 6.5 && ev.deltaY > 0)) {
                return;
            }
            this.ddistance += dy / this.canvas.offsetHeight / 2;

            this.lastScrollTime = Date.now();
        });

        this._onContextMenu = this._onContextMenu.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
    }

    public isRotating() {
        return this.startRotate;
    }

    public setPosition(dimension) {
        this.target[0] = dimension[0] / 2;
        this.target[1] = dimension[1] / 2;
        this.target[2] = dimension[2] / 2;

        this.ddistance = 5.987249185732558; //Math.log(3.125 * 16 * dimension[0]);
        this.phi = 0.5089343452708008;
        this.theta = 30.628504829794284;
    }

    private calcProjection() {
        this.viewportWidth = this.canvas.offsetWidth;
        this.viewportHeight = this.canvas.offsetHeight;
        mat4.perspective(
            this.projection,
            this.fovY,
            this.viewportWidth / this.viewportHeight,
            this.zNear,
            this.zFar);
        mat4.invert(
            this.invProjection,
            this.projection);
    }

    private calcView() {
        const {
            eye,
            view,
            target,
            up,
        } = this;
        mat4.lookAt(view, eye, target, <vec3>up);
        mat4.invert(this.invView, view);

        const dir = vec3.sub(vec3.create(), target, eye);
        vec3.normalize(dir, dir);
        mat4.lookAt(this.fixedView, eye, vec3.add(vec3.create(), dir, eye), <vec3>up);
    }

    private recalc() {
        const {
            viewProjection,
            invViewProjection,
            projection,
            view,
        } = this;

        this.calcView();
        this.calcProjection();

        mat4.mul(viewProjection, projection, view);
        mat4.invert(invViewProjection, viewProjection);
    }

    public reset() {
        vec3.set(this.target, 0, 0, 0);
        quat.identity(this.rotation);
        this.fovY = DEFAULT_FOV_Y;
        this.zNear = DEFAULT_Z_NEAR;
        this.zFar = DEFAULT_Z_FAR;
        this.gamma = DEFAULT_GAMMA;
        this.recalc();
    }

    public updateCamera() {
        const target = this.target;
        const eye = this.eye;
        const up = this.up;

        this.theta += this.dtheta;
        this.phi = this.clamp(
            this.phi + this.dphi,
            -Math.PI / 2.001,
            Math.PI / 2.001,
        );

        if (this.keyZoomIn && !this.keyZoomOut) {
            this.ddistance += -30 / this.canvas.offsetHeight / 2;
        } else if (!this.keyZoomIn && this.keyZoomOut) {
            this.ddistance += 30 / this.canvas.offsetHeight / 2;
        }
        if (!this.keyThetaRotate) {
            this.dtheta = 0;
        }
        if (!this.keyPhiRotate) {
            this.dphi = 0;
        }

        this.distance = this.clamp(
            this.distance + this.ddistance,
            this.minDistance,
            this.maxDistance);

        this.distance = this.damp(this.ddistance);

        const theta = this.theta;
        const phi = this.phi;
        const r = Math.exp(this.distance);

        const vf = r * Math.sin(theta) * Math.cos(phi);
        const vr = r * Math.cos(theta) * Math.cos(phi);
        const vu = r * Math.sin(phi);

        for (let i = 0; i < 3; i++) {
            eye[i] = target[i] + vf * front[i] + vr * right[i] + vu * up[i];
        }
        this.recalc();
        if (this.lastScrollTime !== 0 && Date.now() - this.lastScrollTime > 500) {
            this.emit(CameraEvent.cameraMoveEnd);
            this.lastScrollTime = 0;
        }
    }

    // private _onKeyDown(e:KeyboardEvent) {
    //     if ((e.target as Element).tagName === 'INPUT' || (e.target as Element).tagName === 'TEXTAREA') {
    //         return;
    //     }
    //     if (e.keyCode === 91) {
    //         this.ctrlDown = true;
    //     } else if (e.keyCode === 88) {
    //         this.metaDown = true;
    //         this.startRotate = true;
    //     } else if (e.keyCode === 68 && !this.ctrlDown) {  //"d"
    //         this.dtheta = -0.017453292519943295;
    //         this.keyThetaRotate = true;
    //     } else if (e.keyCode === 65 && !this.ctrlDown) {  //"a"
    //         this.dtheta = 0.017453292519943295;
    //         this.keyThetaRotate = true;
    //     } else if (e.keyCode === 69 && !this.ctrlDown) {  //"e"
    //         this.dphi = 0.017453292519943295;
    //         this.keyPhiRotate = true;
    //     } else if (e.keyCode === 81 && !this.ctrlDown) {  //"q"
    //         this.dphi = -0.017453292519943295;
    //         this.keyPhiRotate = true;
    //     } else if (e.keyCode === 87 && !this.ctrlDown) {  //"w"
    //         this.keyZoomIn = true;
    //     } else if (e.keyCode === 83 && !this.ctrlDown) {  //"s"
    //         this.keyZoomOut = true;
    //     }
    //     // e.preventDefault();
    // }

    // private _onKeyUp(e:KeyboardEvent) {
    //     if ((e.target as Element).tagName === 'INPUT' || (e.target as Element).tagName === 'TEXTAREA') {
    //         return;
    //     }
    //     if (e.keyCode == 91) {
    //         this.ctrlDown = false;
    //     } else if (e.keyCode == 88) {
    //         this.metaDown = false;
    //         this.startRotate = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     } else if (e.keyCode === 68) {
    //         this.keyThetaRotate = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     } else if (e.keyCode === 65) {  //"a"
    //         this.keyThetaRotate = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     } else if (e.keyCode === 69) {  //"e"
    //         this.keyPhiRotate = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     } else if (e.keyCode === 81) {  //"q"
    //         this.keyPhiRotate = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     } else if (e.keyCode === 87) {  //"w"
    //         this.keyZoomIn = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     } else if (e.keyCode === 83) {  //"s"
    //         this.keyZoomOut = false;
    //         this.emit(CameraEvent.cameraMoveEnd);
    //     }
    // }

    private _onMouseDown(e:MouseEvent) {
        if (e.button == 2 || (e.button == 0 && this.metaDown == true)) {
            this.startRotate = true;
        }
    }

    private _onTouchStart(e:MouseEvent) {
        e.stopPropagation();
        if (e.cancelable) {
            if (!e.defaultPrevented) {
                e.preventDefault();
            }
        }
        this.startRotate = true;
        return false;
    }

    private _onTouchMove(e:MouseEvent) {
        e.stopPropagation();
        if (e.cancelable) {
            if (!e.defaultPrevented) {
                e.preventDefault();
            }
        }
        (e as any).clientY = (e as any).touches[0].clientY;
        (e as any).clientX = (e as any).touches[0].clientX;
        this._onMouseMove(e);
    }

    private _onTouchEnd(e:MouseEvent) {
        this.startRotate = false;
    }

    private _onContextMenu(e:MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
    }

    private _onMouseMove(e:MouseEvent) {
        let x = e.clientX - this.canvas.offsetLeft;
        let y = e.clientY - this.canvas.offsetTop;
        if (this.startRotate) {
            x = e.clientX - this.canvas.offsetLeft;
            y = e.clientY - this.canvas.offsetTop;

            const dx = (x - this.prevX) / this.canvas.offsetWidth / 2;
            const dy = (y - this.prevY) / this.canvas.offsetHeight / 2;
            const w = Math.max(3 * this.distance, 0.5);
            this.dtheta += w * dx;
            this.dphi += w * dy;
        }
        this.prevX = x;
        this.prevY = y;
    }

    private _onMouseUp(e:MouseEvent) {
        if (this.startRotate) {
            this.startRotate = false;
            this.emit(CameraEvent.cameraMoveEnd);
        }
    }

    public damp(x) {
        const xd = x * 0.8;
        if (xd < 0.005 && xd > -0.005) {
            return 0;
        }
        return xd;
    }

    public clamp(x, lo, hi) {
        return Math.min(Math.max(x, lo), hi);
    }

    public attachEventListener() {
        // document.body.addEventListener('keydown', this._onKeyDown);
        // document.body.addEventListener('keyup', this._onKeyUp);
        document.body.addEventListener('mousedown', this._onMouseDown);
        document.body.addEventListener('contextmenu', this._onContextMenu);
        document.body.addEventListener('mousemove', this._onMouseMove);
        document.body.addEventListener('mouseup', this._onMouseUp);

        document.body.addEventListener('touchstart', (this._onTouchStart as any));
        document.body.addEventListener('touchmove', (this._onTouchMove as any));
        document.body.addEventListener('touchend', (this._onTouchEnd as any));

    }

    public releaseEventListener() {
        // document.body.removeEventListener('keydown', this._onKeyDown);
        // document.body.removeEventListener('keyup', this._onKeyUp);
        document.body.removeEventListener('mousedown', this._onMouseDown);
        document.body.removeEventListener('contextmenu', this._onContextMenu);
        document.body.removeEventListener('mousemove', this._onMouseMove);
        document.body.removeEventListener('mouseup', this._onMouseUp);

        document.body.removeEventListener('touchstart', (this._onTouchStart as any));
        document.body.removeEventListener('touchmove', (this._onTouchMove as any));
        document.body.removeEventListener('touchend', (this._onTouchEnd as any));
    }
}
