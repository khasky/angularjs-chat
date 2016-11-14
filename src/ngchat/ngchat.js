(function () {
    'use strict';
	angular.module('ngChatModule', ['ngSanitize'])
		.config(['$httpProvider', function ($httpProvider) {
			// Intercept POST requests, convert to standard form encoding
			$httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
			$httpProvider.defaults.dataType = "json";
			
			$httpProvider.defaults.transformRequest.unshift(function(data, headersGetter){
				var key, result = [];
				
				if (typeof data === "string")
					return data;

				for (key in data) {
					if (data.hasOwnProperty(key))
						result.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
				}
				return result.join("&");
			});
		}])
		.factory('utilityService', ['$http', '$q', function ($http, $q) {
			return {
				replaceAll: function (str, search, replace) {
					return str.split(search).join(replace);
				},
				takeFromRight: function (arr, count) {
					var end = [];
					for (var len = arr.length, j = len; j > 0; j--) {
						if (len - j === count)
							break;
						end.push(arr[j - 1]);
					}
					return end.reverse();
				},
				guid: function () {
					var nav = window.navigator;
					var screen = window.screen;
					var guid = nav.mimeTypes.length; // example: 7
					guid += nav.userAgent.replace(/\D+/g, ''); // example: 5061645373654028407153736
					guid += nav.plugins.length; // example: 5
					guid += screen.height || ''; // example: 1024
					guid += screen.width || ''; // example: 1280
					guid += screen.pixelDepth || ''; // example: 24

					return guid;
				},
				hashCode: function (str) {
					if (!str)
						return '';
					
					var hash = 0;
					
					for (var i = 0; i < str.length; i++) {
					   hash = str.charCodeAt(i) + ((hash << 5) - hash);
					}
					
					return hash;
				},
				intToHex: function (i) {
					var code = (i & 0x00FFFFFF).toString(16).toUpperCase();
					
					return "00000".substring(0, 6 - code.length) + code;
				},
				insertTextAt: function (id, text) {
					var txtarea = document.querySelector(id);
					
					if (!txtarea)
						return;
					
					var scrollPos = txtarea.scrollTop;
					var strPos = 0;
					
					var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? "ff" : (document.selection ? "ie" : false));
					
					if (br === "ie") {
						txtarea.focus();
						var range = document.selection.createRange();
						range.moveStart('character', -txtarea.value.length);
						strPos = range.text.length;
					}
					else if (br === "ff") {
						strPos = txtarea.selectionStart;
					}
					
					var front = (txtarea.value).substring(0, strPos);
					var back = (txtarea.value).substring(strPos, txtarea.value.length);
					
					txtarea.value = front + text + back;
					strPos = strPos + text.length;
					
					if (br === "ie") {
						txtarea.focus();
						var ieRange = document.selection.createRange();
						ieRange.moveStart('character', -txtarea.value.length);
						ieRange.moveStart('character', strPos);
						ieRange.moveEnd('character', 0);
						ieRange.select();
					}
					else if (br === "ff") {
						txtarea.selectionStart = strPos;
						txtarea.selectionEnd = strPos;
						txtarea.focus();
					}
					
					txtarea.scrollTop = scrollPos;
					
					angular.element(txtarea).triggerHandler('input'); // fire input value update
				}
			};
		}])
		.factory('ngChatService', ['$q', '$http', function ($q, $http){
			return {
				getHistory: function () {
					return $http.get('ngchat/server/read.php').then(function(resp){
						return resp.data ? resp.data : $q.reject(resp.data);
					}, function (resp){
						return $q.reject(resp.data);
					});
				},
				send: function (args) {
					return $http({
						method: 'POST',
						url: 'ngchat/server/send.php',
						data: args
					}).then(function(resp){
						return resp.data ? resp.data : $q.reject(resp.data);
					}, function (resp){
						return $q.reject(resp.data);
					});
				},
				status: function (args) {
					return $http({
						method: 'POST',
						url: 'ngchat/server/status.php',
						data: args
					}).then(function(resp){
						return resp.data ? resp.data : $q.reject(resp.data);
					}, function (resp){
						return $q.reject(resp.data);
					});
				}
			};
		}])
		
		.directive('focusOn', ['$timeout', function ($timeout) {
			return {
				restrict: 'A',
				link: function (scope, element, attrs) {
					scope.$watch(attrs.focusOn, function (value) {
						if (value) {
							$timeout(function () {
								element.focus();
							});
						}
					});
				}
			};
		}])
		.directive('selectOn', ['$window', function ($window) {
			return {
				restrict: 'A',
				link: function (scope, element, attrs) {
					scope.$watch(attrs.selectOn, function (value) {
						if (value) {
							if (!$window.getSelection().toString()) {
								element[0].setSelectionRange(0, element[0].value.length);
							}
						}
					});
				}
			};
		}])
		.directive('resetScrollOn', ['$timeout', function ($timeout) {
			return function (scope, element, attrs) {
				scope.$watch(attrs.resetScrollOn, function (value) {
					if (value) {
						$timeout(function () {
							element[0].scrollTop = element[0].scrollHeight;
						});
					}
				});
			};
		}])
		.directive('ngChatResizer', ['$document', '$timeout', function ($document, $timeout) {
			return {
				restrict: 'A',
				scope: {
					resizeTarget: '@'
				},
				link: function (scope, elem, attrs) {
					var targetElem, startHeight = 0, pY = 0;
					
					function mouseMove ($event) {
						var mY = ($event.pageY - pY);
						var endHeight = startHeight + mY;
						
						targetElem.css({ 'height': endHeight + 'px' });
					}
					
					function mouseUp () {
						$document.unbind('mousemove', mouseMove);
						$document.unbind('mouseup', mouseUp);
					}
					
					elem.bind('mousedown', function ($event) {
						targetElem = angular.element(document.querySelector(scope.resizeTarget)); //$(scope.resizeTarget);
						
						if (targetElem) {
							startHeight = targetElem[0].offsetHeight; //.height();
							pY = $event.pageY;
							
							$document.bind('mousemove', mouseMove);
							$document.bind('mouseup', mouseUp);
						}
					});
				}
			};
		}])
		.directive('ngChatTooltip', ['$document', '$timeout', function ($document, $timeout) {
			return {
				restrict: 'A',
				scope: {
					ngChatTooltip: '@'
				},
				link: function (scope, elem, attrs) {
					var tooltipElem, documentBody;
					var visible = false;
					
					elem.on('mouseenter', function ($event) {
						if (visible)
							return;
						
						documentBody = angular.element(document).find('body');
						
						if (documentBody) {
							visible = true;
							documentBody.append('<div id="ng-chat-tooltip">' + scope.ngChatTooltip + '</div>');
							tooltipElem = angular.element(document.querySelector('#ng-chat-tooltip'));
							tooltipElem.css({ top: ($event.pageY + 25) + 'px', left: $event.pageX + 'px' });
						}
					});
					
					elem.on('mouseleave', function () {
						tooltipElem.remove();
						visible = false;
					});
				}
			};
		}])
		.constant('ngChatConfig', {
			minNameLength: 4, // not implemented
			maxNameLength: 16,
			maxReplyLength: 255,
			minRefreshTime: 5,
			maxRefreshTime: 300,
			shortDateFormat: 'HH:mm:ss',
			fullDateFormat: 'dd.mm.yyyy HH:mm:ss',
			smiliesDirectory: 'ngchat/smilies/',
			smiliesFormat: '.gif'
		})
		.directive('ngChat', function () {
			return {
				restrict: 'E',
				templateUrl: 'ngchat/ngchat.html',
				replace: true,
				controller: ['$scope', '$document', '$element', '$interval', '$timeout', '$sce', 'ngChatConfig', 'ngChatService', 'utilityService', function ($scope, $document, $element, $interval, $timeout, $sce, ngChatConfig, ngChatService, utilityService) {
					/*
					 * Data
					 */
					$scope.shortDate = ngChatConfig.shortDateFormat;
					$scope.fullDate = ngChatConfig.fullDateFormat;
					
					$scope.smilies = [
						{ code: 'aa', emotions: ['O:-)','O=)'] },
						{ code: 'ab', emotions: [':-)',':)','=)'] },
						{ code: 'ac', emotions: [':-(',':(',';('] },
						{ code: 'ad', emotions: [';-)',';)'] },
						{ code: 'ae', emotions: [':-P'] },
						{ code: 'af', emotions: ['8-)'] },
						{ code: 'ag', emotions: [':-D'] },
						{ code: 'ah', emotions: [':-['] },
						{ code: 'ai', emotions: ['*shock*','=-O'] },
						{ code: 'aj', emotions: [':-*'] },
						{ code: 'ak', emotions: [':\'('] },
						{ code: 'al', emotions: [':-X',':-x'] },
						{ code: 'am', emotions: ['>:o'] },
						{ code: 'an', emotions: [':-|'] },
						{ code: 'ao', emotions: [':-\\',':-/'] },
						{ code: 'ap', emotions: ['*jokingly*'] },
						{ code: 'aq', emotions: [']:->', '*devil*'] },
						{ code: 'ar', emotions: ['[:-}'] },
						{ code: 'as', emotions: ['*kissed*'] },
						{ code: 'at', emotions: [':-!'] },
						{ code: 'au', emotions: ['*tired*'] },
						{ code: 'av', emotions: ['*stop*'] },
						{ code: 'aw', emotions: ['*kissing*'] },
						{ code: 'ax', emotions: ['@}->--'] },
						{ code: 'ay', emotions: ['*thumbsup*'] },
						{ code: 'az', emotions: ['*drink*'] },
						{ code: 'ba', emotions: ['*inlove*'] },
						{ code: 'bb', emotions: ['@='] },
						{ code: 'bc', emotions: ['*help*'] },
						{ code: 'bd', emotions: ['\\m/'] },
						{ code: 'be', emotions: ['%)'] },
						{ code: 'bf', emotions: ['*ok*'] },
						{ code: 'bg', emotions: ['*wassup*','*sup*'] },
						{ code: 'bh', emotions: ['*sorry*'] },
						{ code: 'bi', emotions: ['*clapping*'] },
						{ code: 'bj', emotions: ['*rofl*', '*lol*'] },
						{ code: 'bk', emotions: ['*pardon*'] },
						{ code: 'bl', emotions: ['*no*'] },
						{ code: 'bm', emotions: ['*crazy*'] },
						{ code: 'bn', emotions: ['*dontknow*'] },
						{ code: 'bo', emotions: ['*dance*'] },
						{ code: 'bp', emotions: ['*yahoo*'] },
						{ code: 'bq', emotions: ['*hi*', '*hello*'] },
						{ code: 'br', emotions: ['*bye*'] },
						{ code: 'bs', emotions: ['*yes*'] },
						{ code: 'bt', emotions: [';D','*acute*'] },
						{ code: 'bu', emotions: ['*wall*', '*dash*'] },
						{ code: 'bv', emotions: ['*write*', '*mail*'] },
						{ code: 'bw', emotions: ['*scratch*'] }
					];
					
					$scope.initialized = false;
					$scope.refreshing = false;
					
					$scope.name = '';
					$scope.message = '';
					$scope.history = [];
					$scope.error = '';
					var errorTimer;
					
					$scope.scrollReset = 0;
					
					$scope.refreshTimeMin = ngChatConfig.minRefreshTime;
					$scope.refreshTime = ngChatConfig.minRefreshTime * 2;
					
					var refreshInt;
					
					var users = [];
					
					$scope.options = {
						detailed: false,
						smilies: false
					};
					
					/*
					 * Private functions
					 */
					function insertSmilies (text) {
						if (!text || !text.length)
							return;
						
						var sml, emo;
						
						for (var i = 0, len1 = $scope.smilies.length; i < len1; i++) {
							sml = $scope.smilies[i];
							
							for (var j = 0, len2 = sml.emotions.length; j < len2; j++) {
								emo = sml.emotions[j];
								
								if (text.toLowerCase().indexOf(emo.toLowerCase()) != -1) {
									text = utilityService.replaceAll(text, emo, '<img src="' + $scope.getSmileUrl(sml.code) + '">');
								}
							}
						}
						
						return text;
					}
					
					function updateSmilies () {
						if (!$scope.history || !$scope.history.length)
							return;
						
						for (var i = 0, len = $scope.history.length; i < len; i++) {
							$scope.history[i].message = insertSmilies($scope.history[i].message);
						}
					}
					
					function resetScroll () {
						var num = Math.floor(Math.random() * (99 - 1) + 1);
						$scope.scrollReset = num;
					}
					
					function userInfo () {
						ngChatService.status({
							userId: $scope.guid()
						}).then(function (resp) {
							if (resp && resp.length) {
								users = [];
								
								for (var i = 0, len = resp.length; i < len; i++) {
									users.push(resp[i].userId);
								}
							}
						}, function (){
							// error
						});
					}
					
					function updateHistory () {
						$scope.refreshing = true;
						
						ngChatService.getHistory().then(function (resp) {
							console.log('ngChatService.getHistory(): ' + (resp ? resp.length : 0) + ' messages loaded');
							
							if ($scope.history.length) {
								var lastExistId = $scope.history[$scope.history.length - 1].messageId;
								var lastNewId = resp[resp.length - 1].messageId;
								
								if (lastExistId === lastNewId)
								{
									// do nothing
								}
								else if (lastExistId < lastNewId)
								{
									var countOfNew = lastNewId - lastExistId;
									var newMessages = utilityService.takeFromRight(resp, countOfNew);
									
									for (var i = 0, len = newMessages.length; i < len; i++) {
										newMessages[i].message = insertSmilies(newMessages[i].message);
										$scope.history.push(newMessages[i]);
									}
									
									resetScroll();
								}
							}
							else {
								$scope.history = resp;
								updateSmilies();
								resetScroll();
							}
						}, function () {
							// error
						})['finally'](function () {
							$scope.initialized = true;
							$scope.refreshing = false;
						});
					}
					
					function refresh () {
						if ($scope.refreshing)
							return;
						
						userInfo();
						updateHistory();
					}
					
					function hideError () {
						$scope.error = '';
					}
					
					function showError (message) {
						if (!message)
							return;
						
						$scope.error = message;
						
						if (errorTimer)
							$timeout.cancel(errorTimer);
						
						errorTimer = $timeout(function () {
							hideError();
						}, 5000);
					}
					
					function sendMessage () {
						hideError();
						
						ngChatService.send({
							userId: $scope.guid(),
							user: $scope.name,
							message: $scope.message.replace(/\r?\n/g, '<br>')
						}).then(function (resp) {
							if (typeof resp != 'undefined'){
								resp.message = insertSmilies(resp.message);
								$scope.history.push(resp);
								resetScroll();
								$scope.message = '';
							}
						}, function (){
							showError('Something went wrong.');
						})['finally'](function (){
							// be happy
						});
					}
					
					/* 
					 * Public functions
					 */
					$scope.guid = function () {
						return utilityService.guid();
					};
					
					$scope.getUserBg = function (obj) {
						var hash = utilityService.hashCode(obj.userId);
						var rgb = utilityService.intToHex(hash);
						
						return '#' + rgb;
					};
					
					$scope.isUserOnline = function (userId) {
						if (!userId || !userId.length)
							return false;
						
						for (var i = 0, len = users.length; i < len; i++) {
							if (users[i] === userId)
								return true;
						}
						
						return false;
					};
					
					$scope.getHtmContent = function (str) {
						if (!str) 
							return '';
						return $sce.trustAsHtml(str);
					};
					
					$scope.getSmileUrl = function (code) {
						return ngChatConfig.smiliesDirectory + code + ngChatConfig.smiliesFormat;
					};
					
					$scope.insertText = function (text) {
						utilityService.insertTextAt('#chat-message', text);
					};
					
					$scope.quote = function (userId, userName) {
						if (userId === $scope.guid()) //|| $scope.message.trim().length
							return;
						
						// not implemented
						
						//var msg = $scope.message;
						//$scope.message = '';
						//$scope.insertText(userName + ', ' + msg);
					};
					
					function updateRefreshInterval () {
						if (refreshInt)
							$interval.cancel(refreshInt);
						
						refreshInt = $interval(function() {
							refresh();
						}, $scope.refreshTime * 1000);
					}
					
					$scope.directRefresh = function (){
						refresh();
					};
					
					$scope.clear = function(){
						if (!$scope.message || !$scope.message.length)
							return;
						$scope.message = '';
					};
					
					$scope.nameKeyPress = function (e) {
						if ($scope.name.length === ngChatConfig.maxNameLength)
							e.preventDefault();
					};
					
					$scope.messageKeyPressed = function ($event) {
						if (($event.keyCode == 10 || $event.keyCode == 13) && $event.ctrlKey) {
							$scope.send();
						}
						
						if ($scope.message.length === ngChatConfig.maxReplyLength)
							$event.preventDefault();
					};
					
					$scope.send = function () {
						if (!$scope.message || !$scope.message.trim().length || !$scope.name || !$scope.name.trim().length)
							return;
						
						sendMessage();
						userInfo();
					};
					
					/*
					 * Watchers
					 */
					$scope.$watch('name', function (to, from) {
						if (from == to || !to)
							return;
						if ($scope.name.length > ngChatConfig.maxNameLength) {
							$scope.name = $scope.name.substr(0, ngChatConfig.maxNameLength);
						}
					});
					
					$scope.$watch('message', function (to, from) {
						if (from == to || !to)
							return;
						if ($scope.message.length > ngChatConfig.maxReplyLength) {
							$scope.message = $scope.message.substr(0, ngChatConfig.maxReplyLength);
						}
					});
					
					$scope.$watch('refreshTime', function (to, from) {
						if (to !== undefined && isNaN(to)) {
							$scope.refreshTime = from;
							return;
						}
					});
					
					$scope.refreshBlur = function () {
						if ($scope.refreshTime >= ngChatConfig.maxRefreshTime)
							$scope.refreshTime = ngChatConfig.maxRefreshTime;
						else if ($scope.refreshTime <= ngChatConfig.minRefreshTime)
							$scope.refreshTime = ngChatConfig.minRefreshTime;
						
						updateRefreshInterval();
					};
					
					/* Init
					 */
					updateRefreshInterval();
					refresh();
				}]
			};
		});
})();