function Panel (editor) {
  this.el = document.createElement('div');
  this.el.classList.add('editor-tools');
  this.editor = editor;
  this.active = false;
  this.editToggle();
}

Panel.prototype.editToggle = function () {
  this.toggleButton = document.createElement('button');
  this.toggleButton.innerHTML = 'Edit';
  this.el.appendChild(this.toggleButton);
  this.toggleButton.addEventListener('click', this.onToggleClick.bind(this));
};

Panel.prototype.onToggleClick = function (e) {
  this.active = this.active === false;

  if (this.active) {
    this.editor.enable();
    this.toggleButton.innerHTML = 'Exit';
  } else {
    this.editor.disable();
    this.toggleButton.innerHTML = 'Edit';
  }
};

module.exports = Panel;
