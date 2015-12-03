require('./css/main.css');
require('./css/light.css');
require('./css/custom.css');
require('./css/toolbar.css');

var AttributesPanel = require('./attributes');
var ToolPanel = require('./tools');
var Sidebar = require('./sidebar.js');

function Panels (editor) {

	this.toolPanel = new ToolPanel();
	document.body.appendChild(this.toolPanel.el);

	this.sidebar = new Sidebar(editor);
	this.sidebar.hide();
	document.body.appendChild(this.sidebar.dom);
	
}

module.exports = Panels;
