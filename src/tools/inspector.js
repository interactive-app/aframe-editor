/* global aframeEditor */
/*
Inspector tool
*/
module.exports = {
  name: 'Inspect',

  start: function () {
    this.scene = document.querySelector('a-scene');
    this.camera = this.scene.cameraEl;

    this.attributesPanel = aframeEditor.editor.panels.attributesPanel;
    this.attributesPanel.show();
    this.scenePanel = aframeEditor.editor.panels.scenePanel;
    this.scenePanel.show();

    this.setupCursor();
    this.addListeners();
  },

  end: function () {
    this.attributesPanel.hide();
    this.scenePanel.hide();
    this.removeListeners();
    this.removeCursor();
  },

  addListeners: function () {
    this.onContextmenu = this.pick.bind(this);
    this.onIntersection = this.handleIntersection.bind(this);
    this.onIntersectionClear = this.handleIntersectionClear.bind(this);
    this.onEntityChange = this.handleEntityChange.bind(this);

    this.scene.canvas.addEventListener('contextmenu', this.onContextmenu);
    this.cursor.addEventListener('intersection', this.onIntersection);
    this.cursor.addEventListener('intersectioncleared', this.onIntersectionClear);

    this.attributesPanel.onEntityChange = this.onEntityChange;
  },

  removeListeners: function () {
    this.scene.canvas.removeEventListener('contextmenu', this.onContextmenu);
    this.cursor.removeEventListener('intersection', this.onIntersection);
    this.cursor.removeEventListener('intersectioncleared', this.onIntersectionClear);
  },

  setupCursor: function () {
    this.cursor = document.createElement('a-entity');
    this.cursor.dataset.isEditor = true;
    this.cursor.setAttribute('position', '0 0 -10');
    this.cursor.setAttribute('geometry', 'primitive: ring; radiusOuter: 0.3; radiusInner: 0.2');
    this.cursor.setAttribute('material', 'color: yellow; receiveLight: false;');
    this.cursor.setAttribute('cursor', 'maxDistance: 30');
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

  handleEntityChange: function (name, property, value) {
    var entity = this.selectedEntity;

    if (property) {
      // multiple attribute properties
      var properties = entity.getAttribute(name);
      properties[property] = value;
      entity.setAttribute(name, properties);
    } else {
      // single attribute value
      entity.setAttribute(name, value);
    }

    this.scenePanel.update();
  },

  pick: function (e) {
    e.preventDefault();
    if (!this.currentIntersection) {
      this.selectedEntity = null;
      this.attributesPanel.hide();
      return;
    }

    var entity = this.currentIntersection.el;
    this.selectedEntity = entity;
    this.attributesPanel.inspect(entity);
  }
};