/**
 * Copyright (c) 2014 Nguyen Hong Khanh
 * Copyright (c) 2014 ezgoing
 * Released under the MIT license
 * https://github.com/hongkhanh/cropbox/blob/master/LICENSE
 */
'use strict';
var cropbox = function(options){
    var el = document.querySelector(options.imageBox),
    obj =
    {
        state : {},
        ratio : 1,
		touchmove_bar : 0,//追加
		touchstart_bar : 0,//追加
        options : options,
        imageBox : el,
        thumbBox : el.querySelector(options.thumbBox),
        spinner : el.querySelector(options.spinner),
        image : new Image(),
        getDataURL: function ()
        {
            var width = this.thumbBox.clientWidth,
                height = this.thumbBox.clientHeight,
                canvas = document.createElement("canvas"),
                dim = el.style.backgroundPosition.split(' '),
                size = el.style.backgroundSize.split(' '),
                dx = parseInt(dim[0]) - el.clientWidth/2 + width/2,
                dy = parseInt(dim[1]) - el.clientHeight/2 + height/2,
                dw = parseInt(size[0]),
                dh = parseInt(size[1]),
                sh = parseInt(this.image.height),
                sw = parseInt(this.image.width);

            canvas.width = width;
            canvas.height = height;
            var context = canvas.getContext("2d");
            context.drawImage(this.image, 0, 0, sw, sh, dx, dy, dw, dh);
            var imageData = canvas.toDataURL('image/png');
            return imageData;
        },
        getBlob: function()
        {
            var imageData = this.getDataURL();
            var b64 = imageData.replace('data:image/png;base64,','');
            var binary = atob(b64);
            var array = [];
            for (var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return  new Blob([new Uint8Array(array)], {type: 'image/png'});
        },
        zoomIn: function ()
        {
            this.ratio*=1.1;
            setBackground();
        },
        zoomOut: function ()
        {
            this.ratio*=0.9;
            setBackground();
        }
    },
    attachEvent = function(node, event, cb)
    {
        if (node.attachEvent)
            node.attachEvent('on'+event, cb);
        else if (node.addEventListener)
            node.addEventListener(event, cb);
    },
    detachEvent = function(node, event, cb)
    {
        if(node.detachEvent) {
            node.detachEvent('on'+event, cb);
        }
        else if(node.removeEventListener) {
            node.removeEventListener(event, render);
        }
    },
    stopEvent = function (e) {
        if(window.event) e.cancelBubble = true;
        else e.stopImmediatePropagation();
    },
    setBackground = function()
    {
        var w =  parseInt(obj.image.width)*obj.ratio;
        var h =  parseInt(obj.image.height)*obj.ratio;

        var pw = (el.clientWidth - w) / 2;
        var ph = (el.clientHeight - h) / 2;

        el.setAttribute('style',
                'background-image: url(' + obj.image.src + '); ' +
                'background-size: ' + w +'px ' + h + 'px; ' +
                'background-position: ' + pw + 'px ' + ph + 'px; ' +
                'background-repeat: no-repeat');
    },
    imgMouseDown = function(e)
    {
        stopEvent(e);

        obj.state.dragable = true;
        obj.state.mouseX = e.clientX;
        obj.state.mouseY = e.clientY;
    },
    imgMouseMove = function(e)
    {
        stopEvent(e);

        if (obj.state.dragable)
        {
            var x = e.clientX - obj.state.mouseX;
            var y = e.clientY - obj.state.mouseY;

            var bg = el.style.backgroundPosition.split(' ');

            var bgX = x + parseInt(bg[0]);
            var bgY = y + parseInt(bg[1]);

            el.style.backgroundPosition = bgX +'px ' + bgY + 'px';

            obj.state.mouseX = e.clientX;
            obj.state.mouseY = e.clientY;
        }
    },
    imgMouseUp = function(e)
    {
        stopEvent(e);
        obj.state.dragable = false;
    },
    zoomImage = function(e)
    {
        var evt=window.event || e;
        var delta=evt.detail? evt.detail*(-120) : evt.wheelDelta;
        delta > -120 ? obj.ratio*=1.1 : obj.ratio*=0.9;
        setBackground();
    },
	///////////////////////////////////////////////////////////////ここに追加（ひとつ前のカンマも追加）
	imgTouchstart = function(e)
    {
		if(e.touches.length > 1){
			this.touchstart_bar =Math.abs(e.touches[1].pageX - e.touches[0].pageX)*Math.abs(e.touches[1].pageY - e.touches[0].pageY);
		}
		else{
			stopEvent(e);
			obj.state.dragable = true;
			obj.state.mouseX = e.touches[0].pageX;
			obj.state.mouseY = e.touches[0].pageY;
		}
    },
    imgTouchmove = function(e)
    {
		if(e.touches.length > 1){
			this.touchmove_bar = Math.abs(e.touches[1].pageX - e.touches[0].pageX)*Math.abs(e.touches[1].pageY - e.touches[0].pageY);
			var kekka = this.touchstart_bar-this.touchmove_bar;
			kekka<0 ? obj.ratio*=1.1 : obj.ratio*=0.9;
			setBackground();
		}
		else{
			stopEvent(e);
	
			if (obj.state.dragable)
			{
				var x = e.touches[0].pageX - obj.state.mouseX;
				var y = e.touches[0].pageY - obj.state.mouseY;
	
				var bg = el.style.backgroundPosition.split(' ');
	
				var bgX = x + parseInt(bg[0]);
				var bgY = y + parseInt(bg[1]);
	
				el.style.backgroundPosition = bgX +'px ' + bgY + 'px';
	
				obj.state.mouseX = e.touches[0].pageX;
				obj.state.mouseY = e.touches[0].pageY;
			}
			
		}
    },
	imgTouchend = function(e)
    {
		if(e.touches.length == 1){
			 stopEvent(e);
       		 obj.state.dragable = false;
		}
    }
    
	///////////////////////////////////////////////////////////////ここまで追加

    obj.spinner.style.display = 'block';
    obj.image.onload = function() {
        obj.spinner.style.display = 'none';
        setBackground();

        attachEvent(el, 'mousedown', imgMouseDown);
        attachEvent(el, 'mousemove', imgMouseMove);
        attachEvent(document.body, 'mouseup', imgMouseUp);
        var mousewheel = (/Firefox/i.test(navigator.userAgent))? 'DOMMouseScroll' : 'mousewheel';
        attachEvent(el, mousewheel, zoomImage);
		
		// 2本指だったらAndroidではgesturestartは使えない
		// attachEvent(el, 'touchstart', imgTouchstart,false);
		attachEvent(el, 'touchstart', imgTouchstart);
		attachEvent(el, 'touchmove', imgTouchmove);
		attachEvent(el, 'touchend', imgTouchend);
		

    };
    obj.image.src = options.imgSrc;
    attachEvent(el, 'DOMNodeRemoved', function(){detachEvent(document.body, 'DOMNodeRemoved', imgMouseUp)});

    return obj;
};
