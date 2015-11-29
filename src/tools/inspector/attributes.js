var css = require('./index.css');
console.log(css);

function Panel () {
  this.visible = false;
}

Panel.prototype.show = function () {
  var ui = document.createElement('div');
  ui.classList.add('editor-attributes');
  document.body.appendChild(ui);
  this.panelEl = ui;
  this.visible = true;
};

Panel.prototype.hide = function () {
  if (!this.visible) {
    return;
  }
  this.panelEl.parentNode.removeChild(this.panelEl);
  this.visible = false;
};

Panel.prototype.inspect = function (entity) {
  if (!this.visible) {
    this.show();
  }

  // clear panel and create new form
  this.panelEl.innerHTML = '';

  this.createInputs(entity);
};

Panel.prototype.createInputs = function (entity) {
  // create input for each attribute
  var attributes = Array.prototype.slice.call(entity.attributes);

  attributes.forEach(function (attribute) {
    // form
    var formEl = document.createElement('form');
    formEl.classList.add('editor-attributes--attribute');

    // atrribute name
    var attributeEl = document.createElement('input');
    attributeEl.classList.add('attribute');
    attributeEl.type = 'text';
    attributeEl.name = attribute.name;
    attributeEl.value = attribute.name;
    formEl.appendChild(attributeEl);

    formEl.appendChild(document.createElement('br'));

    // generate input for each property name and value pair
    var properties = entity.getAttribute(attribute.name);

    for (var property in properties) {
      // property labels
      var propertyEl = document.createElement('input');
      propertyEl.classList.add('editor-attributes--name');
      propertyEl.type = 'text';
      propertyEl.name = attribute.name + '_' + property + '_prop';
      propertyEl.value = property;
      formEl.appendChild(propertyEl);

      // values
      var valueEl = document.createElement('input');
      propertyEl.classList.add('editor-attributes--value');
      valueEl.type = 'text';
      valueEl.name = attribute.name + '_' + property + '_value';
      valueEl.value = properties[property];
      formEl.appendChild(valueEl);

      formEl.appendChild(document.createElement('br'));
    }

    this.panelEl.appendChild(formEl);
  }.bind(this));
};

module.exports = Panel;
