/* global aframeCore */
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
  function addAttribute (componentName, attributeName, property, type, parameterSchema) {
    var widget = null;
    if (typeof parameterSchema ==='undefined') {
      parameterSchema={};
    }
    switch (type) {
      case 'select':
        var options = {};
        // Convert array to object
        for (var key in parameterSchema.oneOf) {
          options[parameterSchema.oneOf[key]] = parameterSchema.oneOf[key];
        }
        widget = new UI.Select().setOptions(options);
        break;
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
    if (parameterSchema.hasOwnProperty("min")) {
      widget.min = parameterSchema.min;
    }
    if (parameterSchema.hasOwnProperty("max")) {
      widget.max = parameterSchema.max;
    }
    widget.schema = parameterSchema; // Hack
    widget.onChange(function (event) {
      update(event, componentName, attributeName, property);
    });

    var id = attributeName ? componentName + '.' + attributeName + '.' + property : property ? (componentName + '.' + property) : componentName;
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

    // Position
    var objectPositionRow = new UI.Row();
    var objectPositionX = addAttribute('position', null, 'x', 'number');
    var objectPositionY = addAttribute('position', null, 'y', 'number');
    var objectPositionZ = addAttribute('position', null, 'z', 'number');

    objectPositionRow.add(new UI.Text('Position').setWidth('90px'));
    objectPositionRow.add(objectPositionX, objectPositionY, objectPositionZ);

    container.add(objectPositionRow);

    // Rotation
    var objectOrientationRow = new UI.Row();
    var objectRotationX = addAttribute('rotation', null, 'x', 'number');
    var objectRotationY = addAttribute('rotation', null, 'y', 'number');
    var objectRotationZ = addAttribute('rotation', null, 'z', 'number');

    objectOrientationRow.add(new UI.Text('Rotation').setWidth('90px'));
    objectOrientationRow.add(objectRotationX, objectRotationY, objectRotationZ);

    container.add(objectOrientationRow);

    // Scale
    var objectScaleRow = new UI.Row();
    var objectScaleX = addAttribute('scale', null, 'x', 'number');
    var objectScaleY = addAttribute('scale', null, 'y', 'number');
    var objectScaleZ = addAttribute('scale', null, 'z', 'number');

    objectScaleRow.add(new UI.Text('Scale').setWidth('90px'));
    objectScaleRow.add(objectScaleX, objectScaleY, objectScaleZ);

    container.add(objectScaleRow);

    // Visible
    var objectVisibleRow = new UI.Row();
    var objectVisible = addAttribute('visible', null, null, 'checkbox').setValue(1);

    objectVisibleRow.add(new UI.Text('Visible').setWidth('90px'));
    objectVisibleRow.add(objectVisible);

    container.add(objectVisibleRow);

    return container;
  }

  var componentsList;
  function generateNewComponentsRow () {
    var componentsRow = new UI.Row();
    var componentsOptions = {};
    var ignoredComponents = ['position', 'rotation', 'scale', 'visible'];
    for (var name in aframeCore.components) {
      if (ignoredComponents.indexOf(name) === -1) {
        componentsOptions[name] = name;
      }
    }

    function addComponent (componentName) {
      var entity = editor.selected.el;
      entity.setAttribute(componentName, '');
      updateRows(entity);
      updateUI(entity);
    }

    componentsList = new UI.Select().setId('componentlist').setOptions(componentsOptions).setWidth('150px');
    componentsRow.add(new UI.Text('Add').setWidth('90px'));
    componentsRow.add(componentsList);
    var button = new UI.Button('+').onClick(function () {
      addComponent(componentsList.getValue());
    });
    componentsRow.add(button.setWidth('20px'));
    return componentsRow;
  }

  container.add(generateCommonAttributes());
  container.add(generateNewComponentsRow());

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

    var availableComponents = componentsList.dom.querySelectorAll('option');
    for (var i = 0; i < availableComponents.length; i++) {
      availableComponents[i].disabled = entity.getAttribute(availableComponents[i].value);
    }

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

    updateWidgetVisibility(entity);
  }

  function updateWidgetVisibility(entity) {
    // Apply visibility
    for (var componentName in entity.components)
    {
      var properties = aframeCore.components[componentName].schema;
      for (var property in properties) {
        var id = componentName + '.' + property;
        var widget = widgets[id];
        if (widget && widget.parameterRow) {
          var visible = true;
          if (widget.schema.if) {
            for (var condition in widget.schema.if) {
              var ifWidget = widgets[componentName + '.' + condition];
              if (widget.schema.if[condition].indexOf(ifWidget.getValue()) ===-1) {
                visible = false;
              }
            }
          }
          if (visible) {
            widget.parameterRow.show();
          } else {
            widget.parameterRow.hide();
          }
        }
      }
    }
  }

  function setEmptyComponent (entity, componentName) {
    entity.setAttribute(componentName, '');
    updateRows(entity);
    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
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
      var componentSchema = aframeCore.components[componentName].schema;

      var objectActions = new UI.Select().setId(componentName).setPosition('absolute').setRight('8px').setFontSize('11px');
      objectActions.setOptions({
        'Actions': 'Actions',
        'Delete': 'Delete',
        'Clear': 'Clear'
        // 'Reset': 'Reset to initial'
      });

      objectActions.onClick(function (event) {
        event.stopPropagation(); // Avoid panel collapsing
      });
      objectActions.onChange(function (event, component) {
        var action = this.getValue();
        switch (action) {
          case 'Delete':
            entity.removeAttribute(this.getId());
          break;

          case 'Clear':
            setEmptyComponent(entity, this.getId());
          break;

          default:
            return;
        }
        this.setValue('Actions');
        updateRows(entity);
        updateUI(entity);
        editor.signals.objectChanged.dispatch(entity.object3D);
      });
      var container = new UI.CollapsiblePanel();
      container.addStatic(new UI.Text(componentName).setTextTransform('uppercase'), objectActions);
      container.add(new UI.Break());

      function addParameterRow (parameterName, parameterSchema) {
        var newParamRow = new UI.Row();
        newParamRow.add(new UI.Text(parameterName).setWidth('120px'));

        var defaultValue = parameterSchema.default;
        var type = null;
        if (parameterSchema.oneOf) {
          type = 'select';
        } else {
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
        }
        var newWidget = addAttribute(componentName, null, parameterName, type, parameterSchema);
        newWidget.setValue(defaultValue);
        newWidget.parameterRow = newParamRow;
        newParamRow.add(newWidget);
        return newParamRow;
      }
      for (var parameterName in componentSchema) {
        container.add(addParameterRow(parameterName, componentSchema[parameterName]));
      }

      /*
      console.log(component,componentSchema);
      if (typeof component.defaults === 'object') {
        for (var parameterName in component.defaults) {
          container.add(addParameterRow(parameterName, component.defaults[parameterName]));
        }
      } else {
        // Handle simple type defaults
        container.add(addParameterRow(null, component.defaults));
      }
      */
      container.add(new UI.Break());
      objectCustomRow.add(container);
    }
  }

  function update (event, componentName, attributeName, property) {
    ignoreComponentsChange = true;
    var entity = editor.selected.el;

    var id = attributeName ? componentName + '.' + attributeName + '.' + property : property ? (componentName + '.' + property) : componentName;
    var widget = widgets[id];

    handleEntityChange(entity, componentName, property, widget.getValue());

    updateWidgetVisibility(entity);

    editor.signals.objectChanged.dispatch(entity.object3D);
    ignoreComponentsChange = false;
  }

  return container;
}

module.exports = Attributes;
