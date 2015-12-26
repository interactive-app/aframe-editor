require('./css/main.css');
require('./css/light.css');
require('./css/custom.css');
require('./css/toolbar.css');

var ToolPanel = require('./tools');
var Sidebar = require('./sidebar.js');
var Menubar = require('./menubar/index.js');

function Panels (editor) {
  this.toolPanel = new ToolPanel(editor);
  document.body.appendChild(this.toolPanel.el);

  this.sidebar = new Sidebar(editor);
  this.sidebar.hide();
  document.body.appendChild(this.sidebar.dom);

  this.menubar = new Menubar(editor);
  this.menubar.hide();
  document.body.appendChild(this.menubar.dom);
}

module.exports = Panels;
