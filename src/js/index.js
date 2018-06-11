$(function () {

  var localData = [
    {c: 'zhao', n: '赵', d: [{c: 'jia', n: '甲'}, {c: 'yi', n: '已'}, {c: 'bing', n: '丙'}]},
    {
      c: 'qian', n: '钱',
      d: [{c: 'ding', n: '丁', d: [{c: 'a', n: 'A'}, {c: 'b', n: 'B'}, {c: 'c', n: 'C'}]},
        {c: 'wu', n: '戊', d: [{c: 'd', n: 'D'}, {c: 'e', n: 'E'}, {c: 'f', n: 'F'}]},
        {c: 'ji', n: '己', d: [{c: 'g', n: 'G'}, {c: 'h', n: 'H'}, {c: 'i', n: 'I'}]},
        {c: 'bing', n: '丙'}]
    }, {
      c: 'sun', n: '孙',
      d: [{c: 'geng', n: '庚', d: [{c: 'j', n: 'J'}, {c: 'k', n: 'K'}, {c: 'l', n: 'L'}]},
        {c: 'xin', n: '辛', d: [{c: 'm', n: 'M'}, {c: 'n', n: 'N'}, {c: 'o', n: 'O'}]},
        {c: 'ren', n: '壬', d: [{c: 'p', n: 'P'}, {c: 'q', n: 'Q'}, {c: 'r', n: 'R'}]}]
    }, {
      c: 'li', n: '李',
      d: [{c: 'gui', n: '癸', d: [{c: 's', n: 'S'}, {c: 't', n: 'T'}]}, {c: 'zi', n: '子', d: [{c: 'u', n: 'U'}]},
        {c: 'chou', n: '丑', d: [{c: 'v', n: 'V'}, {c: 'w', n: 'W'}, {c: 'x', n: 'X'}]}]
    }];

  var onchange = function (valueId) {
    return function (e, oldValue, newValue) {
      console.log('=====onchange======', valueId, newValue);
      $('#' + valueId).text(JSON.stringify(newValue));
    };
  };

  var oninit = function (csdId, valueId) {
    return function () {
      console.log('=====oninit======', csdId);
      var value = $('#' + csdId).data('bsCascader').getValue();
      $('#' + valueId).text(JSON.stringify(value));
    };
  };

  var onselect = onclear = onreload = function (eventType, bsId) {
    return function () {
      console.log('====' + eventType + '====', bsId)
    }
  };

  var getListeners = function (csdId, valueId) {
    return {
      'bs.cascader.change': onchange(valueId), 'bs.cascader.inited': oninit(csdId, valueId),
      'bs.cascader.select': onselect('onselect', csdId), 'bs.cascader.reloaded': onreload('onreload', csdId),
      'bs.cascader.clear': onclear('onclear', csdId)
    }
  };

  // cascader1
  $('#cascader1').on($.extend(getListeners('cascader1', 'value1'), {})).bsCascader({
    openOnHover: true,
    loadData: function (openedItems, callback) {
      callback(localData);
    }
  });
  $('#cascader1Btn').click(function () {
    $('#cascader1').bsCascader('setValue', [{"code": "a", "name": "1"}, {"code": "b", "name": "2"},
      {"code": "c", "name": "3"}]);
  });

  // cascader1_2
  $('#cascader1_2').on($.extend(getListeners('cascader1_2', 'value1_2'), {})).bsCascader({
    openOnHover: true, forceSelect: true,
    loadData: function (openedItems, callback) {
      callback(localData);
    }
  });
  $('#cascader1_2Btn').click(function () {
    $('#cascader1_2').bsCascader('setValue', [{"code": "a", "name": "1"}, {"code": "b", "name": "2"},
      {"code": "c", "name": "3"}]);
  });
  $('#cascader1_2Btn2').click(function () {
    $('#cascader1_2').bsCascader('setValue', [{c: 'qian', n: '钱'}, {c: 'ji', n: '己'}, {c: 'h', n: 'H'}]);
  });

  // cascader2
  $('#cascader2').on($.extend(getListeners('cascader2', 'value2'), {})).bsCascader({
    value: [{c: 'qian', n: '钱'}, {c: 'ji', n: '己'}, {c: 'h', n: 'H'}],
    loadData: function (openedItems, callback) {
      callback(localData);
    }
  });

  var NUMS = '零一二三四五六七八九'.split('');
  var createMockData = function (openedItems, justLastLevelSelectable) {
    var level = openedItems.length + 1, data = [];
    if (level > 4) return data;

    var parentCode = '', parentName = '';
    if (openedItems.length > 0) {
      var parentItem = openedItems[openedItems.length - 1];
      parentCode = parentItem.c || parentItem.code;
      parentName = parentItem.n || parentItem.name;
    }

    $.each(NUMS, function (i, num) {
      var item = {c: parentCode + i, n: parentName + num};
      if (level == 4) item.hasChild = false;
      data.push(item);
      item.selectable = !justLastLevelSelectable || level == 4;
    });
    return data;
  };
  var mockLazyLoadFn = function (csdId, justLastLevelSelectable) {
    return function (openedItems, callback) {
      console.log('------mockLazyLoadFn------', csdId);
      setTimeout(function () {
        callback(createMockData(openedItems, justLastLevelSelectable));
      }, 500);
    }
  };

  // cascader3
  $('#cascader3').on($.extend(getListeners('cascader3', 'value3'), {})).bsCascader({
    splitChar: ' / ',
    openOnHover: true,
    lazy: true,
    loadData: mockLazyLoadFn('cascader3')
  });

  // cascader4
  $('#cascader4')
      .on($.extend(getListeners('cascader4', 'value4'), {}))
      .on('bs.cascader.inited bs.cascader.reloaded', function () {
        $('#cascader4Btn').removeClass('disabled');
      })
      .bsCascader({
        splitChar: ' / ',
        lazy: true,
        dropUp: true,
        value: [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
          {"code": "818", "name": "八一八"}, {"code": "8187", "name": "八一八七"}],
        loadData: mockLazyLoadFn('cascader4')
      });

  $('#cascader4Btn').addClass('disabled').click(function () {
    $(this).addClass('disabled');
    $('#cascader4').bsCascader('reload');
  });

  // cascader5
  $('#cascader5')
      .on($.extend(getListeners('cascader5', 'value5'), {}))
      .bsCascader({
        splitChar: ' / ',
        lazy: true,
        dropUp: true,
        loadData: mockLazyLoadFn('cascader5')
      });
  $('#cascader5Btn').click(function () {
    $('#cascader5').bsCascader('setValue', [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
      {"code": "81b", "name": "八一B"}, {"code": "81ba", "name": "八一BA"}]);
  });
  $('#cascader5Btn2').click(function () {
    $('#cascader5').bsCascader('setValue', [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
      {"code": "818", "name": "八一八"}, {"code": "8187", "name": "八一八七"}]);
  });

  // cascader6
  $('#cascader6')
      .on($.extend(getListeners('cascader6', 'value6'), {}))
      .bsCascader({
        value: [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
          {"code": "818", "name": "八一八"}, {"code": "8187", "name": "八一八七"}],
        forceSelect: true,
        splitChar: ' / ',
        lazy: true,
        dropUp: true,
        loadData: mockLazyLoadFn('cascader6')
      });
  $('#cascader6Btn').click(function () {
    $('#cascader6').bsCascader('setValue', [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
      {"code": "81b", "name": "八一B"}, {"code": "81ba", "name": "八一BA"}]);
  });
  $('#cascader6Btn2').click(function () {
    $('#cascader6').bsCascader('setValue', [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
      {"code": "818", "name": "八一八"}, {"code": "8187", "name": "八一八七"}]);
  });

  // cascader7
  $('#cascader7')
      .on($.extend(getListeners('cascader7', 'value7'), {}))
      .bsCascader({
        value: [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
          {"code": "818", "name": "八一八"}],
        forceSelect: true,
        splitChar: ' / ',
        lazy: true,
        dropUp: true,
        loadData: mockLazyLoadFn('cascader7', true),
        loadDataByTreePath: function (items, callback) {
          console.log('------loadDataByTreePath------ cascader7');
          setTimeout(function () {
            var data = [], checkedItems = [], lastMatchedItem, allMatched = true;
            for (var i = 0; i < items.length; i++) {
              var item = items[i], itemCode = item.code || item.c, matchedItem = false;
              var mockData = createMockData(checkedItems, true);
              $.each(mockData, function (j, mockItem) {
                var mockItemCode = mockItem.code || mockItem.c;
                if (mockItemCode == itemCode) {
                  matchedItem = mockItem;
                  return false;
                }
              });
              if (!matchedItem) {
                allMatched = false;
                break;
              }

              lastMatchedItem ? lastMatchedItem.data = mockData : data = mockData;
              lastMatchedItem = matchedItem;
              checkedItems.push(item);
            }
            callback(allMatched ? data : []);
          }, 500);
        }
      });
  $('#cascader7Btn').click(function () {
    $('#cascader7').bsCascader('setValue', [{"code": "8", "name": "八"}, {"code": "82", "name": "八二"},
      {"code": "82b", "name": "八二B"}, {"code": "82ba", "name": "八二BA"}]);
  });
  $('#cascader7Btn2').click(function () {
    $('#cascader7').bsCascader('setValue', [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
      {"code": "818", "name": "八一八"}, {"code": "8187", "name": "八一八七"}]);
  });

});