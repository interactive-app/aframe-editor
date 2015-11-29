var css = require('./index.css');
console.log(css);

function Panel () {
  this.visible = false;
}

Panel.prototype.show = function () {
  var uiEl = document.createElement('div');
  uiEl.classList.add('editor-attributes');
  document.body.appendChild(uiEl);
  this.panelEl = uiEl;
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

  this.makeForms(entity);
};

Panel.prototype.makeInput = function (properties) {
  var inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.name = properties.name;
  inputEl.value = properties.value;
  return inputEl;
};

Panel.prototype.makePropertyInputs = function (attributeName, properties) {
  var div = document.createElement('div');
  if (typeof properties === 'object') {
    // multiple properties
    for (var property in properties) {
      // property names
      div.appendChild(this.makeInput({
        name: attributeName + '_' + property + '_prop',
        value: property,
        class: 'editor-attributes--name'
      }));

      // property values
      div.appendChild(this.makeInput({
        name: attributeName + '_' + property + '_value',
        value: properties[property],
        class: 'editor-attributes--value'
      }));

      div.appendChild(document.createElement('br'));
    }
  } else if (typeof properties === 'string') {
    // single property value
    div.appendChild(this.makeInput({
      name: attributeName + '_value',
      value: properties,
      class: 'editor-attributes--value'
    }));

    div.appendChild(document.createElement('br'));
  }
  return div;
};

Panel.prototype.makeForms = function (entity) {
  // create input for each attribute
  var attributes = Array.prototype.slice.call(entity.attributes);

  attributes.forEach(function (attribute) {
    // edit form
    var attributeForm = document.createElement('form');
    attributeForm.classList.add('editor-attributes--attribute');

    // atrribute name
    var attributeNameInput = document.createElement('input');
    attributeNameInput.classList.add('attribute');
    attributeNameInput.type = 'text';
    attributeNameInput.name = attribute.name;
    attributeNameInput.value = attribute.name;
    attributeForm.appendChild(attributeNameInput);
    attributeForm.appendChild(document.createElement('br'));

    // generate inputs for each attribute property.
    var properties = entity.getAttribute(attribute.name);
    var inputsEl = this.makePropertyInputs(attribute.name, properties, attributeForm);

    attributeForm.appendChild(inputsEl);

    this.panelEl.appendChild(attributeForm);
  }.bind(this));
};

module.exports = Panel;
