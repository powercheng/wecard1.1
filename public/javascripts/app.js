'use strict';

angular.module('myApp', [
	'ngRoute',
	'ngStorage',
	'monospaced.qrcode'
	])
.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {

	$routeProvider.
	when('/', {
		templateUrl: 'partials/cards.html',
		controller: 'cardsCtrl'
	}).
	when('/login', {
		templateUrl: 'partials/login.html',
		controller: 'loginCtrl'
	}).
	when('/cards/:ownerID/:cardName', {
		templateUrl: 'partials/card.html',
		controller: 'cardCtrl'
	}).
	when('/cards', {
		templateUrl: 'partials/cards.html',
		controller: 'cardsCtrl'
	});

	$httpProvider.interceptors.push(['$q', '$location', '$sessionStorage', function($q, $location, $sessionStorage) {
		return {
			'request': function(config) {
				config.headers = config.headers || {};
				if($sessionStorage.token) {
					config.headers.Authorization = 'token ' + $sessionStorage.token;
				}
				return config;
			},
			'responseError': function(response) {
				if(response.status === 401 || response.status === 403) {
					$location.path('/signin');
				}
				return $q.reject(response);
			}
		};
	}]);
}])

.controller('loginCtrl', ['$rootScope', '$scope', '$location', '$http', '$sessionStorage', 'Main', function($rootScope, $scope, $location, $http, $sessionStorage, Main) {
	$scope.login = function() {
		var formData = {
			username: $scope.username,
			password: $scope.password
		}

		Main.login(formData, function(res) {
			$rootScope.user = res.user;
			$rootScope.start = 0;
			$rootScope.pages = new Array(Math.ceil(res.user.cards.length/15));
			$sessionStorage.token = res.token;
			$location.path('/cards');
		}, function(res) {
			$scope.loginError = res.message;
		})
	}

	$rootScope.logout = function() {
		Main.logout(function() {
			$location.path('/login');
		}, function() {
			$rootScope.error = 'Failed to logout';
		});
	}
}])

.controller('cardsCtrl', ['$rootScope', '$scope', '$http', 'Main', '$sessionStorage', '$location', function($rootScope, $scope, $http, Main, $sessionStorage, $location) {
	if(!$sessionStorage.token) {
		$location.path('/login');
		return
	}
	if($rootScope.user === undefined) {
		Main.getUser(
			function(res) {
				$rootScope.user = res.user;
				$rootScope.start = 0;
				$rootScope.pages = new Array(Math.ceil(res.user.cards.length/15));
				$rootScope.logout = function() {
					Main.logout(
						function() {
							$location.path('/login');
						},
						function() {
							$rootScope.error = 'Failed to logout';
						});
				}
			},
			function() {
				$rootScope.error = '登录失败';
				$location.path('/login');
				return
			}
			);
	}

	$scope.createCard = function() {
		var card = {};
		card.cardPath = $rootScope.user.id + '/' + $scope.cardName;
		var cards = $rootScope.user.cards;
		for (var i=0; i < cards.length; i++) {
			if (card.cardPath == cards[i]) {
				$scope.createStatus = "已存在该文件名";
				return
			}
		}
		card.template = "1";
		card.companyName = {
			name: '',
		};
		card.companyAddress = {
			name: '',
			value: ''
		};
		card.companyPhone = {
			name: ""
		};
		card.personName = {
			name: ''
		};
		card.personTitle = {
			name: ''
		};
		card.personPhone = {
			name: ""
		};
		card.personImage = {
			name: "",
			value: ""
		};
		card.wechat = {
			name: "",
			code: ""
		};
		card.QQ = {
			name: "",
			code: ""
		};
		card.other = [{
			name: "",
			value: ""
		}];
		card.redirect = "1";
		card.bgColor = "#ff7694";
		card.menuColor = "#ff7694";
		card.topHtml = "";
		card.botHtml = "";
		card.music = "";
		card.title = "";
		Main.card(angular.toJson(card), function(res) {
			$rootScope.user = res.user;
			$rootScope.pages = new Array(Math.ceil(res.user.cards.length/15));
		}, function() {
			$rootScope.error = 'Failed to fetch details';
		})
	}
	$scope.deleteCard = function(cardPath) {
		var msg = "您真的确定要删除吗？\n\n请确认！";
		if(confirm(msg) == true) {
			$http.delete('/card', {
				params: {
					cardPath: cardPath
				}
			})
			.then(function(res) {
				$rootScope.user = res.data.user;
				if ($rootScope.start >=  res.data.user.cards.length && $rootScope.start != 0) {
					$rootScope.start -= 15;
				} 
				$rootScope.pages = new Array(Math.ceil(res.data.user.cards.length/15));
			}, function(res) {
			});
		} else {

		}
	}
	$scope.nextPage = function() {
		$rootScope.start += 15;
		if ($rootScope.start >= $rootScope.user.cards.length) {
			$rootScope.start -= 15;
		}
	}
	$scope.previousPage = function() {
		$rootScope.start -= 15;
		if($rootScope.start < 0) {
			$rootScope.start = 0;
		}
	}
	$scope.goPage = function(page) {
		$rootScope.start = page * 15;
	}
}])

