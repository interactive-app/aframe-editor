require('./css/main.css');
require('./css/light.css');
require('./css/custom.css');
require('./css/toolbar.css');

var AttributesPanel = require('./attributes');
var ToolPanel = require('./tools');
var Sidebar = require('./sidebar.js');

function Panels (editor) {

	var el = document.createElement('div');
	el.className = 'editor-right-container';

	//this.attributesPanel = new AttributesPanel();
	//el.appendChild(this.attributesPanel.el);

	this.toolPanel = new ToolPanel();
	document.body.appendChild(this.toolPanel.el);

	document.body.appendChild(el);

	this.sidebar = new Sidebar(editor);
	this.sidebar.hide();
	document.body.appendChild(this.sidebar.dom);
	
}

module.exports = Panels;
