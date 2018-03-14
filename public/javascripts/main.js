function show(str) {
	document.getElementById("layBg").style.display = "block";
	document.getElementById(str).style.display = "block";
}

function closeIt(str) {
	document.getElementById("layBg").style.display = "none";
	document.getElementById(str).style.display = "none";
}

changeMut = function(i) {
	$(".mutex").removeClass("mused");
	$(".mutex").eq(i).addClass("mused");
	$(".mutexItem").css("display", "none");
	$(".mutexItem").eq(i).css("display", "block");
};

function music() {
	var audio = document.getElementById("musicId");
	if(audio.paused) {
		audio.play();
		document.getElementById("musicImage").style.backgroundImage = "url(/images/music-btn-open.png)";
	} else {
		audio.pause();
		document.getElementById("musicImage").style.backgroundImage = "url(/images/music-btn-close.png)";
	}
}

var checkPhone = function(a) {
	var patrn = /^((?:13|15|18|14|17)\d{9}|0(?:10|2\d|[3-9]\d{2})[1-9]\d{6,7})$/;
	if(!patrn.exec(a)) return false;
	return true;
};

function za() {
	/*	egg vibrates 2 seconds */
	var str = $("#phone").val();
	var path = location.pathname.slice(9).split('.')[0];
	if(str.length == 11 && checkPhone(str)) {
		$(".jindan").addClass("jindan1");
		setTimeout(function() {
			$(".jindan").removeClass("jindan1");
		}, 1200);

		$(".jinguang1").fadeIn(300);
		$(".jinguang2").fadeIn(600);
		$(".jinguang3").fadeIn(900);
		$(".jinguang5").fadeIn(1200);
		$.get('/lottery', {
			phone: str,
			path: path
		}, function(data, status) {
			console.log(data);
			$('#phone').hide();
			$('#sub').hide();
			if(data.type == true) {
				var text = "<div class='tongzhi'>" + "恭喜你抽取" + data.lotto.name + ": " + "<br>" + data.lotto.value + "<br>"
				+ data.mark;
				$('#zajindan').append(text);
			} else {
				var text = "<div class='tongzhi'>" + data.message;
				$('#zajindan').append(text);
			}
		});
	} else {
		alert("请输入正确的手机号！")
	}

}