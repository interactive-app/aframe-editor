require('./panels/index.css');

var AttributesPanel = require('./panels/attributes');
var ScenePanel = require('./panels/scene');
var ToolPanel = require('./panels/tools');

function Panels () {
  var el = document.createElement('div');
  el.className = 'editor-right-container';

  this.attributesPanel = new AttributesPanel();
  el.appendChild(this.attributesPanel.el);

  this.scenePanel = new ScenePanel();
  el.appendChild(this.scenePanel.el);

  this.toolPanel = new ToolPanel();
  document.body.appendChild(this.toolPanel.el);

  document.body.appendChild(el);
}

module.exports = Panels;
