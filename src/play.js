base.registerModule('play', function() {
  var util = base.importModule('util');

  var PIECES_IN_QUEUE = 5;
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
      //this.playGame.update();
    },

    shutdown: function shutdown() {
      util.clearBitmapCache();
    }
  });

  /**
   * creates the placements of things on the screen
   */
  function makePlacements(game, width, height) {
    var pieceSize = 0.5 * game.cache.getCanvas('piece-triangle-green').width;
    var goalMargin = 0.2 * pieceSize;
    var places = {
      //place to spawn pieces for left queue
      leftSpawn: [-50, -50], //topleft corner
      //where the pieces in the queue go to join
      queueTarget: [width / 2, height / 2], //screen center
      //center of the rings
      ringCenter: [width / 2, height / 2], //screen center
      //goal positions
      goalTriangle: [width / 2, goalMargin + pieceSize],
      goalSquare: [width - pieceSize - goalMargin, height / 2],
      goalCircle: [width / 2, height - pieceSize - goalMargin],
      goalPentagon: [goalMargin + pieceSize, height / 2]
    }
    var names = Object.getOwnPropertyNames(places);
    var ret = {}
    for(var i=0; i<names.length; i++) {
      var name = names[i];
      var coord = places[name];
      var point = new Phaser.Point(coord[0], coord[1]);
      ret[name] = point;
    }
    return ret;
  }

  /**
   * the play area
   */
  var PlayGame = util.extend(Phaser.Group, 'PlayGame', {
    constructor: function PlayGame(game) {
      this.constructor$Group(game);
      //what goes where
      this.placements = makePlacements(game, game.scale.width, game.scale.height);
      //speed at which to send pieces
      this.speed = 5000;

      this.queueLeft = new PieceQueue(game, this, Side.Left); //line of shapes on the left
      this.queueRight = null; //line of shapes on the right
      this.goals = new GoalGroup(game, this); //shapes to specify what goes where
      this.ring = new Ring(game, this, 100, 5, '#000000'); //ring for health
      this.add(this.ring);
    },
    /**
     * send shapes to their destination
     */
    sendShapes: function sendShapes() {
    },
  });

  var Side = {
    Left: 0,
    Right: 1
  }

  /**
   * holds shapes that will be played
   */
  var PieceQueue = util.extend(Phaser.Group, 'PieceQueue', {
    constructor: function PieceQueue(game, parent, side) {
      this.constructor$Group(game, parent);
      this.parent = parent; //parent spite (PlayGame)
      this.side = side; //which way the queue is facing
      this.onAddPiece = new Phaser.Signal(); //when piece added
      this.onTake = new Phaser.Signal(); //signal fired when a shape is taken

      this.onAddPiece.add(this.doAddPiece.bind(this));
      this.onAddPiece.dispatch();
    },
    doAddPiece: function doAddPiece() {
      var piece = Piece.randomPiece(this.game, this.getSpawn().x, this.getSpawn().y);
      var tween = this.game.add.tween(piece);
      tween.to({
        x: this.parent.placements.queueTarget.x,
        y: this.parent.placements.queueTarget.y
      }, this.parent.speed);
      tween.start();
      this.add(piece);
      this.game.time.events.add(this.parent.speed / PIECES_IN_QUEUE,
          this.onAddPiece.dispatch, this.onAddPiece);
    },
    getSpawn: function getSpawn() {
      switch(this.side) {
        case Side.Left: return this.parent.placements.leftSpawn;
        case Side.Right: return this.parent.placements.rightSpawn;
      }
    },
    /**
     * returns the next shape in line for the center and moves everyone up
     */
    takeNext: function takeNext() {
      //TODO
    }
  });

  var Piece = util.extend(Phaser.Sprite, 'Piece', {
    constructor: function Piece(game, x, y, shape, color) {
      var texture = util.getTextureFromCache(game, Piece.getTextureName(shape, color));
      this.constructor$Sprite(game, x, y, texture);
      this.shape = shape;
      this.color = color;
      util.centerSprite(this);
    }
  });
  Piece.randomPiece = function randomPiece(game, x, y) {
    return new Piece(game, x, y, Shape.randomShape(), Color.randomColor());
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

  /**
   * group for goals
   */
  var GoalGroup = util.extend(Phaser.Group, 'GoalGroup', {
    constructor: function GoalGroup(game, parent) {
      this.constructor$Group(game, parent);
      this.parent = parent;
      for(var i=0; i<Shape.shapes.length; i++) {
        var shape = Shape.shapes[i];
        var goal = new Goal(game, this, shape);
        this.add(goal);
      }
    }
  });

  /**
   * place where the shapes are supposed to go
   */
  var Goal = util.extend(Phaser.Sprite, 'Goal', {
    constructor: function Goal(game, parent, shape) {
      var texture = util.getTextureFromCache(game, Goal.getTextureName(shape));
      this.parent = parent;
      this.shape = shape; //target shape
      var pos = this.goalPlacement();
      this.constructor$Sprite(game, pos.x, pos.y, texture);
      this.onRightShape = null; //signal fired when right shape recieved
      this.onWrongShape = null; //signal fired when wrong shape recieved
      this.leftKey = null; //key to press to send a shape from the left queue
      this.rightKey = null; //key to pressed to send a shape from the right queue
      util.centerSprite(this);
    },
    goalPlacement: function goalPlacement() {
      var name = this.shape.name;
      var placements = this.parent.parent.placements;
      if(name == 'triangle') return placements.goalTriangle;
      if(name == 'square') return placements.goalSquare;
      if(name == 'circle') return placements.goalCircle;
      if(name == 'pentagon') return placements.goalPentagon;
    }
  });
  Goal.getTextureName = function getTextureName(shape) {
    return Piece.getTextureName(shape, Color.randomColor());
  };

  var Ring = util.extend(Phaser.Sprite, 'Ring', {
    constructor: function Ring(game, parent, radius, thickness, color) {
      var outer = radius + thickness;
      this.bitmap = util.createBitmap(game, 2 * outer, 2 * outer);
      this.constructor$Sprite(game, parent.placements.ringCenter.x,
          parent.placements.ringCenter.y, this.bitmap);
      util.centerSprite(this);
      this.radius = radius;
      this.thickness = thickness;
      this.color = color;
    },
    update: function update() {
      var context = this.bitmap.context;
      var angle = this.game.math.degToRad(360);

      context.fillStyle = this.color;
      context.strokeStyle = this.color;

      context.beginPath();
      context.arc(this.center().x, this.center().y, this.radius, 0, angle);

      var end = this.getEndPoint(angle);
      context.lineTo(end.x, end.y);

      context.arc(this.center().x, this.center().y, this.totalRadius(), angle, 0, true);
      context.closePath();

      context.fill();
      context.stroke();
      context.restore();
    },
    getEndPoint: function getEndPoint(angle) {
      var tmp = util.normalWithAngle(angle);
      tmp = Phaser.Point.multiply(tmp, new Phaser.Point(this.totalRadius(), this.totalRadius()));
      tmp.add(this.center().x, this.center().y);
      return tmp;
    },
    center: function center() {
      return new Phaser.Point(this.bitmap.canvas.width / 2,
          this.bitmap.canvas.height / 2);
    },
    totalRadius: function totalRadius() {
      return this.radius + this.thickness;
    }
  });

  return {
    PlayState: PlayState,
    Shape: Shape,
    Color: Color,
    Piece: Piece
  }
});
