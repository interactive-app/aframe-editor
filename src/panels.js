require('./panels/index.css');

var AttributesPanel = require('./panels/attributes');
var ScenePanel = require('./panels/scene');

function Panels() {
  var el = document.createElement('div');
  el.className = 'editor-container';

  this.attributesPanel = new AttributesPanel();
  el.appendChild(this.attributesPanel.el);

  this.scenePanel = new ScenePanel();
  el.appendChild(this.scenePanel.el);

  document.body.appendChild(el);
}

module.exports = Panels
