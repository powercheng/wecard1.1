var app = angular.module('wechatCard', ['ngRoute','monospaced.qrcode']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/', {
		templateUrl: '/views/cards.html',
		controller: 'cardsCtrl'
	}).
	when('/cards/:id', {
		templateUrl: '/views/card.html',
		controller: 'cardCtrl'
	});
}]);

app.controller('cardsCtrl', ['$scope', '$http', function($scope, $http) {
	$http({
		method: 'GET',
		url: '/cards/'
	}).then(function successCallback(res) {
		$scope.cards = res.data;
	}, function errorCallback(res) {
            // 请求失败执行代码
        });
	
	let personInfos = [{
		"name": "联系电话",
		"value": ""
	}, {
		"name": "联系地址",
		"value": ""
	}, {
		"name": "微信号码",
		"value": ""
	}, {
		"name": "QQ号码",
		"value": ""
	}, {
		"name": "邮箱",
		"value": ""
	}];
	let companyInfos = [{
		"name": "固定电话",
		"value": ""
	}, {
		"name": "传真号码",
		"value": ""
	}, {
		"name": "网址",
		"value": ""
	}];
	let otherInfos = [];
	let name = "姓名";
	let companyName = "公司名";
	let bgColor = "#ff7694";
	let menuColor = "#ff7694";
	let baiduAddress = "";
	let wCode = "上传文件";
	let qCode = "上传文件";
	let music = "上传文件";
	let pImage = "上传文件";


	$scope.createCard = function() {
		$http({
			method:"POST",
			url: '/cards/',
			data : {
				cardName: $scope.cardName,
				name:angular.toJson(name),
				companyName:angular.toJson(companyName),
				personInfos: angular.toJson(personInfos),
				companyInfos: angular.toJson(companyInfos),
				otherInfos: angular.toJson(otherInfos),
				bgColor: angular.toJson(bgColor),
				menuColor: angular.toJson(menuColor),
				baiduAddress: angular.toJson(baiduAddress),
				wCode: angular.toJson(wCode),
				qCode: angular.toJson(qCode),
				music: angular.toJson(music),
				pImage: angular.toJson(pImage)
			}
		}).then(function successCallback(res) {
			$http({
				method: 'GET',
				url: '/cards/'
			}).then(function successCallback(res) {
				$scope.cards = res.data;
			}, function errorCallback(res) {
            // 请求失败执行代码
        });
		}, function errorCallback(res) {

		});
	};
}]);


app.controller('cardCtrl', ['$scope', '$http', '$routeParams', 'fileUpload', '$sce', '$timeout','$window',
	function($scope, $http, $routeParams, fileUpload, $sce, $timeout, $window) {
		$http({
			method: 'GET',
			url: '/cards/' + $routeParams.id,
		}).then(function successCallback(res) {
			$scope.cardName = angular.fromJson(res.data.cardName);
			$scope.name = angular.fromJson(res.data.name);
			$scope.companyName = angular.fromJson(res.data.companyName);
			$scope.personInfos = angular.fromJson(res.data.personInfos);
			$scope.companyInfos = angular.fromJson(res.data.companyInfos);
			$scope.otherInfos = angular.fromJson(res.data.otherInfos);
			$scope.bgColor = angular.fromJson(res.data.bgColor);
			$scope.menuColor = angular.fromJson(res.data.menuColor);
			$scope.wCode = angular.fromJson(res.data.wCode);
			$scope.qCode = angular.fromJson(res.data.qCode);
			$scope.music = angular.fromJson(res.data.music);
			$scope.pImage = angular.fromJson(res.data.pImage);
		}, function errorCallback(res) {

		});
		$scope.myVar = [true, false, true, false, false];
		$scope.saveStatus = "未保存";

		$scope.toggle = function(index) {
			$scope.myVar[index] = !$scope.myVar[index];
		};

		$scope.show = function(value) {
			$scope.myVar[0] = true;
			$scope.myVar[1] = true;
			$scope.myVar[2] = true;
			$scope.myVar[value] = false;
		}

		$scope.delText = function(value) {
			if (!$scope.text) {
				return
			}
			$scope.text[value] = "";
		}

		$scope.addInfo = function(arr,index) {
			console.log(index);
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


		$scope.changeMut = function(i) {
			$(".mut").removeClass("mused");
			$(".mut").eq(i).addClass("mused");
			$(".mutexItems").css("display", "none");
			$(".mutexItems").eq(i).css("display", "block");
		};


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
			$http({
				method: "PUT",
				url: "/cards/",
				data: {
					name: angular.toJson($scope.name),
					companyName: angular.toJson($scope.companyName),
					cardName: angular.toJson($scope.cardName),
					personInfos: angular.toJson($scope.personInfos),
					companyInfos: angular.toJson($scope.companyInfos),
					otherInfos: angular.toJson($scope.otherInfos),
					bgColor: angular.toJson($scope.bgColor),
					menuColor: angular.toJson($scope.menuColor),
					baiduAddress: angular.toJson($scope.baiduAddress),
					wCode: angular.toJson($scope.wCode),
					qCode: angular.toJson($scope.qCode),
					music: angular.toJson($scope.music),
					pImage: angular.toJson($scope.pImage)
				}
			}).then(function successCallback(res){
				$scope.saveStatus = "保存成功";
				$timeout(function(){
					$scope.saveStatus = "未保存";
				},10000);  
			}).then(function errorCallback(res) {

			});
		};

		$scope.finishCard = function() {
			console.log('finish');
			$scope.saveCard();
			var content = $("#main")[0].innerHTML;
			$http({
				method: "POST",
				url: "/files/finish",
				data: {
					'name': $scope.name,
					'cardName': $scope.cardName,
					'content': content
				}
			}).then(function successCallback(res){
				$scope.finish = true;
				var url = location.origin + "/uploads/" + $scope.cardName + ".html";
				$scope.cardHtml = url;
			}).then(function errorCallback(res) {

			});
		}

/*	$scope.save = function() {
		var data = $("#main")[0].innerHTML;
		$http({
			method: "POST",
			url: "/customers/create/",
			data: {
				'phone': $scope.phone,
				'data': data
			}
		})
		.success(function() {

		})
		.error(function() {

		});
	};*/

}]);

