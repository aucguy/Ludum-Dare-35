import * as util from '/lib/util.js';

function splitCanvasInHalf(canvas) {
  var halfWidth = canvas.width / 2;
  var left = util.createCanvas(halfWidth, canvas.height);
  var right = util.createCanvas(halfWidth, canvas.height);
  left.getContext('2d').drawImage(canvas, 0, 0);
  right.getContext('2d').drawImage(canvas, -halfWidth, 0);
  return [left, right];
}

function copyTexture(original) {
  var canvas = util.createCanvas(original.width, original.height);
  canvas.getContext('2d').drawImage(original.baseTexture.source, 0, 0);
  return PIXI.Texture.fromCanvas(canvas);
}

function createParticleSprite(game, original, left) {
  var sprite = game.add.sprite(original.position.x,
    original.position.y + original.height / 2, copyTexture(original.texture));
  left = left ? 0 : original.width / 2;
  sprite.crop(new Phaser.Rectangle(left, 0, original.width / 2, original.height));

  sprite.anchor.x = left ? 0 : 1;
  sprite.anchor.y = 1;

  var tween = game.add.tween(sprite);
  tween.to({
    x: sprite.position.x + (left ? 1 : -1) * 10,
    y: sprite.position.y + 10,
    angle: left ? 70 : -70,
    alpha: 0
  }, 1000);
  tween.onComplete.add(game.world.remove.bind(game.world, sprite));
  tween.start();

  return sprite;
}

function createParticleSprites(game, original) {
  createParticleSprite(game, original, true);
  createParticleSprite(game, original, false);
}

export {
  createParticleSprites
};