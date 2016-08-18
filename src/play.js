base.registerModule('play', function() {
  var util = base.importModule('util');
  var menu = base.importModule('menu');
  var animation = base.importModule('animation');
  var playUtil = base.importModule('playUtil');

  var rand = playUtil.rand;
  var Shape = playUtil.Shape;
  var Color = playUtil.Color;
  var getTextureName = playUtil.getTextureName;

  var RING_FUZZ = 10;
  var MOVE_ZONE = 2;
  var QUEUE_INIT_SPEED = 15000; //rate at which pieces are spawned
  var QUEUE_INIT_ACCEL = 0.1;
  var QUEUE_JERK = 0.0000005;
  var QUEUE_SPEED_MIN = 3000;
  var SPAWN_RATE = 0.4;
  var MISS_DAMAGE = 10;
  var RECOVER_SPEED = 0.5 * 2 * MISS_DAMAGE / QUEUE_INIT_SPEED; //rate at which health is regained
  var RING_RADIUS = 25;
  var INTRO_ANIM_TIME = 500;
  var SUCCESS_ANIM_TIME = 500;

  var PlayState = util.extend(Phaser.State, 'PlayState', {
    constructor: function PlayState() {
      this.playGame = null;
    },
    create: function create() {
      this.playGame = new PlayGame(this.game);
      this.game.world.add(this.playGame.sprite);
    },
    shutdown: function shutdown() {
      util.clearBitmapCache();
    },
    update: function update() {
      this.playGame.update();
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
    };
    var names = Object.getOwnPropertyNames(places);
    var ret = {};
    for(var i=0; i<names.length; i++) {
      var name = names[i];
      var coord = places[name];
      var point = new Phaser.Point(coord[0], coord[1]);
      ret[name] = point;
    }
    return ret;
  }

  var GameContextual = util.extend(util.Contextual, 'GameContextual', {
    game: util.contextAttr,
    placements: util.contextAttr,
    ring: util.contextAttr,
    speed: util.contextAttr,
    health: util.contextAttr,
    score: util.contextAttr,
    goals: util.contextAttr,
    onUpdate: util.contextAttr,
    playGame: util.contextAttr
  });

  /**
   * the play area
   */
  var PlayGame = util.extend(GameContextual, 'PlayGame', {
    constructor: function PlayGame(game) {
      this.constructor$GameContextual();
      //context
      this.game = game;
      this.onUpdate = new Phaser.Signal();
      this.placements = makePlacements(game, game.scale.width, game.scale.height);
      this.playGame = this;

      //properties
      this.sprite = game.make.group(game.world);
      this.lastTick = game.time.elapsedSince(0);

      //rules
      this.health = this.create(Health); //when it hits zero game over. out of 100
      this.health.getOnLose().add(function() {
          menu.LoseMenu.instance.score = this.score.getScore();
          this.game.state.start('loseMenu');
      }.bind(this));
      this.speed = this.create(SpeedManager);
      this.score = this.create(Score);

      //children
      this.particles = new menu.ParticleGroup(game);
      this.sprite.add(this.particles);
      this.goals = new GoalGroup(game, this); //shapes to specify what goes where
      this.ring = this.create(Ring, this, RING_RADIUS, 5, '#000000', '#888888'); //ring for health
      this.queueLeft = this.create(PieceQueue, this, Side.Left); //line of shapes on the left
      this.queueRight = this.create(PieceQueue, this, Side.Right); //line of shapes on the right

      //intro animation
      this.fader = this.create(Fader, this.sprite, 0, 1, INTRO_ANIM_TIME);
      this.fader.start();
    },
    update: function update() {
      var deltaTime = this.sprite.game.time.elapsedSince(this.lastTick);
      this.lastTick = this.sprite.game.time.elapsedSince(0);
      this.queueLeft.spriteInCenter = null;
      this.queueRight.spriteInCenter = null;
      this.onUpdate.dispatch(deltaTime);
    },
  });

  var Fader = util.extend(GameContextual, 'Fader', {
    constructor: function Fader(sprite, begin, end, time) {
      this.constructor$GameContextual();
      this.sprite = sprite;
      this.begin = begin;
      this.end = end;
      this.time = time;
    },
    start: function start() {
      this.alpha = this.begin;
      var tween = this.game.add.tween(this.sprite);
      tween.to({
        alpha: this.end
      }, this.time);
      tween.start();
    }
  });

  var Score = util.extend(GameContextual, 'Score', {
    constructor: function Score() {
      this.constructor$GameContextual();
      this.score = 0;
      this.sprite = this.game.add.text(this.placements.score.x, this.placements.score.y, '', {
        font: '24px Arial', fill: '#000000'
      });
      this.onUpdate.add(this.update, this);
    },
    update: function update() {
      this.sprite.text = 'Score: ' + this.score;
    },
    incr: function incr() {
      this.score++;
    },
    getScore: function getScore() {
      return this.score;
    }
  });

  var Health = util.extend(GameContextual, 'Health', {
    constructor: function Health() {
      this.constructor$GameContextual();
      this.health = 100;
      this.onLose = new Phaser.Signal();
      this.onUpdate.add(this.update, this);
    },
    update: function update(deltaTime) {
      this.health = Math.min(this.health + RECOVER_SPEED * deltaTime, 100);
    },
    damage: function damage(amount) {
      this.health -= amount;
      if(this.health <= 0) {
        this.onLose.dispatch();
      }
    },
    getHealth: function getHealth() {
      return this.health;
    },
    getOnLose: function getOnLose() {
      return this.onLose;
    }
  });

  var SpeedManager = util.extend(GameContextual, 'SpeedManager', {
    constructor: function SpeedManager() {
      this.constructor$GameContextual();
      this.acceleration = QUEUE_INIT_ACCEL;
      this.speed = QUEUE_INIT_SPEED;
      this.onUpdate.add(this.update, this);
    },
    update: function update(deltaTime) {
      this.acceleration = Math.max(this.acceleration - QUEUE_JERK * deltaTime, 0);
      this.speed = Math.max(this.speed - this.acceleration * deltaTime, QUEUE_SPEED_MIN);
    },
    getSpeed: function() {
      return this.speed;
    }
  });

  var QueueContextual = util.extend(GameContextual, 'QueueContextual', {
    //objects
    side: util.contextAttr,
    pieces: util.contextAttr,
    addPiece: function addPiece(x) {
      this.pieces.push(x);
    },
    removePiece: function removePiece(x) {
      this.pieces.splice(this.pieces.indexOf(x), 1);
    },
    queue: util.contextAttr,
    //rules
    arrowBinder: util.contextAttr,
    arrowCreator: util.contextAttr,
    pieceRedirect: util.contextAttr,
    goalHit: util.contextAttr,
    spawner: util.contextAttr,
    //events
    onPieceUpdate: util.contextAttr,
    onSuccess: util.contextAttr,
    onFail: util.contextAttr,
    onRingContact: util.contextAttr,
    onCenterContact: util.contextAttr,
    onGoalContact: util.contextAttr
  });

  /**
   * holds shapes that will be played
   */
  var PieceQueue = util.extend(QueueContextual, 'PieceQueue', {
    constructor: function PieceQueue(parent, side) {
      this.constructor$QueueContextual();
      this.sprite = this.game.make.group(parent.sprite);
      this.spriteInCenter = null; //sprite in the center to be mutated

      //context
      this.queue = this;
      this.side = side; //which way the queue is facing
      this.pieces = [];
      this.unboundedArrow = null;

      //context signals
      this.onPieceUpdate = new Phaser.Signal();
      this.onSuccess = new Phaser.Signal();
      this.onFail = new Phaser.Signal();
      this.onRingContact = new Phaser.Signal();
      this.onCenterContact = new Phaser.Signal();
      this.onGoalContact = new Phaser.Signal();

      //rules
      this.arrowBinder = this.create(ArrowBinder);
      this.arrowCreator = this.create(ArrowCreator);
      this.pieceRedirect = this.create(PieceRedirect);
      this.goalHit = this.create(GoalHit);
      this.spawner = this.create(Spawner);
      this.pieceFail = this.create(PieceFail);
      this.pieceSuccess = this.create(PieceSuccess);

      this.onUpdate.add(this.update, this);
    },
    getOpposite: function getOpposite() {
      switch(this.side) {
        case Side.Left: return this.playGame.queueRight;
        case Side.Right: return this.playGame.queueLeft;
      }
    },
    update: function update() {
      for(var i=0; i<this.pieces.length; i++) {
        this.onPieceUpdate.dispatch(this.pieces[i]);
      }
    }
  });

  function getSpawnPos(side, placements) {
    return side == Side.Left ? placements.leftSpawn : placements.rightSpawn;
  }

  function getArrowPos(ring, placements, side) {
    var spawnPos = getSpawnPos(side, placements);
    var center = placements.ringCenter;
    var radius = ring.getRadius() + ring.getThickness() / 2;
    return util.lineCircleIntersect(spawnPos, center, radius);
  }

  function sendPiece(game, piece, pos, speed, signal) {
    var tween = game.add.tween(piece.sprite);
    tween.to({
      x: pos.x,
      y: pos.y
    }, speed);
    tween.onComplete.add(function() {
      signal.dispatch(piece);
    });
    tween.start();
  }

  function relativeSpeed(baseSpeed, beginning, side, placements, ring) {
    var spawnPos = getSpawnPos(side, placements);
    var arrowPos = getArrowPos(ring, placements, side);
    var other = beginning ? spawnPos : placements.queueTarget;
    return baseSpeed * (arrowPos.distance(other) / spawnPos.distance(placements.queueTarget));
  }

  var Spawner = util.extend(QueueContextual, 'Spawner', {
    constructor: function Spawner() {
      this.constructor$QueueContextual();
      var rate = SPAWN_RATE;
      var signal = new Phaser.Signal();
      var spawnPos = getSpawnPos(this.side, this.placements);
      var pos = getArrowPos(this.ring, this.placements, this.side);
      var speed = relativeSpeed(this.speed.getSpeed(), true, this.side, this.placements, this.ring);

      signal.add(function() {
        var piece = Piece.randomPiece(this.game, this.queue, spawnPos.x, spawnPos.y);
        sendPiece(this.game, piece, pos, speed, this.onRingContact);
        this.queue.sprite.add(piece.sprite);
        this.addPiece(piece);
        this.game.time.events.add(rate * this.speed.getSpeed(), signal.dispatch, signal);
      }, this);
      signal.dispatch();
    }
  });

  var ArrowCreator = util.extend(QueueContextual, 'ArrowCreator', {
    constructor: function ArrowCreator() {
      this.constructor$QueueContextual();
      this.arrowPos = getArrowPos(this.ring, this.placements, this.side);
      this.onUpdate.add(this.update, this);
    },
    update: function update() {
      var unboundedArrow = this.queue.unboundedArrow;
      if(unboundedArrow !== null && this.game.input.keyboard.isDown(unboundedArrow.direction.getKey(this.side))) {
        return;
      } else {
        if(unboundedArrow !== null) {
          this.queue.sprite.remove(unboundedArrow.sprite);
          this.queue.unboundedArrow = null;
        }
        for(var i=0; i<Direction.directions.length; i++) {
          var direction = Direction.directions[i];
          if(this.game.input.keyboard.isDown(direction.getKey(this.side))) {
            var pos = this.arrowPos;
            this.queue.unboundedArrow = new Arrow(this.game, this.queue, direction, Math.round(pos.x), Math.round(pos.y), null);
            this.queue.sprite.add(this.queue.unboundedArrow.sprite);
            break;
          }
        }
      }
    }
  });

  var ArrowBinder = util.extend(QueueContextual, 'ArrowBinder', {
    constructor: function ArrowBinder() {
      this.constructor$QueueContextual();
      this.onRingContact.add(this.updatePiece, this);
    },
    updatePiece: function updatePiece(piece) {
      if(this.queue.unboundedArrow !== null && piece.arrow === null) {
        piece.arrow = this.queue.unboundedArrow;
        this.queue.unboundedArrow.onBound(piece);
        this.queue.unboundedArrow = null;
      }
      var speed = relativeSpeed(this.speed.getSpeed(), false, this.side, this.placements, this.ring);
      sendPiece(this.game, piece, this.placements.queueTarget, speed, this.onCenterContact);
    }
  });

  var PieceRedirect = util.extend(QueueContextual, 'PieceRedirect', {
    constructor: function PieceRedirect() {
      this.constructor$QueueContextual();
      this.onCenterContact.add(this.updatePiece, this);
    },
    updatePiece: function updatePiece(piece) {
      var dist = piece.sprite.position.distance(this.ring.getPosition());
      this.queue.spriteInCenter = piece;
      var partner = this.queue.getOpposite().spriteInCenter;
      if(partner !== null && !piece.mutated && !partner.mutated) {
        this.mutate(piece, partner);
      }
      if(piece.arrow !== null) {
        var tween = this.game.add.tween(piece.sprite);
        sendPiece(this.game, piece,  piece.getGoal().sprite.position, this.speed.getSpeed() / 10, this.onGoalContact);
      } else {
        this.onFail.dispatch(piece);
      }
    },
    mutate: function mutate(piece, partner) {
      piece.mutated = true;
      partner.mutated = true;
      if(piece.shape == partner.shape) {
        if(piece.color == partner.color) {
          piece.shape = piece.shape.next.next;
          partner.shape = partner.shape.next.next;
        } else {
          piece.shape = piece.shape.next;
          partner.shape = partner.shape.next;
        }
      } else {
        if(piece.color == partner.color) {
          piece.shape = piece.shape.prev;
          partner.shape = partner.shape.prev;
        } else {
          return;
        }
      }
      this.updateTexture(piece);
      this.updateTexture(partner);
    },
    updateTexture: function updateTexture(piece) {
      piece.sprite.setTexture(util.getTextureFromCache(this.game,
          Piece.getTextureName(piece.shape, piece.color)));
    }
  });

  var GoalHit = util.extend(QueueContextual, 'GoalHit', {
    constructor: function PieceRedirect() {
      this.constructor$QueueContextual();
      this.onGoalContact.add(this.updatePiece, this);
    },
    updatePiece: function updatePiece(piece) {
     if(piece.arrow !== null) {
        if(piece.getGoal().shape != piece.shape) {
          this.onFail.dispatch(piece);
        } else {
          this.onSuccess.dispatch(piece);
        }
      }
    }
  });

  var PieceFail = util.extend(QueueContextual, 'PieceFail', {
    constructor: function() {
      this.constructor$QueueContextual();
      this.onFail.add(this.doFail.bind(this));
    },
    doFail: function doFail(piece) {
      this.health.damage(MISS_DAMAGE);
      this.removePiece(piece);
      this.queue.sprite.remove(piece.sprite);
      animation.createParticleSprites(this.game, piece.sprite);
      this.game.playSound('fail');
    }
  });

  var PieceSuccess = util.extend(QueueContextual, 'PieceSuccess', {
    constructor: function PieceSuccess() {
      this.constructor$QueueContextual();
      this.onSuccess.add(this.doSuccess.bind(this));
    },
    doSuccess: function doSuccess(piece) {
      this.removePiece(piece);
      this.queue.sprite.remove(piece.arrow.sprite);
      piece.arrow = null;

      var tween1 = this.game.add.tween(piece.sprite.scale);
      tween1.to({
        x: 1.5,
        y: 1.5
      }, SUCCESS_ANIM_TIME);

      var tween2 = this.game.add.tween(piece.sprite);
      tween2.to({
        alpha: 0
      }, SUCCESS_ANIM_TIME);
      tween2.onComplete.add(this.queue.sprite.remove.bind(this.queue.sprite, piece.sprite));

      tween1.start();
      tween2.start();
      this.score.incr();
      this.game.playSound('success');
    }
  });

  var Piece = util.extend(Object, 'Piece', {
    constructor: function Piece(game, parent, x, y, shape, color) {
      var texture = util.getTextureFromCache(game, Piece.getTextureName(shape, color));
      this.sprite = game.make.sprite(x, y, texture);
      this.parent = parent;
      this.shape = shape;
      this.color = color;
      this.arrow = null;
      this.mutated = false;
      util.centerSprite(this.sprite);
    },
    getGoal: function getGoal() {
      if(this.arrow === null) return null;
      return this.parent.goals.getGoal(this.arrow.direction);
    }
  });
  Piece.randomPiece = function randomPiece(game, parent, x, y) {
    return new Piece(game, parent, x, y, Shape.randomShape(), Color.randomColor());
  };
  Piece.getTextureName = getTextureName;

  /**
   * group for goals
   */
  var GoalGroup = util.extend(Object, 'GoalGroup', {
    constructor: function GoalGroup(game, parent) {
      this.sprite = game.make.group(parent.sprite);
      this.parent = parent;
      this.goals = [];
      for(var i=0; i<Shape.shapes.length; i++) {
        var shape = Shape.shapes[i];
        var goal = new Goal(game, this, shape);
        this.sprite.add(goal.sprite);
        this.goals.push(goal);
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
      for(var i=0; i<this.goals.length; i++) {
        var child = this.goals[i];
        if(child instanceof Goal && child.shape == shape)
          return child;
      }
      return null;
    }
  });

  /**
   * place where the shapes are supposed to go
   */
  var Goal = util.extend(Object, 'Goal', {
    constructor: function Goal(game, parent, shape) {
      var texture = util.getTextureFromCache(game, Goal.getTextureName(shape));
      this.parent = parent;
      this.shape = shape; //target shape
      var pos = this.goalPlacement();
      this.sprite = game.make.sprite(pos.x, pos.y, texture);
      this.leftKey = null; //key to press to send a shape from the left queue
      this.rightKey = null; //key to pressed to send a shape from the right queue
      util.centerSprite(this.sprite);
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

  var Ring = util.extend(GameContextual, 'Ring', {
    constructor: function Ring(parent, radius, thickness, colorFull, colorEmpty) {
      this.constructor$GameContextual();
      this.parent = parent;
      this.radius = radius;
      this.thickness = thickness;
      this.colorFull = colorFull;
      this.colorEmpty = colorEmpty;

      this.sprite = null;
      this.bitmap = null;
      var outer = radius + thickness;
      this.bitmap = util.createBitmap(this.game, 2 * outer, 2 * outer);
      this.sprite = this.game.add.sprite(this.placements.ringCenter.x,
          this.placements.ringCenter.y, this.bitmap);
      util.centerSprite(this.sprite);

      this.onUpdate.add(this.update, this);
    },
    update: function update() {
      var context = this.bitmap.context;
      context.clearRect(0, 0, this.bitmap.canvas.width, this.bitmap.canvas.height);
      var angle = 2 * Math.PI * (this.parent.health.getHealth() / 100);
      this.drawArc(0, angle, this.colorFull, true);
      if(this.parent.health.getHealth() != 100) {
        this.drawArc(angle, 0, this.colorEmpty, false);
      }
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
    },
    getPosition: function() {
      return this.sprite.position;
    },
    getRadius: function() {
      return this.radius;
    },
    getThickness: function() {
      return this.thickness;
    }
  });

  var Arrow = util.extend(Object, 'Arrow', {
    constructor: function Arrow(game, parent, direction, x, y, piece) {
      this.sprite = game.make.sprite(x, y, 'images/direction');
      this.parent = parent;
      this.direction = direction;
      this.piece = piece;
      this.sprite.angle = direction.angle;
      util.centerSprite(this.sprite);
      this.sprite.events.onAddedToGroup.add(function() {
        this.parent.onUpdate.add(this.update, this);
      }, this);
      this.sprite.events.onRemovedFromGroup.add(function() {
        this.parent.onUpdate.remove(this.update, this);
      }, this);
    },
    update: function update() {
      if(this.piece !== null) {
        this.sprite.position.x = this.piece.sprite.position.x;
        this.sprite.position.y = this.piece.sprite.position.y;
      }
    },
    onBound: function onBound(piece) {
      this.piece = piece;
      piece.sprite.events.onRemovedFromGroup.add(this.onPieceRemoved.bind(this));
    },
    onPieceRemoved: function() {
      this.parent.sprite.remove(this.sprite);
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

  var Side = {
    Left: 0,
    Right: 1
  };

  return {
    PlayState: PlayState,
    Shape: Shape,
    Color: Color,
    Piece: Piece,
    rand: rand
  };
});
