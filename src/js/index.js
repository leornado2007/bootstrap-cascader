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

  $('#cascader1').bsCascader({
    openOnHover: true,
    loadData: function (openedItems, callback) {
      callback(localData);
    }
  });

  $('#cascader2').bsCascader({
    value: [{c: 'qian', n: '钱'}, {c: 'ji', n: '己'}, {c: 'h', n: 'H'}],
    loadData: function (openedItems, callback) {
      callback(localData);
    }
  }).on('bs.cascader.change', function (e, oldValue, newValue) {
    $('#cascaderValue2').text(JSON.stringify(newValue));
  });

  var NUMS = '零一二三四五六七八九'.split('');
  var mockLazyLoadFn = function () {
    return function (openedItems, callback) {
      setTimeout(function () {
        var level = openedItems.length + 1, data = [];
        if (level > 4) return callback(data);

        var parentCode = '', parentName = '';
        if (openedItems.length > 0) {
          parentCode = openedItems[openedItems.length - 1].c;
          parentName = openedItems[openedItems.length - 1].n;
        }

        $.each(NUMS, function (i, num) {
          var item = {c: parentCode + i, n: parentName + num};
          if (level == 4) item.hasChild = false;
          data.push(item);
        });
        callback(data);
      }, 500);
    }
  };

  $('#cascader3').bsCascader({
    splitChar: ' / ',
    openOnHover: true,
    lazy: true,
    loadData: mockLazyLoadFn()
  });

  $('#cascader4').bsCascader({
    splitChar: ' / ',
    lazy: true,
    dropUp: true,
    value: [{"code": "8", "name": "八"}, {"code": "81", "name": "八一"},
      {"code": "818", "name": "八一八"}, {"code": "8187", "name": "八一八七"}],
    loadData: mockLazyLoadFn()
  }).on({
    'bs.cascader.change bs.cascader.select': function (e, oldValue, newValue) {
      $('#cascaderValue4').text(JSON.stringify(newValue));
    },
    'bs.cascader.inited bs.cascader.reloaded': function () {
      $('#cascader4Reload').removeClass('disabled');
    }
  });

  $('#cascader4Reload').addClass('disabled').click(function () {
    $(this).addClass('disabled');
    $('#cascader4').bsCascader('reload');
  });

});