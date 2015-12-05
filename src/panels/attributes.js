var UI = require('../../lib/vendor/ui.js'); // @todo will be replaced with the npm package

function handleEntityChange (entity, name, property, value) {
  if (property) {
    // multiple attribute properties
    var properties = entity.getAttribute(name);
    properties[property] = value;
    entity.setAttribute(name, properties);
  } else {
    // single attribute value
    entity.setAttribute(name, value);
  }
}

function Attributes (editor) {
  var ignoreComponentsChange = false;
  var container = new UI.Panel();
  container.setBorderTop('0');
  container.setPaddingTop('20px');
  container.setDisplay('none');

  var widgets = {};
  function addAttribute (componentName, attributeName, property, type) {
    var widget = null;
    switch (type) {
      case 'checkbox':
        widget = new UI.Checkbox().setWidth('50px');
        break;
      case 'number':
        widget = new UI.Number().setWidth('50px');
        break;
      case 'input':
        widget = new UI.Input('').setWidth('50px');
        break;
      case 'color':
        widget = new UI.Color().setWidth('50px');
        break;
      case 'vector3':
        widget = new UI.Vector3().setWidth('150px');
        break;
      default:
        console.warn('Unknown component type', componentName, attributeName, property, type);
        widget = new UI.Input('');
    }

    widget.onChange(function (event) {
      update(event, componentName, attributeName, property);
    });

    var id = attributeName ? componentName + '.' + attributeName + '.' + property : componentName + '.' + property;
    widgets[id] = widget;
    return widget;
  }

  var objectId, objectType;
  function generateCommonAttributes () {
    var container = new UI.CollapsiblePanel();

    container.addStatic(new UI.Text('Common attributes').setTextTransform('uppercase'));
    container.add(new UI.Break());

    // type
    var objectTypeRow = new UI.Row();
    objectType = new UI.Text();

    objectTypeRow.add(new UI.Text('Type').setWidth('90px'));
    objectTypeRow.add(objectType);

    container.add(objectTypeRow);

    // name
    var objectIdRow = new UI.Row();
    objectId = new UI.Input().setWidth('150px').setFontSize('12px').onChange(function () {
      handleEntityChange(editor.selected.el, 'id', null, objectId.getValue());
      editor.signals.sceneGraphChanged.dispatch();
    });

    objectIdRow.add(new UI.Text('ID').setWidth('90px'));
    objectIdRow.add(objectId);
    container.add(objectIdRow);

    // position
    var objectPositionRow = new UI.Row();
    var objectPositionX = addAttribute('position', null, 'x', 'number');
    var objectPositionY = addAttribute('position', null, 'y', 'number');
    var objectPositionZ = addAttribute('position', null, 'z', 'number');

    objectPositionRow.add(new UI.Text('Position').setWidth('90px'));
    objectPositionRow.add(objectPositionX, objectPositionY, objectPositionZ);

    container.add(objectPositionRow);

    var objectOrientationRow = new UI.Row();
    var objectRotationX = addAttribute('rotation', null, 'x', 'number');
    var objectRotationY = addAttribute('rotation', null, 'y', 'number');
    var objectRotationZ = addAttribute('rotation', null, 'z', 'number');

    objectOrientationRow.add(new UI.Text('Rotation').setWidth('90px'));
    objectOrientationRow.add(objectRotationX, objectRotationY, objectRotationZ);

    container.add(objectOrientationRow);

    var objectScaleRow = new UI.Row();
    var objectScaleX = addAttribute('scale', null, 'x', 'number');
    var objectScaleY = addAttribute('scale', null, 'y', 'number');
    var objectScaleZ = addAttribute('scale', null, 'z', 'number');

    objectScaleRow.add(new UI.Text('Scale').setWidth('90px'));
    objectScaleRow.add(objectScaleX, objectScaleY, objectScaleZ);

    container.add(objectScaleRow);

    return container;
  }

  container.add(generateCommonAttributes());

  // --- CUSTOM
  var objectCustomRow = new UI.Row();
  container.add(objectCustomRow);

  editor.signals.entitySelected.add(function (entity) {
    if (entity) {
      container.show();
      updateRows(entity);
      updateUI(entity);
    } else {
      container.hide();
    }
  });

  editor.signals.componentChanged.add(function (evt) {
    var entity = evt.detail.target;
    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
  });

  function updateUI (entity) {
    if (ignoreComponentsChange) {
      return;
    }

    objectType.setValue(entity.tagName);
    objectId.setValue(entity.id);

    var attributes = Array.prototype.slice.call(entity.attributes);
    attributes.forEach(function (attribute) {
      var properties = entity.getAttribute(attribute.name);
      for (var property in properties) {
        var id = attribute.name + '.' + property;
        var widget = widgets[id];
        if (widget) {
          widget.setValue(properties[property]);
        }
      }
    });
  }

  function updateRows (entity) {
    var componentsToIgnore = [
      'position', 'rotation', 'scale', 'visible'
    ];

    objectCustomRow.clear();

    for (var componentName in entity.components) {
      if (componentsToIgnore.indexOf(componentName) !== -1) {
        continue;
      }

      var component = entity.components[componentName];

      var container = new UI.CollapsiblePanel();
      container.addStatic(new UI.Text(componentName).setTextTransform('uppercase'));
      container.add(new UI.Break());

      for (var parameterName in component.defaults) {
        var newParamRow = new UI.Row();

        newParamRow.add(new UI.Text(parameterName).setWidth('120px'));

        var defaultValue = component.defaults[parameterName];

        var type = null;
        switch (typeof defaultValue) {
          case 'boolean':
            type = 'checkbox';
            break;
          case 'number':
            type = 'number';
            break;
          case 'object':
            type = 'vector3';
            break;
          case 'string':
            if (defaultValue.indexOf('#') === -1) {
              type = 'input';
            } else {
              type = 'color';
            }
            break;
          default:
            console.warn(parameterName, component.defaults[parameterName], typeof component.defaults[parameterName]);
        }
        var newWidget = addAttribute(componentName, null, parameterName, type);
        newWidget.setValue(defaultValue);
        newParamRow.add(newWidget);

        container.add(newParamRow);
      }
      container.add(new UI.Break());
      objectCustomRow.add(container);
    }
  }

  function update (event, componentName, attributeName, property) {
    ignoreComponentsChange = true;
    var entity = editor.selected.el;

    var id = attributeName ? componentName + '.' + attributeName + '.' + property : componentName + '.' + property;
    var widget = widgets[id];

    handleEntityChange(entity, componentName, property, widget.getValue());

    editor.signals.objectChanged.dispatch(entity.object3D);
    ignoreComponentsChange = false;
  }

  return container;
}

module.exports = Attributes;
