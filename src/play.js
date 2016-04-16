base.registerModule('play', function() {
  var util = base.importModule('util');

  var PIECES_IN_QUEUE = 10;
  var rand = new Phaser.RandomDataGenerator();

  var PlayState = util.extend(Phaser.State, 'PlayState', {
    constructor: function PlayState() {
      this.playGame = null;
    },

    create: function create() {
      this.playGame = new PlayGame(this.game);
      this.game.world.add(this.playGame);
    },

    update: function update() {
      this.playGame.update();
    }
  });

  /**
   * the play area
   */
  var PlayGame = util.extend(Phaser.Group, 'PlayGame', {
    constructor: function PlayGame(game) {
      this.constructor$Group(game);
      this.queueLeft = new PieceQueue(game, this, 1); //line of shapes on the left
      this.queueRight = null; //line of shapes on the right
      this.goals = null; //shapes to specify what goes where
      this.score = null; //ring for a timer and health
    },
    /**
     * send shapes to their destination
     */
    sendShapes: function sendShapes() {
    },
  });

  /**
   * holds shapes that will be played
   */
  var PieceQueue = util.extend(Phaser.Group, 'PieceQueue', {
    constructor: function PieceQueue(game, parent, side) {
      this.constructor$Group(game, parent);
      this.side = side; //which way the queue is facing
      this.onTake = new Phaser.Signal(); //signal fired when a shape is taken
      for(var i=0; i<PIECES_IN_QUEUE; i++) {
        this.add(Piece.randomPiece(game));
      }
    },
    /**
     * returns the next shape in line for the center and moves everyone up
     */
    takeNext: function takeNext() {
      //TODO
    }
  });

  /**
   * place where the shapes are supposed to go
   */
  var Goal = util.extend(Phaser.Sprite, 'Goal', {
    constructor: function Goal() {
      this.onRightShape = null; //signal fired when right shape recieved
      this.onWrongShape = null; //signal fired when wrong shape recieved
      this.leftKey = null; //key to press to send a shape from the left queue
      this.rightKey = null; //key to pressed to send a shape from the right queue
    }
  });

  var Score = util.extend(Phaser.Group, 'Score', {
    constructor: function Score() {
      this.timer = null; //right for time
      this.health = null; //ring for health
    }
  });

  var Ring = util.extend(Phaser.Sprite, 'Ring', {
    constructor: function(scale, color) {
    }
  });

  var Piece = util.extend(Phaser.Sprite, 'Piece', {
    constructor: function Piece(game, shape, color) {
      var texture = util.getTextureFromCache(game, Piece.getTextureName(shape, color));
      this.constructor$Sprite(game, 200, 200, texture);
      this.shape = shape;
      this.color = color;
    }
  });
  Piece.randomPiece = function randomPiece(game) {
    return new Piece(game, Shape.randomShape(), Color.randomColor());
  };
  Piece.getTextureName = function getTextureName(shape, color) {
    return 'piece-' + shape.name + '-' + color.name;
  }

  var Shape = util.extend(Object, 'Shape', {
    constructor: function Shape(name, texture) {
      this.name = name;
      this.texture = texture;
    }
  });
  Shape.shapes = [
    new Shape('triangle', 'images/triangle'),
    new Shape('square', 'images/square'),
    new Shape('circle', 'images/circle'),
    new Shape('pentagon', 'images/pentagon')
  ];
  Shape.randomShape = function randomShape() {
    return rand.pick(Shape.shapes);
  }

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
  ]
  Color.randomColor = function randomColor() {
    return rand.pick(Color.colors)
  }

  return {
    PlayState: PlayState,
    Shape: Shape,
    Color: Color,
    Piece: Piece
  }
});
