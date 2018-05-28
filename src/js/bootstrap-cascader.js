(function ($) {
  'use strict';

  // DEF_OPTS
  var DEF_OPTS = {
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
      return item && item.loaded && (!item.children || item.children.length <= 0 || item.selectable);
    }
  };

  // TPLS
  var TPLS = {
    containerTpl: '<div class="btn-group bootstrap-cascader form-control"></div>',
    btnTpl: '<button class="btn dropdown-toggle bs-placeholder" type="button">\
        <span class="filter-option pull-left"></span> <span class="caret icon-arrow-down"></span> <span class="icon-cross bsfont icon-jiaochacross78"></span>\
      </button>',
    dropdownTpl: '<ul class="dropdown-menu"></ul>',
    dropdownItemTpl: '<li>\
        <a href="javascript:">\
          <span class="text"></span>\
          <span class="bsfont icon-ico-right-arrow item-right-arrow"></span>\
          <span class="bsfont icon-loading item-loading"></span>\
          <span class="bsfont icon-error"></span>\
        </a>\
      </li>'
  };

  var enHtml = function (value) {
    return !value ? '' : String(value).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  };

  // DropdownPanel
  var DropdownPanel = function (data, csd) {
    if (!data || !data.children || data.children.length <= 0) return;

    var panel = this;
    this.selectItem = function (item, itemEl) {
      var selectable = csd.params.isSelectable.call(csd, item);
      if (selectable) csd.selectItem(itemEl);
    };

    this.setItemOpened = function (item, itemEl) {
      panel.panelEl.children('li').removeClass('open');
      itemEl.addClass('open');
      if (item.loaded && item.children.length == 0) itemEl.addClass('no-child');
    };

    this.selectItemByCode = function (code) {
      panel.panelEl.children('li[code=' + enHtml(code) + ']').trigger('selectItem');
    };

    this.setSelected = function (item, setOpen) {
      var itemEl = panel.panelEl.children('li[code=' + enHtml(item.code || item.c) + ']');
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
      var panelEl = panel.panelEl, selectedItem = panelEl.find('li a.selected').parent();
      if (selectedItem.size() > 0) {
        var scrollTop = panelEl.scrollTop(), top = selectedItem.position().top + scrollTop;
        if (scrollTop < top) {
          top = top - (panelEl.height() - selectedItem.height()) / 2;
          panelEl.scrollTop(top);
        }
      }
    };

    this.destroy = function () {
      panel.panelEl.remove();
    };

    var handler = function (item, itemEl, selectItem) {
      if (csd.params.lazy && item.loaded === false) {
        itemEl.addClass('bs-loading');
        var itemCode = item.code || item.c;

        if (panel.loadingItem) panel.loadingItem = false;
        panel.loadingItem = itemCode;

        csd.loadData(item).then(function () {
          if (panel.loadingItem == itemCode)
            csd.refreshPanels(item.level + 1, item);
        }, function () {
          if (panel.loadingItem == itemCode)
            itemEl.addClass('load-error');
        }).always(function () {
          if (panel.loadingItem == itemCode) {
            panel.setItemOpened(item, itemEl);
            panel.loadingItem = false;
          }
          itemEl.removeClass('bs-loading');
        });
      } else {
        csd.refreshPanels(item.level + 1, item);
        panel.setItemOpened(item, itemEl);
        if (selectItem) panel.selectItem(item, itemEl);
      }
    };

    panel.panelEl = $(TPLS.dropdownTpl).appendTo(csd.el), panel.data = data;

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

      itemEl.on({
        'selectItem click': function () {
          handler(item, itemEl, true);
        },
        'openDropdown': function () {
          handler(item, itemEl);
        }
      });

      if (csd.params.openOnHover) {
        itemEl.on('mouseover', function () {
          if (csd.openTimeout) clearTimeout(csd.openTimeout);
          csd.openTimeout = setTimeout(function () {
            handler(item, itemEl);
          }, csd.params.lazy ? csd.params.openOnHoverDelay4Lazy : csd.params.openOnHoverDelay);
        });
      }

      if (item.loaded && (!item.children || item.children.length <= 0)) itemEl.addClass('no-child');

      // update selected items view state
      if (csd.selectedItems.length >= item.level && isParentAllMatched) {
        if (panel.isMatchedSelectedItems(item, false)) {
          hasMatchedChildren = true;
          if (csd.selectedItems.length > item.level) {
            handler(item, itemEl, false);
          } else {
            if (csd.selectedItems.length == csd.panels.length)
              $.each(csd.selectedItems, function (j, selectedItem) {
                csd.panels[j].setSelected(selectedItem, j < csd.selectedItems.length - 1);
              });
            csd.inited(), csd.reloaded();
          }
        }
      }
    });

    if ((!csd.isInited || csd.reloading) && csd.selectedItems.length > data.level && !hasMatchedChildren && csd.params.lazy)
      csd.isInited ? csd.reloaded() : csd.inited();
  };

  // Cascader
  var Cascader = function (params) {
    var csd = this;
    params = params || {};
    for (var def in DEF_OPTS) if (typeof params[def] === 'undefined') params[def] = DEF_OPTS[def];
    csd.params = params, csd.initialized = false, csd.selectedItems = [], csd.readonly = false;
    if (csd.params.value instanceof Array) csd.selectedItems = [];

    // initBtn
    var initBtn = function () {
      csd.btn = $(TPLS.btnTpl).addClass(params.btnCls).click(function () {
        csd.open();
      }).appendTo(csd.el);
      csd.btn.children('.icon-cross').click(function (e) {
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
        var itemCode = item.code || item.c, children = item.data || item.d;
        var itemData = {
          childMap: {}, children: [], loaded: !isLazy || item.hasChild === false,
          level: parent.level + 1, parent: parent, originData: item
        };
        parent.children.push(itemData);
        parent.childMap[itemCode] = itemData;
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
    csd.setValue = function (value) {
      csd.clearValue();

      var names = [], oldSelectedItems = csd.getValue;
      $.each(value, function (i, item) {
        csd.selectedItems.push({code: item.code || item.c, name: item.name || item.n});
        names.push(item.name || item.n);
      });
      updateBtnText(names.join(csd.params.splitChar));
      csd.updateViewBySelected();

      csd.tryFireOnChange(oldSelectedItems, csd.getValue());
    };

    // refreshPanels
    csd.refreshPanels = function (panelNo, data) {
      var rmPanels = csd.panels.splice(panelNo - 1, csd.panels.length);
      if (rmPanels) $.each(rmPanels, function (i, rmPanel) {
        rmPanel.destroy();
      });

      new DropdownPanel(data, csd);
    };

    // destroy
    csd.destroy = function () {
      $.each(csd.panels, function (i, panel) {
        panel.destroy();
      });
      $('html').off('click', htmlClickHandler);
    };

    // selectItem
    csd.selectItem = function (itemEl) {
      csd.el.find('li a').removeClass('selected');
      itemEl.children('a').addClass('selected');
      csd.el.find('li.open a').addClass('selected');

      var item = itemEl.data('cascaderItem'), names = [], oldSelectedItems = csd.getValue();
      csd.selectedItems = [];
      while (item.parent) {
        var itemData = item.originData, code = itemData.code || itemData.c, name = itemData.name || itemData.n;
        csd.selectedItems.unshift({code: code, name: name});
        names.unshift(name);
        item = item.parent;
      }

      updateBtnText(names.join(csd.params.splitChar));
      csd.close();

      var newItems = csd.getValue();
      csd.tryFireOnChange(oldSelectedItems, newItems);
      csd.params.el.trigger('bs.cascader.select', [newItems]);
    };

    // tryFireOnChange
    csd.tryFireOnChange = function (oldItems, newItems) {
      var fire = true;
      if (oldItems != newItems && oldItems.length == newItems.length) {
        var allCodesSame = true;
        $.each(oldItems, function (i, oldItem) {
          var oldItemCode = oldItem.code || oldItem.c, newItem = newItems[i], newItemCode = newItem.code || newItem.c;
          if (oldItemCode != newItemCode) {
            allCodesSame = false;
            return false;
          }
        });
        if (allCodesSame) fire = false;
      }
      if (fire) csd.params.el.trigger('bs.cascader.change', [oldItems, newItems]);
    };

    // close
    csd.close = function () {
      csd.el.removeClass('open');
      csd.updateViewBySelected();
    };

    // update view by selected
    csd.updateViewBySelected = function () {
      if (csd.selectedItems.length > 0)
        csd.panels[0].selectItemByCode(csd.selectedItems[0].code || csd.selectedItems[0].c);
    };

    // open
    csd.open = function () {
      if (csd.readonly) return;
      csd.el.toggleClass('open');

      $.each(csd.panels, function (i, panel) {
        panel.scrollToOpened();
      });
    };

    // getValue
    csd.getValue = function () {
      return csd.selectedItems.slice();
    };

    // clearValue
    csd.clearValue = function (fire) {
      if (csd.readonly) return;

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

    // inited
    csd.inited = function () {
      if (csd.isInited) return;

      csd.isInited = true;
      csd.params.el.trigger('bs.cascader.inited');
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

    csd.loadData().always(function () {
      csd.refreshPanels(1, csd.data);
      if (csd.params.value) csd.setValue(csd.params.value);
      if (!csd.params.lazy || !csd.params.value) csd.inited();
    });

    $('html').on('click', htmlClickHandler);
  };

  $.fn.bsCascader = function (params) {
    var args = arguments;
    return this.each(function () {
      if (!this) return;
      var $this = $(this);

      var bsCascader = $this.data("bsCascader");
      if (!bsCascader) {
        params = $.extend({
          el: $this, value: $this.val() ? $this.val().split(params.splitChar || ' ') : ''
        }, params);
        bsCascader = new Cascader(params);
        $this.data("bsCascader", bsCascader);
      }
      if (typeof params === typeof "a")
        bsCascader[params].apply(bsCascader, Array.prototype.slice.call(args, 1));
    });
  }

})(jQuery);
