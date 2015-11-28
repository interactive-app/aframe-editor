function Panel() {
  this.visible = false;
}

Panel.prototype.show = function() {
  var ui = document.createElement('div');
  ui.style = 'z-index: 1000; position: absolute; right: 0px; top: 0px; background: rgba(255, 255, 255, 0.8)';
  document.body.appendChild(ui);
  this.panelEl = ui;
  this.visible = true;
}

Panel.prototype.hide = function() {
  if (!this.visible) {
    return;
  }
  this.panelEl.parentNode.removeChild(this.panelEl);
  this.visible = false;
}

Panel.prototype.inspect = function(entity) {
  if (!this.visible) {
    this.show();
  }

  // clear panel and create new form
  this.panelEl.innerHTML = '';
  var formEl = document.createElement('form');

  this.createInputs(entity, formEl);

  this.panelEl.appendChild(formEl);
}

Panel.prototype.createInputs = function(entity, form) {
  // create input for each attribute
  var attributes = Array.prototype.slice.call(entity.attributes);

  attributes.forEach(function(attribute) {
    // label for atrribute name
    var labelEl = document.createElement('label');
    labelEl.innerHTML = attribute.name;

    labelEl.appendChild(document.createElement('br'));

    // generate input for each property name and value pair
    var properties = entity.getAttribute(attribute.name);

    for (var property in properties) {
      // property labels
      var inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.name = attribute.name + '_' + property
      inputEl.value = property;
      labelEl.appendChild(inputEl);

      // values
      var inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.name = attribute.name + '_' + property + '_value';
      inputEl.value = properties[property];
      labelEl.appendChild(inputEl);

      labelEl.appendChild(document.createElement('br'));
    }

    form.appendChild(labelEl);
  }.bind(this));
}

module.exports = Panel;