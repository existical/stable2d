export class Camera {
    public x: number;
    public y: number;
    public zoom: number;
    public width: number;
    public height: number;

    constructor(x: number, y: number, zoom: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
        this.width = width;
        this.height = height;
    }

    public move(x: number, y: number) {
        this.x += x;
        this.y += y;
    }

    public setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public updateCanvas(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    public restoreCanvas(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }
}