.controller('cardCtrl', ['$rootScope', '$scope', '$http', '$routeParams', '$sce', '$timeout', '$sessionStorage', '$location', 'Main', function($rootScope, $scope, $http, $routeParams, $sce, $timeout, $sessionStorage, $location, Main) {
	if(!$sessionStorage.token) {
		$location.path('/login');
		return
	}
	if($rootScope.user === undefined) {
		Main.getUser(function(res) {
			$rootScope.user = res.user;
			$rootScope.start = 0;
			$rootScope.logout = function() {
				Main.logout(function() {
					$location.path('/login');
				}, function() {
					$rootScope.error = 'Failed to logout';
				});
			};
		}, function(res) {
			$rootScope.error = res.message;
			$location.path('/login');
			return
		});
	}

	$http({
		method: 'GET',
		url: '/card/' + $routeParams.cardName,
	}).then(function(res) {
		$scope.card = res.data.card;
	}, function errorCallback(res) {});
	$scope.saveStatus = "未保存";
	$scope.toggle = function(index) {
		$scope.myVar[index] = !$scope.myVar[index];
	};

	$scope.myVar = [true, false, true];
	$scope.show = function(value) {
		$scope.myVar[0] = true;
		$scope.myVar[1] = true;
		$scope.myVar[2] = true;
		$scope.myVar[value] = false;
	}

	$scope.delText = function(value) {
		if(value == 0) {
			$scope.card.topHtml = "";
		} else if(value == 1) {
			$scope.card.botHtml = "";
		}
	}

	$scope.saveLotto = function() {
		$http({
			method: "POST",
			url: "/lottery/",
			data: {
				path: $routeParams.cardName,
				lottos: $scope.lottos,
				lottoMark: $scope.lottoMark,
				customers: []
			},
		}).then(function(res) {
			$scope.lottoStatus = res.data.message;
		}, function(res) {
			$rootScope.error = res.data.message;
			$location.path('/login');
			return
		});
	}
	$scope.lottos = [{name: "一等奖", value: "", percent:""},{name: "二等奖", value: "", percent:""},{name:"三等奖",value:"",percent:""}];
	$scope.lottoMark = "请凭手机号到本店前台领取奖品，该奖品三日内有效";
	$scope.addInfo = function(arr,index) {
	//	console.log(index);
		arr.splice(index, 0,{
			name: "",
			value: ""
		});
	};
	$scope.pushInfo = function(arr) {
		arr.push({
			name: "",
			value: ""
		})
	}
	$scope.removeInfo = function(arr, index) {
		arr.splice(index, 1);
	};

	$scope.trustUrl = function(url) {
		return $sce.trustAsResourceUrl('http://image.mymicrocard.com/' + url);
	};

	$scope.saveCard = function() {
		$scope.saveStatus = "保存中...";
		if ($scope.lottos[0].value != ""){
			$scope.saveLotto();
		}
		$http({
			method: "PUT",
			url: "/card/",
			data: $scope.card,
		}).then(function(res) {
			$scope.saveStatus = "保存成功";
			$timeout(function() {
				$scope.saveStatus = "未保存";
			}, 30000);
		}, function(res) {
			$rootScope.error = res.message;
			$location.path('/login');
			return
		});
	};

	$scope.finishCard = function() {
		$scope.saveCard();
		var images = $("img");
		var upImages = new Array();
		var dom = "image.mymicrocard.com";
		var dom2 = "image.mymicrocard.com/images";
		for(var i = 0; i < images.length; i++) {
			if(images[i].currentSrc.indexOf(dom) >= 0 && images[i].currentSrc.indexOf(dom2) < 0 && upImages.indexOf(images[i].currentSrc) === -1) {
				upImages.push(images[i].currentSrc);
			}
		}
		for(var i = 0; i < upImages.length; i++) {
			upImages[i] = upImages[i].split('/').pop();
		}
		if (upImages.length > 0) {
			$http({
				method: "POST",
				url: "/delete/files",
				data: {
					cardName: $routeParams.cardName,
					upImages: upImages
				}
			}).then(function successCallback(res) {
			}, function errorCallback(res) {

			});
		}

		if ($scope.card.redirect == "2") {
			$http({
				method: "POST",
				url: "/finish2",
				data: {
					cardName: $routeParams.cardName,
				}
			}).then(function successCallback(res) {
				$scope.finish = true;
				var url = location.origin + "/uploads/" + $scope.card.cardPath + ".html";
				$scope.cardHtml = url;
			}).then(function errorCallback(res) {

			});
		} else {
			var content = $("#main")[0].innerHTML;
			$http({
				method: "POST",
				url: "/finish1",
				data: {
					cardName: $routeParams.cardName,
					title: $scope.card.title,
					content: content
				}
			}).then(function successCallback(res) {
				$scope.finish = true;
				var url = location.origin + "/uploads/" + $scope.card.cardPath + ".html";
				$scope.cardHtml = url;
			}).then(function errorCallback(res) {

			});
		}
	}

}])

