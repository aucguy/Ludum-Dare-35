import * as util from '/lib/util.js';

/**
 * sets the texture of a sprite from a canvas
 */
export function getTextureFromCache(game, key) {
  return PIXI.Texture.fromCanvas(game.cache.getCanvas(key));
}

var bitmapCache = [];

export function createBitmap(game, width, height) {
  var bitmap = game.make.bitmapData(width, height);
  bitmapCache.push(bitmap);
  return bitmap;
}

export function clearBitmapCache() {
  for(var i = 0; i < bitmapCache.length; i++) {
    bitmapCache[i].destroy();
  }
  bitmapCache = [];
}

export function normalWithAngle(angle) {
  return Phaser.Point.rotate(new Phaser.Point(1, 0), 0, 0, angle).normalize();
}

export function centerSprite(sprite) {
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
}

//the line has one point in common with the circle's center
export function lineCircleIntersect(line, center, radius) {
  var vector = Phaser.Point.subtract(line, center).normalize();
  vector = Phaser.Point.multiply(vector, new Phaser.Point(radius, radius));
  vector = Phaser.Point.add(vector, center);
  return vector;
}

var xmlParser = new DOMParser();

export function addGenImg(cache, key, svg, data) {
  svg = xmlParser.parseFromString(util.getAsset(svg), 'text/xml');
  var target = util.createCanvas(svg.width, svg.height);

  var names = Object.getOwnPropertyNames(data);
  for(var i = 0; i < names.length; i++) {
    var name = names[i];
    var value = data[name];
    var parts = name.split('.');

    var obj = svg.getElementById(parts[0]);
    if(obj === null) continue;

    for(var k = 1; k < parts.length - 1; k++) {
      obj = obj[parts[k]];
      if(obj === null) break;
    }
    if(obj === null) continue;
    obj[parts[parts.length - 1]] = value;
  }
  canvg(target, svg);
  cache.addCanvas(key, target);
}