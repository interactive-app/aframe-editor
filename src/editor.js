var ToolBox = require('./toolBox');

function Editor () {
  this.toolBox = new ToolBox();
  document.addEventListener('DOMContentLoaded', this.onDomLoaded.bind(this));
}

Editor.prototype.onDomLoaded = function () {
  this.scene = document.querySelector('a-scene');
  this.camera = this.scene.cameraEl;

  this.setupControls();
  this.makeFloor();
};

// Controls
Editor.prototype.setupControls = function () {
  window.addEventListener('keypress', function (e) {
    switch (e.charCode) {
      case 32: // space
        this.toolBox.toggle();
        break;
    }
  }.bind(this));
};

// Floor
Editor.prototype.makeFloor = function () {
  var size = 2;
  var tileSize = 20;
  var tileSpacing = 0.1;
  var floorY = -1.5;

  var floor = document.createElement('a-entity');
  floor.id = 'floor';

  for (var c = 0; c < size; c++) {
    for (var r = 0; r < size; r++) {
      var plane = document.createElement('a-entity');
      plane.setAttribute('geometry', 'primitive: plane; width: ' + tileSize + '; height: ' + tileSize);
      plane.setAttribute('material', 'color: #111111');
      plane.setAttribute('rotation', '-90 0 0');

      var position = {
        x: (tileSpacing + tileSize) * c,
        y: 0,
        z: (tileSpacing + tileSize) * r
      };

      plane.setAttribute('position', position);

      floor.appendChild(plane);
    }
  }

  var offset = (size / 2) * (tileSize + tileSpacing);

  floor.setAttribute('position', {
    x: -offset,
    y: floorY,
    z: -offset
  });

  this.scene.appendChild(floor);
};

module.exports = new Editor();
