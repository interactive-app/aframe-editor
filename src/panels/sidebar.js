var UI = require('./ext/ui.js');
var SceneGraph = require('./scenegraph');
var Properties = require('./properties');

function Sidebar (editor) {

  	var container = new UI.Panel();
	container.setId('sidebar');

	this.sceneGraph = new SceneGraph(editor);
	this.properties = new Properties(editor);

	var scene = new UI.Span().add(
		this.sceneGraph,
		this.properties
	);

	container.add(scene);

	return container;
}

module.exports = Sidebar;
