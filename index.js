'use strict';

module.exports = {
  config: {
    getOSXMulti: function (withoutChrome, withoutSafari, withoutFirefox) {
      var config = [];
      var chrome = {
        'browserName': 'chrome',
        chromeOptions: {
          args: ['--no-sandbox', '--test-type=browser'],
          prefs: {
            download: {
              'prompt_for_download': false,
              'default_directory': '/tmp/'
            }
          }
        }
      };
      var safari = {'browserName': 'safari'};
      var firefox = {'browserName': 'firefox'};
      if (!withoutChrome) {
        config.push(chrome);
      }
      if (!withoutSafari) {
        config.push(safari);
      }
      if (!withoutFirefox) {
        config.push(firefox);
      }
      return config;
    }
  },
  helper: {
    protractor: {
      getBrowserName: function () {
        var deferred = protractor.promise.defer();
        browser.getCapabilities().then(function (cap) {
          var browserName = cap.caps_.browserName.toLowerCase();
          deferred.fulfill(browserName);
        }, deferred.reject);
        return deferred.promise;
      },
      addLocatorLink: function addLocatorLink() {
        by.addLocator('link',
          /**
           * Find <a> element by href attribute
           * @param {string} href
           * @param {Node} [parentElement=]
           * @returns {Array.<Node>}
           */
          function (href, parentElement) {
            parentElement = parentElement || document;
            var links = parentElement.querySelectorAll('a');
            return Array.prototype.filter.call(links, function (link) {
              return (link.href && ((link.href.indexOf(href) > -1) || (link.href === href) || (link.href === (link.baseURI + href))));
            });
          });
      },
      addLocatorAttr: function addLocatorAttr() {
        by.addLocator('attr',
          /**
           * Find element(s), where attribute contains given value
           * @param {string} attr
           * @param {string} value
           * @param {Element} [parentElement=]
           * @returns {Array.<Element>}
           */
          function (attr, value, parentElement) {
            parentElement = parentElement || document;
            var nodes = parentElement.querySelectorAll('[' + attr + ']');
            return Array.prototype.filter.call(nodes, function (node) {
              return (node.getAttribute(attr).indexOf(value) > -1);
            });
          });
      },
      cleanStorage: function cleanStorage() {
        browser.get('/#/');
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
      },
      getRndInt: function getRndInt() {
        return Math.ceil(Math.random()*999999);
      },
      scrollTo: function scrollTo() {
        arguments[0].scrollIntoView();
      },
      scrollToElement: function scrollToElement(element) {
        return browser.executeScript(this.scrollTo, element.getWebElement());
      },
      clickOption: /**
       * Click option[index] of select element
       * @param select
       * @param index
       * @returns {protractor.promise}
       */
        function clickOption(select, index) {
        var deferred = protractor.promise.defer();
        select.click().then(function () {
          var options = select.all(by.css('option'));
          expect(options.count()).toBeGreaterThan(index);
          expect(options.get(index).getText()).toBeDefined();
          options.get(index).click().then(function () {
            select.click();
            browser.waitForAngular().then(deferred.fulfill, deferred.reject);
          }, deferred.reject);
        }, deferred.reject);
        return deferred.promise;
      },
      expectConsoleLogEmpty: function expectConsoleLogEmpty() {
        browser.helper.getBrowserName().then(function (browserName) {
          if (browserName.indexOf('firefox') < 0) {
            browser.manage().logs().get('browser').then(function (browserLog) {
              expect(browserLog.length).toEqual(0);
              if (browserLog.length) {
                console.log('log: ', browserLog);
              }
            });
          }
        });
      },
      filterDisplayed: function filterDisplayed(element) {
        return element.isDisplayed();
      },
      filterEnabled: function filterEnabled(element) {
        return element.isEnabled();
      },
      filterAccessible: function filterAccessible(element) {
        return element.isDisplayed() && element.isEnabled();
      },
      expectIsAccessible: function expectIsAccessible(element) {
        expect(element.isDisplayed()).toBe(true);
        expect(element.isEnabled()).toBe(true);
      },
      expectFnDownloadFile: function expectFnDownloadFile(fn, name, waitTime) {
        if (!name || !fn) {
          throw 'both attributes are required';
        }
        var browserName = '';
        browser.getCapabilities().then(function (cap) {
          browserName = cap.caps_.browserName.toLowerCase();
        });
        if (browserName.indexOf('chrome') < 0) {
          return true;
        }
        var folder, chromeOptions;
        if (exports.config.capabilities) {
          if (exports.config.capabilities.chromeOptions) {
            chromeOptions = exports.config.capabilities.chromeOptions;
          }
        }
        else {
          if (exports.config.multiCapabilities) {
            exports.config.multiCapabilities.forEach(function (c) {
              if (c.browserName === browserName) {
                chromeOptions = c.chromeOptions;
              }
            });
          }
        }
        if (chromeOptions && chromeOptions.prefs && chromeOptions.prefs.download && chromeOptions.prefs.download.default_directory) {
          folder = chromeOptions.prefs.download.default_directory;
        }
        if (!folder) {
          throw 'Please add path to temporary folder to browser config, like this: \n' +
          '//////////// example code start ///////////\n' +
          'browserName: \'chrome\',\n' +
          '  chromeOptions: {\n' +
          '    args: [\'--no-sandbox\', \'--test-type=browser\'],\n' +
          '    prefs: { \n' +
          '      download: { \n' +
          '        \'prompt_for_download\': false, \n' +
          '        \'default_directory\': \'/tmp/\' \n' +
          '      }\n' +
          '    }\n' +
          '  }\n//////////// example code end ///////////';
        }

        var filename = folder + name;
        var fs = require('fs');

        if (fs.existsSync(filename)) {
          fs.unlinkSync(filename);
        }

        fn();

        browser.driver.wait(function () {
          return fs.existsSync(filename);
        }, waitTime || 30000).then(function () {
          expect(fs.existsSync(filename)).toBe(true);
        });
      }
    },
    initProtractorHelper: function (helper) {
      helper.addLocatorLink();
      helper.addLocatorAttr();
    },
    setScreenSize: function (width, height, posX, posY) {
      width = width || 1300;
      height = height || 800;
      posX = posX || 0;
      posY = posY || 0;
      browser.driver.manage().window().setSize(width, height);
      browser.driver.manage().window().setPosition(posX, posY);
    }
  }
};