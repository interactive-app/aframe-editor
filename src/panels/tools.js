/* global aframeEditor */

function Panel () {
  this.el = document.createElement('div');
  this.el.classList.add('editor-tools');
  this.tools = aframeEditor.editor.tools;
  this.active = false;
  this.editToggle();
  this.makeTools();
  this.showTools(this.active);
}

Panel.prototype.editToggle = function () {
  this.toggleButton = document.createElement('button');
  this.toggleButton.innerHTML = 'Edit';
  this.el.appendChild(this.toggleButton);
  this.toggleButton.addEventListener('click', this.onToggleClick.bind(this));
};

Panel.prototype.makeTools = function () {
  var tools = this.tools;
  for (var tool in tools) {
    var button = document.createElement('button');
    button.id = tool;
    button.className = 'editor-tools--tool';
    button.innerHTML = tool;
    button.addEventListener('click', this.onToolClick.bind(this));
    this.el.appendChild(button);
  }
};

Panel.prototype.showTools = function (display) {
  var elements = this.el.querySelectorAll('.editor-tools--tool');
  var toolEls = Array.prototype.slice.call(elements);
  toolEls.forEach(function (el) {
    el.style.display = display ? 'block' : 'none';
  });
};

Panel.prototype.selectTool = function () {
  var first;
  for (first in this.tools) break;
  this.selectedTool = this.tools[first];
  this.selectedTool.start();
};

Panel.prototype.endCurrentTool = function () {
  if (this.selectedTool) {
    this.selectedTool.end();
  }
};

Panel.prototype.onToolClick = function (e) {
  this.endCurrentTool();
  this.selectedTool = this.tools[e.target.id];
  this.selectedTool.start();
};

Panel.prototype.onToggleClick = function (e) {
  this.active = this.active === false;

  if (this.active) {
    aframeEditor.editor.sceneEl.camera = aframeEditor.editor.viewport.camera;

    this.toggleButton.innerHTML = 'Exit';
    this.selectTool();
    this.showTools(true);
    aframeEditor.editor.helpers.show();
  } else {
    aframeEditor.editor.sceneEl.camera = null;

    this.toggleButton.innerHTML = 'Edit';
    this.endCurrentTool();
    this.showTools(false);
    aframeEditor.editor.helpers.hide();
  }
};

module.exports = Panel;