.factory('Main', ['$http', '$rootScope', '$sessionStorage', function($http, $rootScope, $sessionStorage) {
	var baseUrl = "";
	return {
		save: function(data, success, error) {
			$http.post(baseUrl + '/signin', data).success(success).error(error)
		},
		login: function(data, success, error) {
			$http.post(baseUrl + '/login', data).success(success).error(error);
		},
		getUser: function(success, error) {
			$http.get(baseUrl + '/user').success(success).error(error);
		},
		card: function(data, success, error) {
			$http.post(baseUrl + '/card/', data).success(success).error(error)
		},
		logout: function(success) {
			$rootScope.user = null;
			delete $sessionStorage.token;
			success();
		}
	};
}])

.filter('to_trusted', ['$sce', function($sce) {
	return function(text) {
		return $sce.trustAsHtml(text);
	};
}])

.directive('contenteditable', function() {
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ngModel) {
			ngModel.$render = function() {
				element.html(ngModel.$viewValue || '');
			};
			element.bind('keyup', function() {
				scope.$apply(function() {
					var html = element.html();
					ngModel.$setViewValue(html);
				});

			});
			element.bind('click', function() {
				scope.$apply(function() {
					var html = element.html();
					ngModel.$setViewValue(html);
				});

			});
				// 创建编辑器
				var editor = new wangEditor(element);
				editor.config.customUpload = true;
				editor.config.customUploadInit = uploadInit;
				editor.create();

				// 初始化七牛上传的方法
				// 初始化七牛上传
				function uploadInit() {
					var editor = this;
					var btnId = editor.customUploadBtnId;
					var containerId = editor.customUploadContainerId;

					// 创建上传对象
					var uploader = Qiniu.uploader({
						runtimes: 'html5,flash,html4', //上传模式,依次退化
						browse_button: btnId, //上传选择的点选按钮，**必需**
						uptoken_url: '/uptoken',
						//Ajax请求upToken的Url，**强烈建议设置**（服务端提供）
						// uptoken : '<Your upload token>',
						//若未指定uptoken_url,则必须指定 uptoken ,uptoken由其他程序生成
						//unique_names: true,
						// 默认 false，key为文件名。若开启该选项，SDK会为每个文件自动生成key（文件名）
						// save_key: true,
						// 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK在前端将不对key进行任何处理
						domain: 'http://image.mymicrocard.com/',
						//bucket 域名，下载资源时用到，**必需**
						container: containerId, //上传区域DOM ID，默认是browser_button的父元素，
						max_file_size: '10mb', //最大文件体积限制
						flash_swf_url: '../js/plupload/Moxie.swf', //引入flash,相对路径
						/*	                filters: {
							                	mime_types: [
							                          //只允许上传图片文件 （注意，extensions中，逗号后面不要加空格）
							                          { title: "图片文件", extensions: "jpg,gif,png,bmp" }
							                          ]
							                      },*/
						max_retries: 3, //上传失败最大重试次数
						dragdrop: true, //开启可拖曳上传
						drop_element: 'editor-container', //拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
						chunk_size: '4mb', //分块上传时，每片的体积
						auto_start: true, //选择文件后自动上传，若关闭需要自己绑定事件触发上传
						init: {
							'FilesAdded': function(up, files) {
								plupload.each(files, function(file) {
									// 文件添加进队列后,处理相关的事情
									printLog('on FilesAdded');
								});
							},
							'BeforeUpload': function(up, file) {
								// 每个文件上传前,处理相关的事情
								printLog('on BeforeUpload');
							},
							'UploadProgress': function(up, file) {
								// 显示进度条
								editor.showUploadProgress(file.percent);
							},
							'FileUploaded': function(up, file, info) {
								// 每个文件上传成功后,处理相关的事情
								// 其中 info 是文件上传成功后，服务端返回的json，形式如
								// {
								//    "hash": "Fh8xVqod2MQ1mocfI4S4KpRL6D98",
								//    "key": "gogopher.jpg"
								//  }
								printLog(info);
								// 参考http://developer.qiniu.com/docs/v6/api/overview/up/response/simple-response.html

								var domain = "http://image.mymicrocard.com/";
								var res = $.parseJSON(info);
								var sourceLink = domain + res.key; //获取上传成功后的文件的Url
								printLog(sourceLink);
								if(file.type.indexOf('image') != -1) {
									editor.command(null, 'insertHtml', '<img src="' + sourceLink + '" style="width:100%;"/>');
								} else if(file.type.indexOf('video') != -1) {
									editor.command(null, 'insertHtml', '<video src="' + sourceLink + '" controls="controls" style="width:100%"></video>');
								} else {
									editor.command(null, 'insertHtml', '<p>' + sourceLink + '</p>');
								}
								// 插入图片到editor

							},
							'Error': function(up, err, errTip) {
								//上传出错时,处理相关的事情
								printLog('on Error');
							},
							'UploadComplete': function() {
								//队列文件处理完毕后,处理相关的事情
								printLog('on UploadComplete');

								// 隐藏进度条
								editor.hideUploadProgress();
							},
							'Key': function(up, file) {
								// 若想在前端对每个文件的key进行个性化处理，可以配置该函数
								// 该配置必须要在 unique_names: false , save_key: false 时才生效
								var key = scope.card.cardPath + '/' + file.name;
								// do something with key here
								return key
							}
						}
					});
					// domain 为七牛空间（bucket)对应的域名，选择某个空间后，可通过"空间设置->基本设置->域名设置"查看获取
					// uploader 为一个plupload对象，继承了所有plupload的方法，参考http://plupload.com/docs
				}

				// 封装 console.log 函数
				function printLog(title, info) {
					window.console && console.log(title, info);
				}
			}
		}
	});