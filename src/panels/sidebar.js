var UI = require('./ext/ui.js');
var SceneGraph = require('./scenegraph');
var Attributes = require('./attributes');

function Sidebar (editor) {
  var container = new UI.Panel();
  container.setId('sidebar');

  this.sceneGraph = new SceneGraph(editor);
  this.attributes = new Attributes(editor);

  var scene = new UI.Span().add(
    this.sceneGraph,
    this.attributes
  );

  container.add(scene);

  return container;
}

module.exports = Sidebar;
