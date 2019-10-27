cordova.define("cordova-plugin-mock-location-checker.MockLocationChecker", function(require, exports, module) { var mocklocation = {
  check: function (successCallback, errorCallback) {
    cordova.exec(successCallback, errorCallback, 'MockLocationChecker', 'check', []);
  }
}

cordova.addConstructor(function () {
  if (!window.plugins) {window.plugins = {};}

  window.plugins.mocklocationchecker = mocklocation;
  return window.plugins.mocklocationchecker;
});

});
