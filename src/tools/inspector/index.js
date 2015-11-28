var PropertiesPanel = require('./properties');

/*
Modify inspect tool
*/
module.exports = {
  name: 'Inspect',

  start: function () {
    this.scene = document.querySelector('a-scene');
    this.camera = this.scene.cameraEl;

    this.setupCursor();
    this.addListeners();
    this.propertiesPanel = new PropertiesPanel();
  },

  end: function () {
    if (this.selectedEntity) {
      this.drop();
    }
    this.propertiesPanel.hide();
    this.removeListeners();
    this.removeCursor();
  },

  addListeners: function () {
    this.onContextmenu = this.use.bind(this);
    this.onIntersection = this.handleIntersection.bind(this);
    this.onIntersectionClear = this.handleIntersectionClear.bind(this);

    this.scene.canvas.addEventListener('contextmenu', this.onContextmenu);
    this.cursor.addEventListener('intersection', this.onIntersection);
    this.cursor.addEventListener('intersectioncleared', this.onIntersectionClear);
  },

  removeListeners: function () {
    this.scene.canvas.removeEventListener('contextmenu', this.onContextmenu);
    this.cursor.removeEventListener('intersection', this.onIntersection);
    this.cursor.removeEventListener('intersectioncleared', this.onIntersectionClear);
  },

  setupCursor: function () {
    this.cursor = document.createElement('a-entity');
    this.cursor.setAttribute('id', 'editor-inspect-cursor');
    this.cursor.setAttribute('position', '0 0 -10');
    this.cursor.setAttribute('cursor', 'maxDistance: 30');
    this.cursor.setAttribute('geometry', 'primitive: box; width: 0.3; height: 0.3; depth: 0.3');
    this.cursor.setAttribute('material', 'color: yellow; receiveLight: false;');
    this.camera.appendChild(this.cursor);
  },

  removeCursor: function () {
    this.cursor.parentNode.removeChild(this.cursor);
    this.cursor = null;
  },

  handleIntersection: function (e) {
    this.currentIntersection = e.detail;
  },

  handleIntersectionClear: function (e) {
    this.currentIntersection = null;
  },

  pick: function () {
    if (!this.currentIntersection) {
      this.propertiesPanel.hide();
      return;
    }

    var entity = this.currentIntersection.el;
    this.propertiesPanel.inspect(entity);
  },

  use: function (e) {
    e.preventDefault();
    this.pick();
  }
};
