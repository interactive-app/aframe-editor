require('./index.css');

function Panel () {
  this.visible = false;

  this.panelEl = document.createElement('div');
  this.panelEl.classList.add('editor-scene');

  this.show();
}

Panel.prototype.show = function () {
  this.panelEl.style.display = 'block';
  this.visible = true;
  this.makeSceneGraph();
};

Panel.prototype.hide = function () {
  this.panelEl.style.display = 'none';
  this.visible = false;
};

Panel.prototype.makeEntity = function(entity, depth) {
  var div = document.createElement('div')
  div.className = 'editor-scene--entity';
  div.innerHTML = entity.id ? entity.id : 'a-entity';
  div.style.margin = '0 0 0 ' + depth + 'rem';
  this.panelEl.appendChild(div);
};

Panel.prototype.makeSceneGraph = function () {
  var self = this;

  function treeIterate(element, depth) {
    if (depth === undefined) {
      depth = 0;
    } else {
      depth += 1;
    }

    var children = element.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      self.makeEntity(child, depth);
      treeIterate(child, depth);
    }
  }

  var scene = document.querySelector('a-scene');
  treeIterate(scene);
};

module.exports = Panel;
