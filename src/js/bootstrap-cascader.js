(function ($) {
  'use strict';

  // CLS
  var CLS = {
    cascaderItem: 'bootstrap-cascader-item',
    cascaderPanel: 'bootstrap-cascader-panel',
  };

  // DEF_OPTS
  var DEF_OPTS = {
    forceSelect: false,
    splitChar: ' ',
    cls: '',
    btnCls: 'btn-default',
    placeHolder: '请选择',
    dropUp: false,
    lazy: false,
    openOnHover: false,
    openOnHoverDelay: 100,
    openOnHoverDelay4Lazy: 200,
    isSelectable: function (item) {
      return item && (
        item.selectable === true ||
        item.loaded && (
          !item.children ||
          item.children.length <= 0
        ) &&
        item.selectable !== false
      );
    }
  };

  // TPLS
  var TPLS = {
    containerTpl: '<div class="btn-group bootstrap-cascader form-control"></div>',
    btnTpl: '<button class="btn dropdown-toggle bs-placeholder" type="button">\
        <span class="filter-option pull-left"></span> <span class="caret icon-arrow-down"></span> <span class="icon-cross bscascader-font icon-jiaochacross78"></span>\
      </button>',
    dropdownTpl: '<ul class="dropdown-menu ' + CLS.cascaderPanel + '"></ul>',
    dropdownItemTpl: '<li class="' + CLS.cascaderItem + '">\
        <a href="javascript:">\
          <span class="text"></span>\
          <span class="bscascader-font icon-ico-right-arrow item-right-arrow"></span>\
          <span class="bscascader-font icon-loading item-loading"></span>\
          <span class="bscascader-font icon-error"></span>\
        </a>\
      </li>'
  };

  var enHtml = function (value) {
    return !value ? '' : String(value).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  };

  // DropdownPanel
  var DropdownPanel = function (data, csd, setValueCallback) {
    if (!data || !data.children || data.children.length <= 0) {
      if (setValueCallback) setValueCallback(data);
      return;
    }

    var panel = this;

    this.setItemOpened = function (item, itemEl) {
      panel.panelEl.children('li').removeClass('open');
      itemEl.addClass('open');
      if (item.loaded && item.children.length === 0) itemEl.addClass('no-child');
    };

    this.selectItemByCode = function (code, setValueCallback) {
      panel.panelEl.children('li[code="' + enHtml(code) + '"]').trigger('selectItem', [setValueCallback]);
    };

    this.setSelected = function (item, setOpen) {
      var itemEl = panel.panelEl.children('li[code="' + enHtml(item.code || item.c) + '"]');
      itemEl.children('a').addClass('selected');
      if (setOpen) panel.setItemOpened(item, itemEl);
      panel.scrollToOpened();
    };

    this.isMatchedSelectedItems = function (item, withParents) {
      var currItem = item;
      for (var j = item.level - 1; j >= 0; j--) {
        var selectedItem = csd.selectedItems[j], selectedItemCode = selectedItem.code || selectedItem.c;
        var currItemData = currItem.originData, currItemCode = currItemData.code || currItemData.c;
        if (selectedItemCode != currItemCode) return false;
        if (withParents === false) return true;
        currItem = currItem.parent;
      }
      return true;
    };

    this.scrollToOpened = function () {
      var panelEl = panel.panelEl, selectedItem = panelEl.find('li.open');
      if (selectedItem.size() <= 0) selectedItem = panelEl.find('li a.selected').parent();
      if (selectedItem.size() > 0) {
        var scrollTop = panelEl.scrollTop(), top = selectedItem.position().top + scrollTop;
        if (scrollTop < top) {
          top = top - (panelEl.height() - selectedItem.height()) / 2;
          panelEl.scrollTop(top);
        }
      }
    };

    this.destroy = function () {
      panel.panelEl.children('li').removeData('cascaderItem');
      panel.panelEl.remove();
    };

    this.rePosition = function (lastPanel) {
      if (!lastPanel) return;

      var lastPanelEl = lastPanel.panelEl, lastPanelLeft = Number((lastPanelEl.css('left') || '').replace('px', ''));
      panel.panelEl.css({left: lastPanelLeft + lastPanelEl.outerWidth()})
    };

    this.handler = function (item, itemEl, selectItem, setValueCallback) {
      if (csd.params.lazy && item.loaded === false) {
        itemEl.addClass('bs-loading');
        var itemCode = item.code || item.c;

        if (panel.loadingItem) panel.loadingItem = false;
        panel.loadingItem = itemCode;

        csd.loadData(item).then(function () {
          if (panel.loadingItem === itemCode)
            csd.refreshPanels(item.level + 1, item, setValueCallback);
        }, function () {
          if (panel.loadingItem === itemCode)
            itemEl.addClass('load-error');
        }).always(function () {
          if (panel.loadingItem === itemCode) {
            panel.setItemOpened(item, itemEl);
            panel.loadingItem = false;
          }
          itemEl.removeClass('bs-loading');
        });
      } else {
        csd.refreshPanels(item.level + 1, item, setValueCallback);
        panel.setItemOpened(item, itemEl);
        if (selectItem) csd.selectItem(item, itemEl);
      }
    };

    panel.panelEl = $(TPLS.dropdownTpl).appendTo(csd.el), panel.data = data;
    panel.panelEl.data('dropdownPanel', panel);

    // set panel position
    var lastPanel = csd.panels[csd.panels.length - 1];
    if (lastPanel) {
      var lastPanelEl = lastPanel.panelEl, lastPanelLeft = Number((lastPanelEl.css('left') || '').replace('px', ''));
      panel.panelEl.css({left: lastPanelLeft + lastPanelEl.outerWidth()})
    }
    csd.panels.push(panel);

    // update panel style
    if (csd.panels.length > 0) {
      csd.el.children('.dropdown-menu').removeClass('first-child last-child');
      csd.panels[0].panelEl.addClass('first-child');
      csd.panels[csd.panels.length - 1].panelEl.addClass('last-child');
    }

    var isParentAllMatched = false, hasMatchedChildren = false;
    if (csd.selectedItems.length > data.level) isParentAllMatched = panel.isMatchedSelectedItems(data);

    $.each(data.children, function (i, item) {
      var itemEl = $(TPLS.dropdownItemTpl).appendTo(panel.panelEl), itemData = item.originData;
      var itemName = itemData.name || itemData.n, itemCode = itemData.code || itemData.c;
      itemEl.data("cascaderItem", item).attr('code', itemCode).attr('title', itemName).find('.text').text(itemName);

      /*itemEl.on({
        'selectItem': function (e, setValueCallback) {
          console.log('---selectItem---', setValueCallback);
          panel.handler(item, itemEl, false, setValueCallback);
        },
        'click': function (e, setValueCallback) {
          console.log('---click---', setValueCallback);
          panel.handler(item, itemEl, true, setValueCallback);
        },
        'openDropdown': function () {
          console.log('---openDropdown---', setValueCallback);
          panel.handler(item, itemEl);
        }
      });

      if (csd.params.openOnHover) {
        itemEl.on('mouseover', function () {
          if (csd.openTimeout) clearTimeout(csd.openTimeout);
          csd.openTimeout = setTimeout(function () {
            panel.handler(item, itemEl);
          }, csd.params.lazy ? csd.params.openOnHoverDelay4Lazy : csd.params.openOnHoverDelay);
        });
      }*/

      if (item.loaded && (!item.children || item.children.length <= 0)) itemEl.addClass('no-child');

      // update selected items view state
      if (csd.selectedItems.length >= item.level && isParentAllMatched) {
        if (panel.isMatchedSelectedItems(item, false)) {
          hasMatchedChildren = true;
          if (csd.selectedItems.length > item.level) {
            panel.handler(item, itemEl, false, setValueCallback);
          } else {
            if (csd.selectedItems.length === csd.panels.length)
              $.each(csd.selectedItems, function (j, selectedItem) {
                csd.panels[j].setSelected(selectedItem, j < csd.selectedItems.length - 1);
              });
            if (setValueCallback) setValueCallback(item), setValueCallback.called = true;
            else {
              csd.fireOnInit(), csd.reloaded();
            }
          }
        }
      }
    });

    if (csd.selectedItems.length > data.level && !hasMatchedChildren && csd.params.lazy) {
      if ((!csd.isInitialized || csd.reloading))
        csd.isInitialized ? csd.reloaded() : csd.fireOnInit();
      if (setValueCallback) setValueCallback(), setValueCallback.called = true;
    }

    if (setValueCallback && !setValueCallback.called) setValueCallback(data);
  };

  // Cascader
  var Cascader = function (params, originEl) {
    var csd = this;
    params = params || {};
    for (var def in DEF_OPTS) if (typeof params[def] === 'undefined') params[def] = DEF_OPTS[def];
    csd.params = params, csd.initialized = false, csd.selectedItems = [], csd.readonly = false;
    if (csd.params.value instanceof Array) csd.selectedItems = [];

    // initBtn
    var initBtn = function () {
      csd.btn = $(TPLS.btnTpl).addClass(params.btnCls).on('click', function () {
        csd.open();
      }).appendTo(csd.el);
      csd.btn.children('.icon-cross').on('click', function (e) {
        if (csd.isReadonly()) return;
        csd.clearValue(true);
        e.preventDefault();
        e.stopPropagation();
      });
      updateBtnText(params.placeHolder);
    };

    // convertData2Col
    var convertData2Col = function (data, parent) {
      var isLazy = csd.params.lazy;
      $.each(data, function (i, item) {
        var itemCode = item.code || item.c, children = item.data || item.d, itemData = parent.childMap[itemCode];
        if (!itemData) {
          itemData = {
            childMap: {}, children: [], loaded: !isLazy || (children && children.length > 0) || item.hasChild === false,
            level: parent.level + 1, parent: parent, originData: item
          };
          parent.children.push(itemData);
          parent.childMap[itemCode] = itemData;
        } else itemData.loaded = !isLazy || (children && children.length > 0) || item.hasChild === false;
        if (item.selectable !== undefined) itemData.selectable = item.selectable;
        if (children && children.length > 0) convertData2Col(children, itemData);
      });
    };

    // updateBtnText
    var updateBtnText = function (text) {
      csd.btn.attr('title', text).children('.filter-option').text(text);
      if (csd.getValue().length > 0) csd.btn.removeClass('bs-placeholder').addClass('selected');
      else csd.btn.addClass('bs-placeholder').removeClass('selected');
    };

    // htmlClickHandler
    var htmlClickHandler = function (e) {
      if (!csd.el.hasClass('open')) return;
      var cascader = $(e.target).parents('.bootstrap-cascader');
      if (cascader.size() == 0) csd.close();
      else if (cascader[0] != csd.el[0]) csd.close();
    };

    // setValue
    csd.setValue = function (value, opts) {
      opts = $.extend({onSetFinish: $.noop}, opts || {});
      var names = [], oldSelectedItems = csd.getValue(), changeFired;
      csd.clearValue();
      if (!value || !(value instanceof Array) || value.length <= 0) {
        opts.fireInit ? csd.fireOnInit() : changeFired = csd.fireOnChange(oldSelectedItems, csd.getValue());
        opts.onSetFinish.call(csd, changeFired);
        return;
      }

      if (csd.params.forceSelect) {
        var updateViewByLayzData = function () {
          $.each(value, function (i, item) {
            csd.selectedItems.push({code: item.code || item.c, name: item.name || item.n});
            names.push(item.name || item.n);

            if (csd.panels[i]) csd.panels[i].setSelected(item, i < csd.selectedItems.length - 1);
          });
          csd.updateViewBySelected(function (item) {
            if (item && csd.params.isSelectable(item)) {
              updateBtnText(names.join(csd.params.splitChar));
            } else csd.clearValue(false);
            opts.fireInit ? csd.fireOnInit() : changeFired = csd.fireOnChange(oldSelectedItems, csd.getValue());
            opts.onSetFinish.call(csd, changeFired);
          });
        };
        if (csd.params.lazy && csd.params.loadDataByTreePath) {
          csd.loadDataByTreePath(value).then(function () {
            updateViewByLayzData();
          }, function () {
            opts.fireInit ? csd.fireOnInit() : changeFired = csd.fireOnChange(oldSelectedItems, csd.getValue());
            opts.onSetFinish.call(csd, changeFired);
          });
        } else updateViewByLayzData();
      } else {
        $.each(value, function (i, item) {
          csd.selectedItems.push({code: item.code || item.c, name: item.name || item.n});
          names.push(item.name || item.n);
        });
        updateBtnText(names.join(csd.params.splitChar));
        csd.updateViewBySelected();
        opts.fireInit ? csd.fireOnInit() : changeFired = csd.fireOnChange(oldSelectedItems, csd.getValue());
        opts.onSetFinish.call(csd, changeFired);
      }
    };

    // refreshPanels
    csd.refreshPanels = function (panelNo, data, setValueCallback) {
      var rmPanels = csd.panels.splice(panelNo - 1, csd.panels.length);
      if (rmPanels) $.each(rmPanels, function (i, rmPanel) {
        rmPanel.destroy();
      });

      new DropdownPanel(data, csd, setValueCallback);
    };

    // destroy
    csd.destroy = function () {
      $.each(csd.panels, function (i, panel) {
        panel.destroy();
      });
      $('html').off('click', htmlClickHandler);
      csd.params.el.removeData("bsCascader");
    };

    // selectItem
    csd.selectItem = function (item, itemEl) {
      if (!csd.params.isSelectable.call(csd, item)) return;

      csd.el.find('li a').removeClass('selected');
      itemEl.children('a').addClass('selected');
      csd.el.find('li.open a').addClass('selected');

      item = item || itemEl.data('cascaderItem');
      var names = [], oldSelectedItems = csd.getValue();
      csd.selectedItems = [];
      while (item.parent) {
        var itemData = item.originData, code = itemData.code || itemData.c, name = itemData.name || itemData.n;
        csd.selectedItems.unshift({code: code, name: name});
        names.unshift(name);
        item = item.parent;
      }

      updateBtnText(names.join(csd.params.splitChar));
      csd.close(false);

      var newItems = csd.getValue();
      csd.fireOnChange(oldSelectedItems, newItems);
      csd.params.el.trigger('bs.cascader.select', [newItems]);
    };

    // fireOnChange
    csd.fireOnChange = function (oldItems, newItems) {
      var fire = true;
      if (oldItems != newItems && oldItems.length == newItems.length) {
        var allItemsSame = true;
        $.each(oldItems, function (i, oldItem) {
          var oldItemCode = oldItem.code || oldItem.c, oldItemName = oldItem.name || oldItem.n;
          var newItem = newItems[i], newItemCode = newItem.code || newItem.c, newItemName = newItem.name || newItem.n;
          if (oldItemCode != newItemCode || oldItemName != newItemName) {
            allItemsSame = false;
            return false;
          }
        });
        if (allItemsSame) fire = false;
      }
      if (fire) csd.params.el.trigger('bs.cascader.change', [oldItems, newItems]);
      return fire;
    };

    // close
    csd.close = function (updateViewBySelected) {
      csd.el.removeClass('open');
      if (updateViewBySelected !== false) csd.updateViewBySelected();
    };

    // update view by selected
    csd.updateViewBySelected = function (setValueCallback) {
      if (csd.selectedItems.length > 0 && csd.panels.length > 0)
        csd.panels[0].selectItemByCode(csd.selectedItems[0].code || csd.selectedItems[0].c, setValueCallback);
    };

    // open
    csd.open = function () {
      if (csd.isReadonly()) return;
      csd.el.toggleClass('open');

      var lastPanel;
      $.each(csd.panels, function (i, panel) {
        panel.rePosition(lastPanel);
        panel.scrollToOpened();
        lastPanel = panel;
      });
    };

    // getValue
    csd.getValue = function () {
      return csd.selectedItems.slice();
    };

    // clearValue
    csd.clearValue = function (fire) {
      csd.selectedItems = [];
      csd.el.find('.dropdown-menu li a').removeClass('selected');
      updateBtnText(csd.params.placeHolder);

      if (fire) csd.params.el.trigger('bs.cascader.clear');
    };

    // setReadonly
    csd.setReadonly = function (readonly) {
      readonly = readonly !== false;
      csd.readonly = readonly;
      if (readonly) {
        csd.el.addClass('readonly');
        csd.btn.addClass('disabled');
      } else {
        csd.el.removeClass('readonly');
        csd.btn.removeClass('disabled');
      }
    };

    // isReadonly
    csd.isReadonly = function () {
      return csd.readonly;
    };

    // reload
    csd.reload = function () {
      csd.reloading = true, csd.data = {childMap: {}, children: [], loaded: false, level: 0};
      csd.loadData().then(function () {
        csd.refreshPanels(1, csd.data);
        if (csd.params.value) csd.setValue(csd.params.value);
        if (!csd.params.lazy || !csd.params.value) csd.reloaded();
      });
    };

    // reloaded
    csd.reloaded = function () {
      if (!csd.reloading) return;

      csd.reloading = false;
      csd.params.el.trigger('bs.cascader.reloaded');
    };

    // fireOnInit
    csd.fireOnInit = function () {
      if (csd.isInitialized) return;

      csd.isInitialized = true;
      csd.params.el.trigger('bs.cascader.inited');
    };

    // loadDataByTreePath
    csd.loadDataByTreePath = function (items) {
      var defered = $.Deferred();
      csd.params.loadDataByTreePath.call(csd, items, function (data) {
        if (data) {
          if (data.length > 0) {
            if (!csd.data.originData) csd.data.originData = data;
            convertData2Col(data, csd.data);
            csd.data.loaded = true;
            defered.resolve(data);
          } else defered.reject();
        } else defered.reject();
      });
      return defered.promise();
    };

    // loadData
    csd.loadData = function (item) {
      // get opened items
      var openedItems = [];
      if (item) {
        var currItem = item;
        while (currItem.parent) {
          openedItems.unshift(currItem.originData);
          currItem = currItem.parent;
        }
      } else item = csd.data;

      var defered = $.Deferred();
      csd.params.loadData.call(csd, openedItems, function (data) {
        if (data) {
          if (data.length > 0) {
            if (!openedItems || openedItems.length <= 0) csd.data.originData = data;
            convertData2Col(data, item);
          }
          item.loaded = true;
          defered.resolve(data);
        } else defered.reject();
      });
      return defered.promise();
    };

    csd.data = {childMap: {}, children: [], loaded: false, level: 0}, csd.panels = [];
    csd.cols = [], csd.el = $(TPLS.containerTpl).addClass(csd.params.cls);
    if (csd.params.dropUp) csd.el.addClass('dropup');
    if (csd.params.replace) {
      csd.el.insertAfter(params.el);
      params.el.hide();
    } else csd.el.appendTo(params.el);
    initBtn();
    if (csd.params.readonly) csd.setReadonly(true);

    originEl.data("bsCascader", this);
    csd.loadData().always(function () {
      csd.refreshPanels(1, csd.data);
      if (csd.params.value) csd.setValue(csd.params.value, {fireInit: true});
      else csd.fireOnInit();
    });

    // 在父元素一次性监听，提高性能
    $(csd.el).on('selectItem', '.' + CLS.cascaderItem, function (e, setValueCallback) {
      var itemEl = $(e.currentTarget), item = itemEl.data('cascaderItem');
      if (!itemEl || itemEl.length <= 0 || !item) return;

      var panelEl = itemEl.closest('.' + CLS.cascaderPanel), panel = panelEl.data('dropdownPanel');
      if (!panelEl || panelEl.length <= 0 || !panel) return;

      panel.handler(item, itemEl, false, setValueCallback);
    }).on('click', '.' + CLS.cascaderItem, function (e, setValueCallback) {
      var itemEl = $(e.currentTarget), item = itemEl.data('cascaderItem');
      if (!itemEl || itemEl.length <= 0 || !item) return;

      var panelEl = itemEl.closest('.' + CLS.cascaderPanel), panel = panelEl.data('dropdownPanel');
      if (!panelEl || panelEl.length <= 0 || !panel) return;

      panel.handler(item, itemEl, true, setValueCallback);
    }).on('openDropdown', '.' + CLS.cascaderItem, function (e) {
      var itemEl = $(e.currentTarget), item = itemEl.data('cascaderItem');
      if (!itemEl || itemEl.length <= 0 || !item) return;

      var panelEl = itemEl.closest('.' + CLS.cascaderPanel), panel = panelEl.data('dropdownPanel');
      if (!panelEl || panelEl.length <= 0 || !panel) return;

      panel.handler(item, itemEl);
    });

    if (csd.params.openOnHover) {
      $(csd.el).on('mouseover', '.' + CLS.cascaderItem, function (e) {
        var itemEl = $(e.currentTarget), item = itemEl.data('cascaderItem');
        if (!itemEl || itemEl.length <= 0 || !item) return;

        var panelEl = itemEl.closest('.' + CLS.cascaderPanel), panel = panelEl.data('dropdownPanel');
        if (!panelEl || panelEl.length <= 0 || !panel) return;

        if (csd.openTimeout) clearTimeout(csd.openTimeout);
        csd.openTimeout = setTimeout(function () {
          panel.handler(item, itemEl);
        }, csd.params.lazy ? csd.params.openOnHoverDelay4Lazy : csd.params.openOnHoverDelay);
      });
    }

    $('html').on('click', htmlClickHandler);
  };

  $.fn.bsCascader = function (params) {
    var args = arguments;
    return this.each(function () {
      if (!this) return;
      var $this = $(this);

      var bsCascader = $this.data("bsCascader");
      if (!bsCascader && params != 'destroy') {
        params = $.extend({
          el: $this, value: $this.val() ? $this.val().split(params.splitChar || ' ') : ''
        }, params);
        bsCascader = new Cascader(params, $this);
      }
      if (bsCascader && typeof params === typeof "")
        bsCascader[params].apply(bsCascader, Array.prototype.slice.call(args, 1));
    });
  }

})(jQuery);
