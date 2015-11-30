/* global aframeEditor */

function Panel () {
  this.el = document.createElement('div');
  this.el.classList.add('editor-tools');

  this.tools = aframeEditor.editor.tools;
  this.makeTools();
}

Panel.prototype.makeTools = function () {
  var tools = this.tools;
  for (var tool in tools) {
    var button = document.createElement('button');
    button.id = tool;
    button.innerHTML = tool;
    button.addEventListener('click', this.onClick.bind(this));
    this.el.appendChild(button);
  }
};

Panel.prototype.onClick = function (e) {
  if (this.selectedTool) {
    this.selectedTool.end();
  }
  this.selectedTool = this.tools[e.target.id];
  this.selectedTool.start();
};

module.exports = Panel;
