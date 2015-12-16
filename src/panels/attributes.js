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
  var objectId, objectType, objectCustomRow;
  var componentsList;
  var widgets = {};
  var ignoreComponentsChange = false;

  /**
   * Creates and returns a widget based on the type of the attribute
   * If a schema is provided it's used to set min/max values or populate the combobox values.
   * @param {string} componentName   Name of the component that has this attribute (e.g: 'geometry')
   * @param {string} attributeName   Attribute name in the component (e.g: 'primitive')
   * @param {string} property        Property name in case of multivalues attributes (e.g: 'x')
   * @param {string} type            Type of the widget to generate (e.g: 'checkbox')
   * @param {JSON} parameterSchema [Optional] JSON with the schema definition of the attribute.
   * @return {UI.Widget} Returns an UI.js widget based on the type and schema of the attribute.
   */
  function addAttribute (componentName, attributeName, property, type, parameterSchema) {
    var widget = null;
    if (typeof parameterSchema === 'undefined') {
      parameterSchema = {};
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
    if (parameterSchema.hasOwnProperty('min')) {
      widget.min = parameterSchema.min;
    }
    if (parameterSchema.hasOwnProperty('max')) {
      widget.max = parameterSchema.max;
    }
    widget.schema = parameterSchema;
    widget.onChange(function (event) {
      updateEntityValue(event, componentName, attributeName, property);
    });

    // Generate an unique ID for this attribute (e.g: geometry.primitive)
    // and save it on the widgets variable so we could easily access to it in the following functions
    var id = attributeName ? componentName + '.' + attributeName + '.' + property : property ? (componentName + '.' + property) : componentName;
    widgets[id] = widget;
    return widget;
  }

  /**
   * Generates a container with the common attributes and components for each entity:
   *   - type
   *   - ID
   *   - position
   *   - rotation
   *   - scale
   *   - visible
   * @return {UI.CollapsiblePanel} Panel containing all the widgets
   */
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

  /**
   * Add component to the entity
   * @param {a-entity} entity        Entity
   * @param {string} componentName Component name
   */
  function addComponent (entity, componentName) {
    entity.setAttribute(componentName, '');
    generateComponentsPanels(entity);
    updateUI(entity);
  }

  /**
   * Generate a row including a combobox with the available components to add to
   * the current entity
   */
  function generateAddComponentRow () {
    var componentsRow = new UI.Row();
    var componentsOptions = {};
    var ignoredComponents = ['position', 'rotation', 'scale', 'visible'];
    for (var name in aframeCore.components) {
      if (ignoredComponents.indexOf(name) === -1) {
        componentsOptions[name] = name;
      }
    }

    componentsList = new UI.Select().setId('componentlist').setOptions(componentsOptions).setWidth('150px');
    componentsRow.add(new UI.Text('Add').setWidth('90px'));
    componentsRow.add(componentsList);
    var button = new UI.Button('+').onClick(function () {
      // Add the selected component from the combobox to the current active entity
      addComponent(editor.selected.el, componentsList.getValue());
    });
    componentsRow.add(button.setWidth('20px'));
    return componentsRow;
  }

  /**
   * Update the UI widgets based on the current entity & components values
   * @param  {a-entity} entity Entity currently selected
   */
  function updateUI (entity) {
    if (ignoreComponentsChange) {
      return;
    }

    objectType.setValue(entity.tagName);
    objectId.setValue(entity.id);

    // Disable the components already used form the list of available
    // components to add to this entity
    var availableComponents = componentsList.dom.querySelectorAll('option');
    for (var i = 0; i < availableComponents.length; i++) {
      availableComponents[i].disabled = entity.getAttribute(availableComponents[i].value);
    }

    // Update the value of the widgets based on the entity's components's attributes
    var components = Array.prototype.slice.call(entity.attributes);
    components.forEach(function (component) {
      var attributes = entity.getAttribute(component.name);
      for (var attribute in attributes) {
        var id = component.name + '.' + attribute;
        var widget = widgets[id];
        if (widget) {
          widget.setValue(attributes[attribute]);
        }
      }
    });

    updateWidgetVisibility(entity);
  }

  /**
   * Update the widgets visibility based on the 'if' attribute from theirs attribute' schema
   * @param  {a-entity} entity Entity currently selected
   */
  function updateWidgetVisibility (entity) {
    for (var componentName in entity.components) {
      var properties = aframeCore.components[componentName].schema;
      for (var property in properties) {
        var id = componentName + '.' + property;
        var widget = widgets[id];
        if (widget && widget.parameterRow) {
          var visible = true;
          if (widget.schema.if) {
            for (var condition in widget.schema.if) {
              var ifWidget = widgets[componentName + '.' + condition];
              if (widget.schema.if[condition].indexOf(ifWidget.getValue()) === -1) {
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

  /**
   * Reset to default (clear) one entity's component
   * @param {a-entity} entity        Entity
   * @param {string} componentName Component name to clear
   */
  function setEmptyComponent (entity, componentName) {
    entity.setAttribute(componentName, '');
    generateComponentsPanels(entity);
    updateUI(entity);
    editor.signals.objectChanged.dispatch(entity.object3D);
  }

  /**
   * Generates a row containing the parameter label and its widget
   * @param {string} componentName   Component name
   * @param {string} component   Component element
   * @param {string} parameterName   Parameter name
   * @param {object} parameterSchema Parameter schema
   */
  function addParameterRow (componentName, component, parameterName, parameterSchema) {
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

  /**
   * Generate an UI.CollapsiblePanel for each entity's component
   * @param  {a-entity} entity Current selected entity
   */
  function generateComponentsPanels (entity) {
    var componentsToIgnore = [
      'position', 'rotation', 'scale', 'visible'
    ];

    objectCustomRow.clear();

    for (var componentName in entity.components) {
      // Ignore the components that we've already included on the common attributes panel
      if (componentsToIgnore.indexOf(componentName) !== -1) {
        continue;
      }

      var component = entity.components[componentName];

      // Add a context menu to delete or reset the component
      var objectActions = new UI.Select()
        .setId(componentName)
        .setPosition('absolute')
        .setRight('8px')
        .setFontSize('11px')
        .setOptions({
          'Actions': 'Actions',
          'Delete': 'Delete',
          'Clear': 'Clear'
        })
        .onClick(function (event) {
          event.stopPropagation(); // Avoid panel collapsing
        })
        .onChange(function (event, component) {
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
          generateComponentsPanels(entity);
          updateUI(entity);
          editor.signals.objectChanged.dispatch(entity.object3D);
        });

      // Collapsible panel with component name as title
      var container = new UI.CollapsiblePanel();
      container.addStatic(new UI.Text(componentName).setTextTransform('uppercase'), objectActions);
      container.add(new UI.Break());

      // Add a widget's row for each parameter on the component
      for (var parameterName in component.schema) {
        container.add(addParameterRow(componentName, component, parameterName, component.schema[parameterName]));
      }

      container.add(new UI.Break());
      objectCustomRow.add(container);
    }
  }

  /**
   * Callback when a widget value is updated so we could update the entity attributes
   * @param  {EventTarget} event         Event generated by the onChange listener
   * @param  {string} componentName Component name being modified (eg: 'geometry')
   * @param  {string} attributeName Attribute name being modified (eg: 'primitive')
   * @param  {string} property      Property name, if any, being modified (eg: 'x')
   */
  function updateEntityValue (event, componentName, attributeName, property) {
    ignoreComponentsChange = true;
    var entity = editor.selected.el;

    var id = attributeName ? componentName + '.' + attributeName + '.' + property : property ? (componentName + '.' + property) : componentName;
    var widget = widgets[id];

    handleEntityChange(entity, componentName, property, widget.getValue());

    updateWidgetVisibility(entity);

    editor.signals.objectChanged.dispatch(entity.object3D);
    ignoreComponentsChange = false;
  }

  // Generate main attributes panel
  var container = new UI.Panel();
  container.setBorderTop('0');
  container.setPaddingTop('20px');
  container.setDisplay('none');

  // Add common attributes panel (type, id, position, rotation, scale, visible)
  container.add(generateCommonAttributes());

  // Append the components list that the user can add to the selected entity
  container.add(generateAddComponentRow());

  // Empty row used to append the panels from each component
  objectCustomRow = new UI.Row();
  container.add(objectCustomRow);

  // Signal dispatchers
  editor.signals.entitySelected.add(function (entity) {
    if (entity) {
      container.show();
      generateComponentsPanels(entity);
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

  return container;
}

module.exports = Attributes;
