base.registerModule('play', function() {
  var util = base.importModule('util');
  var menu = base.importModule('menu');

  var RING_FUZZ = 10;
  var MOVE_ZONE = 2;
  var QUEUE_SPEED = 3000; //rate at which pieces are spawned
  var MISS_DAMAGE = 5;
  var RECOVER_SPEED = 0.5 * 2 * MISS_DAMAGE / QUEUE_SPEED; //rate at which health is regained
  var rand = new Phaser.RandomDataGenerator();

  var PlayState = util.extend(Phaser.State, 'PlayState', {
    constructor: function PlayState() {
      this.playGame = null;
    },
    create: function create() {
      this.playGame = new PlayGame(this.game);
      this.game.world.add(this.playGame);
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
      rightSpawn: [width + 50, -50], //topright corner
      //where the pieces in the queue go to join
      queueTarget: [width / 2, height / 2], //screen center
      //center of the rings
      ringCenter: [width / 2, height / 2], //screen center
      score: [width - 150, height - 25],
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

      this.speed = QUEUE_SPEED; //speed at which to send pieces
      this.healthValue = 100; //when it hits zero game over. out of 100
      this.lastTick = game.time.elapsedSince(0);
      this.score = 0;

      this.queueLeft = new PieceQueue(game, this, Side.Left); //line of shapes on the left
      this.queueRight = new PieceQueue(game, this, Side.Right); //line of shapes on the right
      this.goals = new GoalGroup(game, this); //shapes to specify what goes where
      this.ring = new Ring(game, this, 100, 5, '#000000', '#888888'); //ring for health
      this.scoreText = game.add.text(this.placements.score.x, this.placements.score.y, '', {
        font: '24px Arial', fill: '#000000'
      }, this);
      this.add(this.ring);
    },
    update: function update() {
      this.healthValue = Math.min(this.healthValue + RECOVER_SPEED *
        this.game.time.elapsedSince(this.lastTick), 100);
      this.lastTick = this.game.time.elapsedSince(0);
      if(this.healthValue < 0) {
        menu.LoseMenu.instance.score = this.score;
        this.game.state.start('loseMenu');
      }
      this.scoreText.text = 'Score: ' + this.score;
      this.queueLeft.spriteInCenter = null;
      this.queueRight.spriteInCenter = null;
      this.update$Group();
    }
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
      this.unboundArrow = null; //arrow waiting to be attached
      this.spriteInCenter = null; //sprite in the center to be mutated
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
      this.game.time.events.add(this.parent.speed,
          this.onAddPiece.dispatch, this.onAddPiece);
    },
    getSpawn: function getSpawn() {
      switch(this.side) {
        case Side.Left: return this.parent.placements.leftSpawn;
        case Side.Right: return this.parent.placements.rightSpawn;
      }
    },
    getArrowPos: function getArrowPos() {
      //need to calculate intercept of queue line and the ring
      var spawn = this.getSpawn()
      var center = this.parent.placements.ringCenter;
      var radius = this.parent.ring.radius + this.parent.ring.thickness / 2;
      return util.lineCircleIntersect(spawn, center, radius);
    },
    update: function update() {
      this.update$Group();
      this.updateArrow();
    },
    updateArrow: function updateArrow() {
      var newArrow = null;
      if(this.unboundArrow != null &&
          this.game.input.keyboard.isDown(this.unboundArrow.direction.getKey(this.side))) {
        newArrow = this.unboundArrow;
      }
      else {
        for(var i=0; i<Direction.directions.length; i++) {
          var direction = Direction.directions[i];
          if(this.game.input.keyboard.isDown(direction.getKey(this.side))) {
            var pos = this.getArrowPos();
            newArrow = new Arrow(this.game, direction, Math.round(pos.x),
                Math.round(pos.y), null);
            break;
          }
        }
      }
      if(this.unboundArrow != null && this.unboundArrow != this.newArrow) {
        this.remove(this.unboundArrow);
      }
      if(newArrow != null) {
        this.add(newArrow);
      }
      this.unboundArrow = newArrow;
    },
    tryBindArrow: function tryBindArrow(piece) {
      if(this.unboundArrow != null && piece.arrow == null) {
        if(piece.arrow != null) {
          this.remove(piece.arrow);
        }
        piece.arrow = this.unboundArrow;
        this.unboundArrow.onBound(piece);
        this.unboundArrow = null;
      }
    },
    getOpposite: function getOpposite() {
      switch(this.side) {
        case Side.Left: return this.parent.queueRight;
        case Side.Right: return this.parent.queueLeft;
      }
    }
  });

  var Piece = util.extend(Phaser.Sprite, 'Piece', {
    constructor: function Piece(game, x, y, shape, color) {
      var texture = util.getTextureFromCache(game, Piece.getTextureName(shape, color));
      this.constructor$Sprite(game, x, y, texture);
      this.shape = shape;
      this.color = color;
      this.arrow = null;
      this.redirected = false;
      this.mutated = false;
      util.centerSprite(this);
    },
    update: function update() {
      this.update$Sprite();
      var ring = this.parent.parent.ring;
      var dist = this.position.distance(ring.position);

      // hit ring
      if(!this.redirected && ring.radius + RING_FUZZ < dist &&
          dist < ring.totalRadius() + RING_FUZZ) {
        this.parent.tryBindArrow(this);
      } else if(dist < MOVE_ZONE && !this.redirected) { //hit center
        this.parent.spriteInCenter = this;
        var partner = this.parent.getOpposite().spriteInCenter;
        if(partner != null && !this.mutated && !partner.mutated) {
          this.mutate(partner);
        }
        if(this.arrow != null) {
          var tween = this.game.add.tween(this);
          var pos = this.getGoal().position;
          tween.to({
            x: pos.x,
            y: pos.y
          }, this.parent.speed);
          tween.start();
          this.redirected = true;
        } else {
          this.parent.parent.healthValue -= MISS_DAMAGE;
          this.parent.remove(this);
        }
      } else if(this.redirected && this.arrow != null && //hit goal
          this.getGoal().position.distance(this.position) < MOVE_ZONE) {
        if(this.getGoal().shape != this.shape)
          this.parent.parent.healthValue -= MISS_DAMAGE;
        else
          this.parent.parent.score++;
        this.parent.remove(this);
      }
    },
    getGoal: function getGoalPos() {
      if(this.arrow == null) return null;
      return this.parent.parent.goals.getGoal(this.arrow.direction);
    },
    mutate: function mutate(partner) {
      this.mutated = true;
      partner.mutated = true;
      if(this.shape == partner.shape) {
        if(this.color == partner.color) {
          this.shape = this.shape.next.next;
          partner.shape = partner.shape.next.next;
        } else {
          this.shape = this.shape.next;
          partner.shape = partner.shape.next;
        }
      } else {
        if(this.color == partner.color) {
          this.shape = this.shape.prev;
          partner.shape = partner.shape.prev;
        } else {
          return;
        }
      }
      this.updateTexture();
      partner.updateTexture();
    },
    updateTexture: function updateTexture() {
      this.setTexture(util.getTextureFromCache(this.game,
          Piece.getTextureName(this.shape, this.color)));
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
      this.next = null;
      this.prev = null
      Shape.shapes.push(this);
    }
  });
  Shape.shapes = [];
  Shape.triangle = new Shape('triangle', 'images/triangle');
  Shape.square = new Shape('square', 'images/square');
  Shape.circle = new Shape('circle', 'images/circle');
  Shape.pentagon = new Shape('pentagon', 'images/pentagon');
  for(var i=0; i<Shape.shapes.length; i++) {
    var shape = Shape.shapes[i];
    shape.next = Shape.shapes[(i + 1) % Shape.shapes.length];
    shape.prev = Shape.shapes[i == 0 ? Shape.shapes.length - 1 :
        (i - 1) % Shape.shapes.length];
  }

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
    },
    getGoal: function getGoal(direction) {
      var shape;
      switch(direction) {
        case Direction.up: shape = Shape.triangle; break;
        case Direction.right: shape = Shape.square;  break;
        case Direction.down: shape = Shape.circle; break;
        case Direction.left: shape = Shape.pentagon; break;
      }
      for(var i=0; i<this.children.length; i++) {
        var child = this.children[i];
        if(child instanceof Goal && child.shape == shape)
          return child;
      }
      return null;
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
    constructor: function Ring(game, parent, radius, thickness, colorFull, colorEmpty) {
      var outer = radius + thickness;
      this.bitmap = util.createBitmap(game, 2 * outer, 2 * outer);
      this.constructor$Sprite(game, parent.placements.ringCenter.x,
          parent.placements.ringCenter.y, this.bitmap);
      util.centerSprite(this);
      this.radius = radius;
      this.thickness = thickness;
      this.colorFull = colorFull;
      this.colorEmpty = colorEmpty
    },
    update: function update() {
      var context = this.bitmap.context;
      context.clearRect(0, 0, this.bitmap.canvas.width, this.bitmap.canvas.height);
      var angle = 2 * Math.PI * (this.parent.healthValue / 100);
      this.drawArc(0, angle, this.colorFull, true);
      if(this.parent.healthValue != 100)
        this.drawArc(angle, 0, this.colorEmpty, false);
      this.bitmap.dirty = true;
    },
    drawArc: function drawArc(startAngle, stopAngle, color, shouldFill) {
      var context = this.bitmap.context;
      context.fillStyle = context.strokeStyle = color;
      context.save();
      context.beginPath();
      context.arc(this.center().x, this.center().y, this.radius, startAngle, stopAngle);

      var end = this.getEndPoint(stopAngle);
      context.lineTo(end.x, end.y);

      context.arc(this.center().x, this.center().y, this.totalRadius(), stopAngle, startAngle, true);
      context.closePath();

      if(shouldFill) context.fill();
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

  var Arrow = util.extend(Phaser.Sprite, 'Arrow', {
    constructor: function Arrow(game, direction, x, y, piece) {
      this.constructor$Sprite(game, x, y, 'images/direction');
      this.direction = direction;
      this.piece = piece;
      this.angle = direction.angle;
      util.centerSprite(this);
    },
    update: function update() {
      if(this.piece != null) {
        this.position.x = this.piece.position.x;
        this.position.y = this.piece.position.y;
      }
    },
    onBound: function onBound(piece) {
      this.piece = piece;
      piece.events.onRemovedFromGroup.add(this.onPieceRemoved.bind(this));
    },
    onPieceRemoved: function() {
      this.parent.remove(this);
    }
  });

  var Direction = util.extend(Object, 'Direction', {
    constructor: function Direction(name, angle, leftKey, rightKey) {
      this.name = name;
      this.angle = angle;
      this.leftKey = Phaser.KeyCode[leftKey];
      this.rightKey = Phaser.KeyCode[rightKey];
      Direction.byLeftKey[this.leftKey] = this;
      Direction.byRightKey[this.rightKey] = this;
      Direction.directions.push(this);
    },
    getKey: function getKey(side) {
      switch(side) {
        case Side.Left: return this.leftKey;
        case Side.Right: return this.rightKey;
      }
    }
  });
  Direction.byLeftKey = {};
  Direction.byRightKey = {};
  Direction.directions =[];
  Direction.left = new Direction('left', -90, 'A', 'LEFT');
  Direction.right = new Direction('right', 90, 'D', 'RIGHT');
  Direction.up = new Direction('up', 0, 'W', 'UP');
  Direction.down = new Direction('down', 180, 'S', 'DOWN');

  return {
    PlayState: PlayState,
    Shape: Shape,
    Color: Color,
    Piece: Piece
  }
});
