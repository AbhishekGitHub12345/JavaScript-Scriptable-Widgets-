// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: moon;
// Code by Reow [reow@parabios.com]

const nobg = importModule('no-background')
const BG_IMAGE = await nobg.getSlice('small-top-left')

//const PATH_BG = "/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/BackgroundMoon.jpg";
// const PATH_MOON = "/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/Moon/Full.PNG";
const URL_MOON = "https://i.imgur.com/2BdGkrs.png";
const WIDGET_DIM = 507;
const DISTANCE_MIN_KM= 163104;

function circlePoinxt(mid, radius, angle) {
  return new Point(mid.x + radius * Math.cos(angle), mid.y - radius * Math.sin(angle));
}

function calcκPolar(rPerp, rPar) { //, segments) {
  let segments = 4;
  const κ = 4 * Math.tan(Math.PI / (2 * segments)) / 3;
  //let κ = 0.551915024494;
  let angle = Math.atan(rPar * κ / rPerp);
  let radius = Math.sqrt(Math.pow(rPerp, 2) + Math.pow(rPar, 2) * Math.pow(κ, 2));
  return { angle: angle, radius: radius }
}

function clamp(value, min, max) {
  return value < min ? min : (value > max ? max : value);
}

function mod(m, n) {
  return ((m % n) + n) % n;
}

function drawCrescent(rMaj, propArea, mid, ang0) {
  rMaj = Math.abs(rMaj);
  propArea = clamp(propArea, 0, 1);
  mid.x = Math.abs(mid.x);
  mid.y = Math.abs(mid.y);
  ang0 = mod(ang0, 2 * Math.PI);
  let rMin = calcRadiusProp(propArea) * rMaj;
  let sign = propArea < 0.5 ? 1 : -1;
  let ang1 = ang0 + Math.PI / 2;
  let ang2 = ang0 + Math.PI;
  let ang3 = ang0 + sign * Math.PI / 2;

  let κC = calcκPolar(rMaj, rMaj);
  let κEMaj = calcκPolar(rMaj, rMin);
  let κEMin = calcκPolar(rMin, rMaj);
  
  let p0 = circlePoint(mid, rMaj, ang0);
  let p1 = circlePoint(mid, rMaj, ang1);
  let p2 = circlePoint(mid, rMaj, ang2);
  let p3 = circlePoint(mid, rMin, ang3);
  
  let l01c1 = circlePoint(mid, κC.radius, ang0 + κC.angle);
  let l01c2 = circlePoint(mid, κC.radius, ang1 - κC.angle);
  let l12c1 = circlePoint(mid, κC.radius, ang1 + κC.angle);
  let l12c2 = circlePoint(mid, κC.radius, ang2 - κC.angle);
  let l23c1 = circlePoint(mid, κEMaj.radius, ang2 - sign * κEMaj.angle);
  let l23c2 = circlePoint(mid, κEMin.radius, ang3 + sign * κEMin.angle);
  let l30c1 = circlePoint(mid, κEMin.radius, ang3 - sign * κEMin.angle);
  let l30c2 = circlePoint(mid, κEMaj.radius, ang0 + sign * κEMaj.angle);
  
  let path = new Path()
  path.move(p0)
  path.addCurve(p1, l01c1, l01c2);
  path.addCurve(p2, l12c1, l12c2);
  path.addCurve(p3, l23c1, l23c2);
  path.addCurve(p0, l30c1, l30c2);
  path.closeSubpath();
  return path;
}

function calcRadiusProp(propArea) {
  if (propArea > 0.5)
    propArea = 1 - propArea;
  return 1 - 2 * propArea;
}

async function getImage(url) {
  return await new Request(url).loadImage()
}


let now = new Date();
let year = now.getFullYear();
let month = now.getMonth();
let day = now.getDate();
let ldz = new Date(year, month, 1) / 1000;
let url  = `https://www.icalendar37.net/lunar/api/?lang=en&month=${month + 1}&year=${year}&LDZ=${ldz}`;
let request = new Request(url);
let data = await request.loadJSON();
let phase = data.phase[day].phaseName.toUpperCase();
let propUmbra = 1 - data.phase[day].lighting / 100;
let scale = DISTANCE_MIN_KM / data.phase[day].dis;
let radius = scale * WIDGET_DIM / 2 + 1;
let midXY = WIDGET_DIM / 2;
let minXY = midXY - radius;
let angle = (phase == "NEW MOON" || phase == "FIRST QUARTER" || phase == "WAXING") ? Math.PI / 2 : -Math.PI / 2;
let umbra = drawCrescent(radius, propUmbra, new Point(midXY, midXY), angle);

let context = new DrawContext();
context.size = new Size(WIDGET_DIM, WIDGET_DIM);
context.drawImageInRect(BG_IMAGE, new Rect(0, 0, WIDGET_DIM, WIDGET_DIM));
let moonImage = await getImage(URL_MOON);
// let moonImage = Image.fromFile(PATH_MOON);
context.drawImageInRect(moonImage, new Rect(minXY, minXY, 2 * radius, 2 * radius));
context.setFillColor(new Color("#000000", 0.8));
context.addPath(umbra);
context.fillPath();

let widget = new ListWidget();
widget.setPadding(0, 0, 0, 0);
widget.backgroundColor = new Color("#fffff");
widget.backgroundImage = context.getImage();
widget.presentSmall();
