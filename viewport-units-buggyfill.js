/*!
 * viewport-units-buggyfill-ie9 v0.0.1
 * IE9 only buggyfill for viewport units.
 * Based on the excellent work on Rodney Rehm's viewport-units-buggyfill:
 * https://github.com/rodneyrehm/viewport-units-buggyfill/
 */
(function(root, factory) {
  if (typeof exports === "object") {
      module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
      define([], factory);
  } else {
      root.ViewportUnitsBuggyfillIE9 = factory(root.Spinner);
  }
}(this, function () {
  'use strict';
  var initialized = false;
  var viewportUnitExpression = /([+-]?[0-9.]+)(vh|vw|vmin|vmax)/g;
  var forEach = [].forEach;
  var styleNode;
  var isInternetExplorer9 = navigator.appVersion.indexOf("MSIE 9.") != -1;

  /*
   * Helper functions
   */
  function isViewportUnitExpression(value) {
    viewportUnitExpression.lastIndex = 0;
    return viewportUnitExpression.test(value);
  }

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      var callback = function() {
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(callback, wait);
    };
  }

  function getViewport() {
    var vh = window.innerHeight;
    var vw = window.innerWidth;

    return {
      vh: vh,
      vw: vw,
      vmax: Math.max(vw, vh),
      vmin: Math.min(vw, vh)
    };
  }

  function insertStyleNode() {
    var node = document.createElement('style');
    node.id = 'patched-viewport';
    document.head.appendChild(node)
    return node;
  }

  function updateStyleNode(content) {
    styleNode.textContent = content;
    // move to the end in case inline <style>s were added dynamically
    styleNode.parentNode.appendChild(styleNode);
  }

  /*
   * Public
   */
  function initialize(options) {
    if (initialized) {
      return;
    }
    options = options || {};
    if (!options.force && !isInternetExplorer9) {
      // this buggyfill only applies to old Internet Explorer
      return;
    }
    initialized = true;
    styleNode = insertStyleNode();
    window.addEventListener('resize', debounce(refresh, options.refreshDebounceWait || 100), true);
    refresh();
  }

  function refresh() {
    if (!initialized) {
      return;
    }
    updateStyleNode(
      getReplacedViewportUnits(
        findDeclarations()));
  }

  /*
   * Find declarations
   */
  function findDeclarations() {
    var declarations = [];
    forEach.call(document.styleSheets, function(sheet) {
      if (sheet.ownerNode.id === 'patched-viewport' || !sheet.cssRules) {
        // skip entire sheet because no rules are present, it's supposed to be ignored or it's the target-element of the buggyfill
        return;
      }
      if (sheet.media && sheet.media.mediaText && window.matchMedia && !window.matchMedia(sheet.media.mediaText).matches) {
        // skip entire sheet because media attribute doesn't match
        return;
      }
      forEach.call(sheet.cssRules, function(rule) {
        findDeclarationsInRule(declarations, rule);
      });
    });
    return declarations;
  }

  function findDeclarationsInRule(declarations, rule) {
    if (!rule) {
      return;
    }
    if (!rule.style) {
      if (!rule.cssRules) {
        return;
      }
      forEach.call(rule.cssRules, function(_rule) {
        findDeclarationsInRule(_rule);
      });
      return;
    }
    forEach.call(rule.style, function(name) {
      var value = rule.style.getPropertyValue(name);
      if (isViewportUnitExpression(value)) {
        declarations.push([rule, name, value]);
      }
    });
  }

  /*
   * Replace CSS
   */
  function getReplacedViewportUnits(declarations) {
    var dimensions = getViewport();
    var css = [];
    var buffer = [];
    var open;
    var close;
    var overwriteDeclaration = _overwriteDeclaration(dimensions);
    declarations.forEach(function(item) {
      var _item = overwriteDeclaration.apply(null, item);
      var _open = _item.selector.length ? (_item.selector.join(' {\n') + ' {\n') : '';
      var _close = new Array(_item.selector.length + 1).join('\n}');
      if (!_open || _open !== open) {
        if (buffer.length) {
          css.push(open + buffer.join('\n') + close);
          buffer.length = 0;
        }
        if (_open) {
          open = _open;
          close = _close;
          buffer.push(_item.content);
        } else {
          css.push(_item.content);
          open = null;
          close = null;
        }
        return;
      }
      if (_open && !open) {
        open = _open;
        close = _close;
      }
      buffer.push(_item.content);
    });
    if (buffer.length) {
      css.push(open + buffer.join('\n') + close);
    }
    return css.join('\n\n');
  }

  function _overwriteDeclaration(dimensions) {
    var replaceValues = _replaceValues(dimensions);
    return function(rule, name, value) {
      var _value;
      var _selectors = [];

      _value = value.replace(viewportUnitExpression, replaceValues);

      if (name) {
        // skipping KeyframesRule
        _selectors.push(rule.selectorText);
        _value = name + ': ' + _value + ';';
      }

      var _rule = rule.parentRule;
      while (_rule) {
        _selectors.unshift('@media ' + _rule.media.mediaText);
        _rule = _rule.parentRule;
      }

      return {
        selector: _selectors,
        content: _value
      };
    }
  }

  function _replaceValues(dimensions) {
    return function(match, number, unit) {
      var _base = dimensions[unit];
      var _number = parseFloat(number) / 100;
      return (_number * _base) + 'px';
    }
  }

  return {
    version: '0.0.1',
    init: initialize,
    refresh: refresh
  };
}));
