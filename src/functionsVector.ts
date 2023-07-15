// Trigonometric, Vector and Collision related functions

export interface IBoxCoordinates {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
    x4: number;
    y4: number;
}

const DEG_TO_RAD = Math.PI / 180;
  
export function getBoxRotated(x1: number, y1: number, x2: number, y2: number, xAxis: number, yAxis: number, xScale: number, yScale: number, angle: number): IBoxCoordinates {
    const rad = angle * (Math.PI / 180);
    const centerX = xAxis + x1;
    const centerY = yAxis + y1;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx1 = (x1 - centerX) * xScale;
    const dy1 = (y1 - centerY) * yScale;
    const dx2 = (x2 - centerX) * xScale;
    const dy2 = (y2 - centerY) * yScale;
    const x1t = dx1 * cos - dy1 * sin + centerX;
    const y1t = dx1 * sin + dy1 * cos + centerY;
    const x2t = dx2 * cos - dy1 * sin + centerX;
    const y2t = dx2 * sin + dy1 * cos + centerY;
    const x3t = dx2 * cos - dy2 * sin + centerX;
    const y3t = dx2 * sin + dy2 * cos + centerY;
    const x4t = dx1 * cos - dy2 * sin + centerX;
    const y4t = dx1 * sin + dy2 * cos + centerY;
    return {
      x1: x1t-xAxis,
      y1: y1t-yAxis,
      x2: x2t-xAxis,
      y2: y2t-yAxis,
      x3: x3t-xAxis,
      y3: y3t-yAxis,
      x4: x4t-xAxis,
      y4: y4t-yAxis
    };
}



export function drawRectangleRotated(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, xAxis: number, yAxis: number, xScale: number, yScale: number, angle: number, lineWidth: number, color: string): void {

    const box = getBoxRotated(x1, y1, x2, y2, xAxis, yAxis, xScale, yScale, angle);

    // Draw the frame
    ctx.beginPath();
    ctx.lineWidth = lineWidth;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(box.x1, box.y1);
    ctx.lineTo(box.x2, box.y2);
    ctx.lineTo(box.x3, box.y3);
    ctx.lineTo(box.x4, box.y4);
    ctx.lineTo(box.x1, box.y1);
    ctx.stroke();
}

export function drawTextRotated(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, angle: number) { 
    // save the context state
    ctx.save();
  
    // translate to the center of the text
    ctx.translate(x, y);
  
    // rotate the context
    ctx.rotate(angle * DEG_TO_RAD);
  
    // set the font size and text alignment
    // ctx.font = `${fontSize}px sans-serif`;
    // ctx.textAlign = 'center';
  
    // draw the text
    ctx.fillText(text, 0, 0);
  
    // restore the context state
    ctx.restore();
}


// The checkPointInPolygon function takes the coordinates of a polygon as an array of objects with x and y properties representing each vertex, 
// as well as the coordinates of a point, and returns a boolean indicating whether the point is located inside the polygon or not.
export interface Vertex {
    x: number;
    y: number;
}

export function checkPointInPolygon(vertices: Vertex[], pointx: number, pointy: number): boolean {
    let inside = false;
    const vs = vertices;
    let j = vs.length - 1;

    for (let i = 0; i < vs.length; i++) {
        if ((vs[i].y > pointy) !== (vs[j].y > pointy) &&
            pointx < (vs[j].x - vs[i].x) * (pointy - vs[i].y) / (vs[j].y - vs[i].y) + vs[i].x) {
            inside = !inside;
        }
        j = i;
    }

    return inside;
}

// checkPolygonIntersection {{{

/* 
This function takes in two arrays of vertex objects, which represent the vertices of polygons A and B. 
It first converts the vertices to line segments using the getLineSegmentsFromVertices function. 
It then checks for intersection between each line segment of polygon A and each line segment of polygon B 
using the checkLineSegmentIntersection function. If an intersection is found, the function returns true. 
If no intersections are found, the function returns false.
*/

