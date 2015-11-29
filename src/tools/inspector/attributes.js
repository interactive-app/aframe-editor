require('./index.css');

function Panel () {
  this.visible = false;

  this.el = document.createElement('div');
  this.el.classList.add('editor-attributes');
}

Panel.prototype.show = function () {
  this.el.style.display = 'block';
  this.visible = true;
};

Panel.prototype.hide = function () {
  this.el.style.display = 'none';
  this.visible = false;
};

Panel.prototype.inspect = function (entity) {
  if (!this.visible) {
    this.show();
  }

  // clear panel and create new form
  this.el.innerHTML = '';

  this.makeForms(entity);
};

Panel.prototype.makeInput = function (properties) {
  var inputEl = document.createElement('input');

  function addDataAttribute (el, properties) {
    for (var prop in properties) {
      el.dataset[prop] = properties[prop];
    }
  }

  for (var prop in properties) {
    inputEl[prop] = properties[prop];
    if (prop === 'data') {
      addDataAttribute(inputEl, properties[prop]);
    }
  }

  return inputEl;
};

/**
 * Makes form inputs fields for each attribute properties.
 */
Panel.prototype.makePropertyInputs = function (attributeName, properties) {
  var container = document.createElement('div');

  if (typeof properties === 'object') {
    // attribute has multiple properties.
    for (var property in properties) {
      // create input for each property name
      container.appendChild(this.makeInput({
        value: property,
        data: {
          isName: true,
          attributeName: attributeName,
          attributeProperty: property
        }
      }));

      // create input each property value
      container.appendChild(this.makeInput({
        value: properties[property],
        data: {
          isValue: true,
          attributeName: attributeName,
          attributeProperty: property
        }
      }));

      container.appendChild(document.createElement('br'));
    }
  } else if (typeof properties === 'string') {
    // single property value
    container.appendChild(this.makeInput({
      value: properties,
      data: {
        isValue: true,
        attributeName: attributeName
      }
    }));

    container.appendChild(document.createElement('br'));
  }
  return container;
};

Panel.prototype.makeForms = function (entity) {
  // create input for each attribute
  var attributes = Array.prototype.slice.call(entity.attributes);

  attributes.forEach(function (attribute) {
    // edit form
    var attributeForm = document.createElement('form');
    attributeForm.classList.add('editor-attributes--attribute');
    attributeForm.addEventListener('change', this.onAttributeChange.bind(this));

    // atrribute name
    var nameInput = this.makeInput({
      name: attribute.name,
      value: attribute.name,
      class: 'attribute'
    });
    attributeForm.appendChild(nameInput);
    attributeForm.appendChild(document.createElement('br'));

    // generate inputs for each attribute property.
    var properties = entity.getAttribute(attribute.name);
    var inputsEl = this.makePropertyInputs(attribute.name, properties);

    attributeForm.appendChild(inputsEl);

    this.el.appendChild(attributeForm);
  }.bind(this));
};

Panel.prototype.onAttributeChange = function (e) {
  var target = e.target;
  var value = e.target.value;
  var dataset = target.dataset;

  // handle value changes
  if (dataset.isValue) {
    var attributeName = dataset.attributeName;
    var attributeProperty = dataset.attributeProperty;

    // fire change callback
    if (this.onEntityChange) {
      this.onEntityChange(attributeName, attributeProperty, value);
    }
  }
};

module.exports = Panel;
