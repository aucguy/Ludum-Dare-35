import * as util from '/lib/util.js';

var rand = new Phaser.RandomDataGenerator([Date.now()]);

var Shape = util.extend(Object, 'Shape', {
  constructor: function Shape(name, texture) {
    this.name = name;
    this.texture = texture;
    this.next = null;
    this.prev = null;
    Shape.shapes.push(this);
  }
});
Shape.shapes = [];
Shape.shapes = [];
Shape.triangle = new Shape('triangle', 'images/triangle');
Shape.square = new Shape('square', 'images/square');
Shape.circle = new Shape('circle', 'images/circle');
Shape.pentagon = new Shape('pentagon', 'images/pentagon');
for(var i = 0; i < Shape.shapes.length; i++) {
  var shape = Shape.shapes[i];
  shape.next = Shape.shapes[(i + 1) % Shape.shapes.length];
  shape.prev = Shape.shapes[i == 0 ? Shape.shapes.length - 1 :
    (i - 1) % Shape.shapes.length];
}

Shape.randomShape = function randomShape() {
  return rand.pick(Shape.shapes);
};

var Color = util.extend(Object, 'Color', {
  constructor: function Color(name, shade) {
    this.name = name;
    this.shade = shade;
  }
});
Color.colors = [
  new Color('red', '#FF0000'),
  new Color('blue', '#0000FF'),
  new Color('yellow', '#FFFF00'),
  new Color('green', '#00FF00')
];
Color.randomColor = function randomColor() {
  return rand.pick(Color.colors);
};

function getTextureName(shape, color) {
  return 'piece-' + shape.name + '-' + color.name;
}

export {
  rand,
  Shape,
  Color,
  getTextureName
};