function checkPolygonIntersection(verticesA: {x: number, y: number}[], verticesB: {x: number, y: number}[]): boolean {
    // Convert vertices to line segments
    const segmentsA = getLineSegmentsFromVertices(verticesA);
    const segmentsB = getLineSegmentsFromVertices(verticesB);
  
    // Check for intersection between all line segments
    for (let i = 0; i < segmentsA.length; i++) {
      for (let j = 0; j < segmentsB.length; j++) {
        if (checkLineSegmentIntersection(segmentsA[i], segmentsB[j])) {
          return true;
        }
      }
    }
  
    // No intersections found
    return false;
  }
  
  function getLineSegmentsFromVertices(vertices: {x: number, y: number}[]): {start: {x: number, y: number}, end: {x: number, y: number}}[] {
    const segments = [];
    for (let i = 0; i < vertices.length - 1; i++) {
      segments.push({ start: vertices[i], end: vertices[i + 1] });
    }
    segments.push({ start: vertices[vertices.length - 1], end: vertices[0] }); // Close the polygon
    return segments;
  }
  
  function checkLineSegmentIntersection(segmentA: {start: {x: number, y: number}, end: {x: number, y: number}}, segmentB: {start: {x: number, y: number}, end: {x: number, y: number}}): boolean {
    // Get line segment vectors
    const vectorA = { x: segmentA.end.x - segmentA.start.x, y: segmentA.end.y - segmentA.start.y };
    const vectorB = { x: segmentB.end.x - segmentB.start.x, y: segmentB.end.y - segmentB.start.y };
  
    // Calculate cross products
    const crossAB = vectorA.x * vectorB.y - vectorA.y * vectorB.x;
    const crossAC = vectorA.x * (segmentB.start.y - segmentA.start.y) - vectorA.y * (segmentB.start.x - segmentA.start.x);
    const crossAD = vectorA.x * (segmentB.end.y - segmentA.start.y) - vectorA.y * (segmentB.end.x - segmentA.start.x);
    const crossCD = vectorB.x * (segmentA.end.y - segmentB.start.y) - vectorB.y * (segmentA.end.x - segmentB.start.x);
    const crossCA = -crossAC;
    const crossCB = -crossCD;
  
    // Check for intersection
    if (crossAB >= 0) {
      return crossAC >= 0 && crossAD <= 0 && crossCD >= 0 && crossCB >= 0;
    } else {
      return crossAC <= 0 && crossAD >= 0 && crossCD <= 0 && crossCB <= 0;
    }
  }

// checkPolygonIntersection }}}

// export function checkPointInFigure(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, pointx: number, pointy: number): boolean {
//     // Check if the point is inside the quadrilateral using the winding number algorithm
//     let wn = 0;
    
//     // Check each edge of the quadrilateral
//     wn += isPointOnLeft(x1, y1, x2, y2, pointx, pointy) ? 1 : -1;
//     wn += isPointOnLeft(x2, y2, x3, y3, pointx, pointy) ? 1 : -1;
//     wn += isPointOnLeft(x3, y3, x4, y4, pointx, pointy) ? 1 : -1;
//     wn += isPointOnLeft(x4, y4, x1, y1, pointx, pointy) ? 1 : -1;
    
//     // If the winding number is non-zero, the point is inside the quadrilateral
//     return wn !== 0;
//   }
  
//   function isPointOnLeft(x1: number, y1: number, x2: number, y2: number, pointx: number, pointy: number): boolean {
//     // Check if the point is to the left of the line formed by (x1,y1) and (x2,y2)
//     return ((x2 - x1) * (pointy - y1) - (y2 - y1) * (pointx - x1)) > 0;
//   }


// export function getBoxRotated2(x1: number, y1: number, x2: number, y2: number, angle: number): IBoxCoordinates {
//     const cx = (x1 + x2) / 2; // x-coordinate of the center of the rectangle
//     const cy = (y1 + y2) / 2; // y-coordinate of the center of the rectangle
//     const sin = Math.sin(angle * DEG_TO_RAD); // sine of the rotation angle
//     const cos = Math.cos(angle * DEG_TO_RAD); // cosine of the rotation angle
  
//     // Calculate the rotated coordinates of each point
//     const x1r = cos * (x1 - cx) - sin * (y1 - cy) + cx;
//     const y1r = sin * (x1 - cx) + cos * (y1 - cy) + cy;
//     const x2r = cos * (x2 - cx) - sin * (y2 - cy) + cx;
//     const y2r = sin * (x2 - cx) + cos * (y2 - cy) + cy;
//     const x3r = cos * (x2 - cx) - sin * (y1 - cy) + cx;
//     const y3r = sin * (x2 - cx) + cos * (y1 - cy) + cy;
//     const x4r = cos * (x1 - cx) - sin * (y2 - cy) + cx;
//     const y4r = sin * (x1 - cx) + cos * (y2 - cy) + cy;
  
//     // Return the rotated coordinates as an object
//     return { x1: x1r, y1: y1r, x2: x3r, y2: y3r, x3: x2r, y3: y2r, x4: x4r, y4: y4r };
// }

// export function drawRectangleRotated2(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, angle: number, lineWidth: number, color: string): void {

//     const box = getBoxRotated2(x1, y1, x2, y2, angle);

//     // Draw the frame
//     ctx.beginPath();
//     ctx.lineWidth = lineWidth;

//     ctx.strokeStyle = color;
//     ctx.beginPath();
//     ctx.moveTo(box.x1, box.y1);
//     ctx.lineTo(box.x2, box.y2);
//     ctx.lineTo(box.x3, box.y3);
//     ctx.lineTo(box.x4, box.y4);
//     ctx.lineTo(box.x1, box.y1);
//     ctx.stroke();
// }