app.filter('to_trusted', ['$sce', function ($sce) {
	return function (text) {
		return $sce.trustAsHtml(text);
	};
}]);


app.directive("inputModel", ["$parse", function($parse) {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			console.log(scope);
			console.log(element);
			console.log(attrs);
			console.log(attrs.$$element);
			var model = $parse(attrs.fileModel);
			var modelSetter = model.assign;

			element.bind("change", function() {
				scope.$apply(function() {
					modelSetter(scope, element[0].files);
				});
			});
		}
		
	};
}]);

app.directive('contenteditable', function() {
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ctrl) {

			element.bind('keyup', function() {
				scope.$apply(function() {
					var html=element.html();
					ctrl.$setViewValue(html);
				});

			});
			element.bind('click', function() {
				scope.$apply(function() {
					var html=element.html();
					ctrl.$setViewValue(html);
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
	                unique_names: true,
	                    // 默认 false，key为文件名。若开启该选项，SDK会为每个文件自动生成key（文件名）
	                // save_key: true,
	                    // 默认 false。若在服务端生成uptoken的上传策略中指定了 `sava_key`，则开启，SDK在前端将不对key进行任何处理
	                domain: 'http://image.mymicrocard.com/',
	                    //bucket 域名，下载资源时用到，**必需**
	                container: containerId,           //上传区域DOM ID，默认是browser_button的父元素，
	                max_file_size: '10mb',           //最大文件体积限制
	                flash_swf_url: '../js/plupload/Moxie.swf',  //引入flash,相对路径
	                filters: {
	                        mime_types: [
	                          //只允许上传图片文件 （注意，extensions中，逗号后面不要加空格）
	                          { title: "图片文件", extensions: "jpg,gif,png,bmp" }
	                        ]
	                },
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

	                        // 插入图片到editor
	                        editor.command(null, 'insertHtml', '<img src="' + sourceLink + '" style="width:100%;"/>')
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
	                    }
	                    // Key 函数如果有需要自行配置，无特殊需要请注释
	                    //,
	                    // 'Key': function(up, file) {
	                    //     // 若想在前端对每个文件的key进行个性化处理，可以配置该函数
	                    //     // 该配置必须要在 unique_names: false , save_key: false 时才生效
	                    //     var key = "";
	                    //     // do something with key here
	                    //     return key
	                    // }
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




        app.service("fileUpload", ["$http", function($http) {
        	this.uploadFileToUrl = function(files, uploadUrl, scope) {
        		scope.uploadStatus = "上传中....";
        		var fd = new FormData();
        		fd.append("phone", scope.phone);
        		for(var i = 0; i < files.length; i++) {
        			fd.append("uploadFiles", files[i]);
        		}
        		$http.post(uploadUrl, fd, {
        			transformRequest: angular.identity,
        			headers: {
        				"Content-Type": undefined
        			}
        		})
        		.success(function() {
        			scope.uploadStatus = "上传成功";
        		})
        		.error(function() {
        			scope.errorStatus = "上传失败";
        		});
        	};
        }]);