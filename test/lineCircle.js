(function() {
  function main() {
    var context = document.getElementById('display').getContext('2d');
    context.save();
    context.fillStyle = context.strokeStyle = '#FFFFFF';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = context.strokeStyle = '#000000';

    var linex1 = 10;
    var liney1 = 10;
    var linex2 = 200;
    var liney2 = 300;
    var centerx = linex2;
    var centery = liney2;
    var radius = 75;

    context.beginPath();
    context.moveTo(linex1, liney1);
    context.lineTo(linex2, liney2);
    context.stroke();

    context.beginPath();
    context.arc(centerx, centery, radius, 0, 2*Math.PI);
    context.stroke();

    var point1 = new Phaser.Point(linex1, liney1);
    var point2 = new Phaser.Point(linex2, liney2);
    var vector = Phaser.Point.subtract(point1, point2).normalize();
    vector = Phaser.Point.multiply(vector, new Phaser.Point(radius, radius));
    vector = Phaser.Point.add(vector, point2);

    context.fillRect(vector.x, vector.y, 5, 5);

    context.restore();
  }

  document.addEventListener('DOMContentLoaded', main, false);
})();
