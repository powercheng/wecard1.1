'use strict';

angular.module('myApp', [
	'ngStorage',
	'ngRoute',
	'monospaced.qrcode'
	])
.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {

	$routeProvider.
	when('/', {
		templateUrl: 'partials/cards.html',
		controller: 'cardsCtrl'
	}).
	when('/login', {
		templateUrl: 'partials/login.html',
		controller: 'HomeCtrl'
	}).
	when('/cards/:ownerID/:cardName', {
		templateUrl: 'partials/card.html',
		controller: 'cardCtrl'
	}).
	when('/cards', {
		templateUrl: 'partials/cards.html',
		controller: 'cardsCtrl'
	}).
	otherwise({
		redirectTo: '/'
	});

	$httpProvider.interceptors.push(['$q', '$location', '$localStorage', function($q, $location, $localStorage) {
		return {
			'request': function (config) {
				config.headers = config.headers || {};
				if ($localStorage.token) {
					config.headers.Authorization = 'token ' + $localStorage.token;
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

.controller('HomeCtrl', ['$rootScope', '$scope', '$location', 'Main', '$localStorage', function($rootScope, $scope, $location, Main, $localStorage) {

	$scope.login = function() {
		var formData = {
			username: $scope.username,
			password: $scope.password
		}

		Main.login(formData, function(res) {
			$localStorage.token = res.data.token;
			if (res.type == true) {
				$rootScope.user = res.data;
				$location.path('/cards');
			} else {
				$scope.loginError = res.data;
			}
		}, function() {
			$rootScope.error = '登录失败';
		})
	};

	$scope.logout = function() {

		Main.logout(function() {
			$location.path('/login');
		}, function() {
			$rootScope.error = 'Failed to logout';
		});
	};
}])

.controller('cardsCtrl', ['$rootScope', '$scope', '$http', 'Main', '$localStorage', function($rootScope, $scope, $http, Main, $localStorage) {
	if (!$localStorage.token) {
		location.path('/login');
	}
	if ($rootScope.user === undefined) {
		Main.getUser(function(res) {
			if (res.type == true) {
				$rootScope.user = res.data;
			} else {
				$location.path('/login');
			}
		}, function() {
			$rootScope.error = '登录失败';
		});
	}


	$scope.createCard = function() {
		/*if ($rootScope.)*/
		var cardPath = $rootScope.user.id + '/' + $scope.cardName;
		console.log(cardPath);
		var template = "1";
		var companyName = {name:'敏捷图文'};
		var compnayAddress = {name:"云梦县鑫光公寓西北100米(梦泽大道西)", value:"31.031310,113.745570"};
		var companyPhone = {name:"0712-4222110"};
		var personName = {name:'黄敏'};
		var personTitle = {name:'总经理'};
		var personPhone = {name:"15272838562"};
		var personImage = {name:"头像", value:"0/personImage.jpg"};
		var wechat = {name:"15272838562", code:"0/wechat.jpg"};
		var QQ = {name:"3367876415", code:"0/QQ.jpg"};
		var other = [{name:"",value:""}];
		var bgColor = "#ff7694";
		var menuColor = "#ff7694";
		var topHtml = "";
		var botHtml = "";
		var music = "";
		var formData = {
			cardPath: cardPath,
			template: template,
			personName: angular.toJson(personName),
			personPhone: angular.toJson(personPhone),
			personTitle: angular.toJson(personTitle),
			personImage: angular.toJson(personImage),
			companyName: angular.toJson(companyName),
			companyPhone: angular.toJson(companyPhone),
			companyAddress: angular.toJson(compnayAddress),
			wechat: angular.toJson(wechat),
			QQ: angular.toJson(QQ),
			other: angular.toJson(other),
			bgColor: bgColor,
			menuColor: menuColor,
			music: music,
			topHtml: topHtml,
			botHtml: botHtml,			
		}
		Main.card(formData, function(res) {
			$rootScope.user = res.data;
		}, function() {
			$rootScope.error = 'Failed to fetch details';
		})
	};
}])

.controller('cardCtrl', ['$rootScope','$scope', '$http', '$routeParams', '$sce', '$timeout','$window', '$localStorage',
	function($rootScope, $scope, $http, $routeParams, $sce, $timeout, $window, $localStorage) {
		if (!$localStorage.token) {
			location.path('/login');
		}
		$http({
			method: 'GET',
			url: '/card/' + $routeParams.cardName,
		}).then(function successCallback(res) {
			$rootScope.user = res.data.user;
			var card = res.data.card;
			$scope.card = {};
			$scope.card.cardPath = card.cardPath;
			$scope.card.password = card.password;
			$scope.card.personName = angular.fromJson(card.personName);
			$scope.card.companyName = angular.fromJson(card.companyName);
			$scope.card.companyAddress = angular.fromJson(card.companyAddress);
			$scope.card.personTitle = angular.fromJson(card.personTitle);
			$scope.card.wechat = angular.fromJson(card.wechat);
			$scope.card.QQ = angular.fromJson(card.QQ);
			$scope.card.personPhone = angular.fromJson(card.personPhone);
			$scope.card.companyPhone = angular.fromJson(card.companyPhone);
			$scope.card.personImage = angular.fromJson(card.personImage);
			$scope.card.other = angular.fromJson(card.other);
			$scope.card.bgColor = card.bgColor;
			$scope.card.menuColor = card.menuColor;
			$scope.card.topHtml = card.topHtml;
			$scope.card.botHtml = card.botHtml;
			$scope.card.template = card.template;			
		}, function errorCallback(res) {

		});
		$scope.template = 1;
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
			if (value == 0) {
				$scope.topHtml = "";
			} else if (value == 1) {
				$scope.botHtml = "";
			}			
		}


		$scope.checkVideo = function(name) {
			var ext = name.substr(name.lastIndexOf(".") + 1).toLowerCase();
			if(ext == 'mp4' || ext == 'avi' || ext == 'mpeg' || ext == 'wmv' || ext == 'rmvb' || ext == 'rm') 
				return true;
			return false;
		};

		$scope.trustUrl = function(url) {
			return $sce.trustAsResourceUrl('http://image.mymicrocard.com/' + url);
		};

		$scope.saveCard = function() {
			$scope.saveStatus = "保存中...";
			var formDate = {
				cardPath : $scope.card.cardPath,
				password : $scope.card.password,
				template : $scope.card.template,
				personName: angular.toJson($scope.card.personName),
				personPhone: angular.toJson($scope.card.personPhone),
				personTitle: angular.toJson($scope.card.personTitle),
				personImage: angular.toJson($scope.card.personImage),
				companyName: angular.toJson($scope.card.companyName),
				companyPhone: angular.toJson($scope.card.companyPhone),
				companyAddress: angular.toJson($scope.card.compnayAddress),
				wechat: angular.toJson($scope.card.wechat),
				QQ: angular.toJson($scope.card.QQ),
				other: angular.toJson($scope.card.other),
				bgColor: $scope.card.bgColor,
				menuColor: $scope.card.menuColor,
				music: $scope.card.music,
				topHtml: $scope.card.topHtml,
				botHtml: $scope.card.botHtml,
			}

			$http({
				method: "PUT",
				url: "/card/",
				data: formDate,
			}).then(function successCallback(res){
				console.log(res);
				$scope.saveStatus = "保存成功";
				$timeout(function(){
					$scope.saveStatus = "未保存";
				},10000);  
			}).then(function errorCallback(res) {

			});
		};

		$scope.finishCard = function() {
			$scope.saveCard();
			var images = $("img");
			var upImages = new Array();
			var dom = "image.mymicrocard.com";
			for (var i=0; i < images.length; i++) {
				if (images[i].currentSrc.indexOf(dom) >= 0 && upImages.indexOf(images[i].currentSrc) === -1) {
					upImages.push(images[i].currentSrc);
				}
			}
			for (var i=0; i <upImages.length; i++) {
				upImages[i] = upImages[i].split('/').pop();
			}
			$http({
				method: "POST",
				url: "/delete/files",
				data: {
					cardName: $routeParams.cardName,
					upImages: upImages
				}
			}).then(function successCallback(res){
				console.log(res);
			}).then(function errorCallback(res) {

			});


			var content = $("#main")[0].innerHTML;
			$http({
				method: "POST",
				url: "/finish",
				data: {
					cardName: $routeParams.cardName,
					personName: $scope.card.personName.name,
					content: content
				}
			}).then(function successCallback(res){
				$scope.finish = true;
				var url = location.origin + "/uploads/" + $scope.card.cardPath + ".html";
				$scope.cardHtml = url;
			}).then(function errorCallback(res) {

			});
		}

	}])


.factory('Main', ['$http', '$rootScope', '$localStorage', function($http, $rootScope, $localStorage){
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
			delete $localStorage.token;
			success();
		}
	};
}])

.filter('to_trusted', ['$sce', function ($sce) {
	return function (text) {
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
					var html=element.html();
					ngModel.$setViewValue(html);
				});

			});
			element.bind('click', function() {
				scope.$apply(function() {
					var html=element.html();
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
	                runtimes: 'html5,flash,html4',    //上传模式,依次退化
	                browse_button: btnId,       //上传选择的点选按钮，**必需**
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
	                container: containerId,           //上传区域DOM ID，默认是browser_button的父元素，
	                max_file_size: '10mb',           //最大文件体积限制
	                flash_swf_url: '../js/plupload/Moxie.swf',  //引入flash,相对路径
/*	                filters: {
	                	mime_types: [
	                          //只允许上传图片文件 （注意，extensions中，逗号后面不要加空格）
	                          { title: "图片文件", extensions: "jpg,gif,png,bmp" }
	                          ]
	                      },*/
	                max_retries: 3,                   //上传失败最大重试次数
	                dragdrop: true,                   //开启可拖曳上传
	                drop_element: 'editor-container',        //拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
	                chunk_size: '4mb',                //分块上传时，每片的体积
	                auto_start: true,                 //选择文件后自动上传，若关闭需要自己绑定事件触发上传
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
	                        if (file.type.indexOf('image') != -1) {
	                        	editor.command(null, 'insertHtml', '<img src="' + sourceLink + '" style="width:100%;"/>');
	                        } else if (file.type.indexOf('video') != -1) {
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

