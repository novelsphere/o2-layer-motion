/* global $ Tag TagAction renderer */
(function() {
	var Point = function(value, duration, acceleration) {
		this.value = value;
		this.duration = duration;
		this.acceleration = acceleration;
	};
	Point.fromString = function(string) {
		string = string.replace("(", "").replace(")", "");
		var parts = string.split(',');
		if (parts.length == 3) {
			return new Point(
				parseFloat(parts[0]),
				parseFloat(parts[1]),
				parseFloat(parts[2])
			);
		}
		return null;
	};

	let Interpolation = function(points) {
		this.points = points;
		this.totalDuration = points.reduce(function(duration, thisPoint) {
			return duration + thisPoint.duration;
		}, 0);
	};

	Interpolation.prototype.getCurrentValue = function(start) {
		if (!this.totalDuration) {
			return 0;
		}

		var timePassed = Date.now() - start;
		timePassed = timePassed % this.totalDuration;

		var accumulatedDuration = 0;
		for (var i = 1; i < this.points.length; i++) {
			if (accumulatedDuration + this.points[i].duration > timePassed) {
				break;
			} else {
				accumulatedDuration += this.points[i].duration;
			}
		}
		var thisPoint = this.points[i],
			prevPoint = this.points[i - 1];
		if (!thisPoint) {
			thisPoint = this.points[this.points.length - 1];
		}
		var percentage = (timePassed - accumulatedDuration) / thisPoint.duration;

		if (thisPoint.acceleration > 1) {  // 下弦(最初遅く徐々に早く)
			percentage = Math.pow(percentage, thisPoint.acceleration);

		} else if (thisPoint.acceleration < -1) {	// 上弦(最初早く徐々に遅く)
			percentage = 1.0 - percentage;
			percentage = Math.pow(percentage, -thisPoint.acceleration);
			percentage = 1.0 - percentage;
		}
		return prevPoint.value + (thisPoint.value - prevPoint.value) * percentage;
	};

	var motionsData = {};
	var MotionData = function() {
		this.xMotion = null;
		this.yMotion = null;
		this.loopX = 1;
		this.loopY = 1;
	};

	MotionData.prototype.getXValue = function(start) {
		if (!this.xMotion ||
			!this.xMotion.points.length) {
			return null;
		}
		return this.xMotion.getCurrentValue(start);
	};

	MotionData.prototype.getYValue = function(start) {
		if (!this.yMotion ||
			!this.yMotion.points.length) {
			return null;
		}
		return this.yMotion.getCurrentValue(start);
	};

	MotionData.prototype.getLastX = function() {
		if (!this.xMotion ||
			!this.xMotion.points.length) {
			return null;
		}
		var length = this.xMotion.points.length;
		return this.xMotion.points[length - 1].value;
	};

	MotionData.prototype.getLastY = function() {
		if (!this.yMotion ||
			!this.yMotion.points.length) {
			return null;
		}
		var length = this.yMotion.points.length;
		return this.yMotion.points[length - 1].value;
	};

	MotionData.prototype.getXLoopCount = function(start) {
		if (!this.xMotion.totalDuration) {
			return -1;
		}
		return Math.floor((Date.now() - start) / this.xMotion.totalDuration);
	};

	MotionData.prototype.getYLoopCount = function(start) {
		if (!this.yMotion.totalDuration) {
			return -1;
		}
		return Math.floor((Date.now() - start) / this.yMotion.totalDuration);
	};

	var motions = [];
	var Motion = function(data, layer) {
		this.beginning = Date.now();
		this.data = data;

		this.layer = layer;
		this.initX = layer.rect.x;
		this.initY = layer.rect.y;

		this.loopX = this.data.loopX;
		this.loopY = this.data.loopY;

		this.loopXCount = 0;
		this.loopYCount = 0;

		this.finish = false;
	};

	Motion.prototype.start = function() {
		this.beginning = Date.now();
		this.animate();
	};

	Motion.prototype.stop = function() {
		let index = motions.indexOf(this);
		if (index > -1) {
			motions.splice(index, 1);
		}
		this.finish = true;
	};

	Motion.prototype.animate = function() {

		var xCount = this.data.getXLoopCount(this.beginning),
			yCount = this.data.getYLoopCount(this.beginning);

		var xFinish = xCount == -1 /* xは移動しない */|| (this.loopX != 0/* 無限ループ */ && xCount >= this.loopX),
			yFinish = yCount == -1 /* yは移動しない */|| (this.loopY != 0/* 無限ループ */ && yCount >= this.loopY);

		// 元々のプラグインの方はなぜかモーションの終わりの座標を次のモーションの基準座標にする
		// たとえば(100,100,0) でloop=2だと、右に200移動する
		// なのでこれで適当にinitXを変わります
		if (this.loopXCount != xCount && (this.loopXCount < this.loopX || this.loopX == 0)) {
			this.loopXCount = xCount;
			this.initX += this.data.getLastX();
			if (xFinish) {
				this.layer.rect.x = this.initX;
			}
		}

		if (this.loopYCount != yCount && (this.loopYCount < this.loopY || this.loopY == 0)) {
			this.loopYCount = yCount;
			this.initY += this.data.getLastY();
			if (yFinish) {
				this.layer.rect.y = this.initY;
			}
		}

		if (!xFinish) {
			// xはまだ終わってない
			this.layer.rect.x = this.initX + this.data.getXValue(this.beginning);
		}

		if (!yFinish) {
			this.layer.rect.y = this.initY + this.data.getYValue(this.beginning);
		}

		if (!this.finish && (!xFinish || !yFinish)) {
			var _this = this;
			renderer.animator.requestFrame(function() {
				_this.animate();
			});
		} else {
			this.stop();
			$(this).trigger('stop');
		}
	};

	Tag.actions.motion_define = new TagAction({
		rules : {
			name    : {type:"STRING", required : true},
			locatex : {type:"STRING", defaultValue : ""},
			locatey : {type:"STRING", defaultValue : ""},
			loop    : {type:"INT", defaultValue : 1},
			loopx   : {type:"INT"},
			loopy   : {type:"INT"}
		},
		action : function(args) {

			var pointRegex = /\((-?[0-9,\s]+){3}\)/g;

			var xPoints = args.locatex.match(pointRegex);
			if (xPoints) {
				xPoints = xPoints.map(function(thisMatch) {
					return Point.fromString(thisMatch);
				});
			} else {
				xPoints = [];
			}
			xPoints.unshift(new Point(0, 0, 0));
			var xInterpolation = new Interpolation(xPoints);

			var yPoints = args.locatey.match(pointRegex);
			if (yPoints) {
				yPoints = yPoints.map(function(thisMatch) {
					return Point.fromString(thisMatch);
				});
			} else {
				yPoints = [];
			}
			yPoints.unshift(new Point(0, 0, 0));
			var yInterpolation = new Interpolation(yPoints);

			var motion = motionsData[args.name];
			if (!motion) {
				motion = motionsData[args.name] = new MotionData();
			}
			motion.xMotion = xInterpolation;
			motion.yMotion = yInterpolation;

			if ('loop' in args) {
				motion.loopX = motion.loopY = args.loop;
			}

			if ('loopx' in args) {
				motion.loopX = args.loopx;
			}

			if ('loopy' in args) {
				motion.loopY = args.loopy;
			}

			return 0;
		}
	});

	Tag.actions.motion_start = new TagAction({
		rules : {
			layer   : {type:"LAYER", defaultValue:0},
			page    : {type:/fore|back/, defaultValue:'fore'},
			name    : {type:"STRING", required: true},
			wait    : {type:"BOOLEAN"},
			canskip : {type:"BOOLEAN"},
			loopx   : {type:"INT"},
			loopy   : {type:"INT"},
			ix      : {type:"FLOAT"},
			iy      : {type:"FLOAT"}
		},
		action : function(args) {

			var layer = args.layer[args.page];
			var data = motionsData[args.name];

			var newMotion = new Motion(data, layer);

			if ('loopx' in args) {
				newMotion.loopX = args.loopx;
			}

			if ('loopy' in args) {
				newMotion.loopY = args.loopy;
			}

			if ('ix' in args) {
				newMotion.initX = args.ix;
			}

			if ('iy' in args) {
				newMotion.initY = args.iy;
			}

			newMotion.start();
			motions.push(newMotion);

			if (args.wait) {
				var _this = this,
					ended = false;
				$(newMotion).one('stop', function() {
					if (!ended) {
						_this.done();
					}
				});

				if (args.canskip) {
					this.conductor.wait('click', function() {
						ended = true;
						newMotion.stop();
					});
				}

				return 1;
			}

			return 0;
		}
	});

	Tag.actions.motion_stop = new TagAction({
		rules : {
			layer   : {type:"LAYER", defaultValue : 0},
			page    : {type:/fore|back/, defaultValue : "fore"},
			name    : {type:"STRING", required : true},
			lastpos : {type:"BOOLEAN", defaultValue : true}
		},
		action : function(args) {

			motions.forEach(function(thisMotion) {
				if (thisMotion.data == motionsData[args.name] &&
					thisMotion.layer == args.layer[args.page]) {

					thisMotion.stop();

					if (args.lastpos) {
						var lastX = thisMotion.data.getLastX(),
							lastY = thisMotion.data.getLastY();
						if (lastX !== null) {
							thisMotion.layer.rect.x = lastX;
						}
						if (lastY !== null) {
							thisMotion.layer.rect.y = lastY;
						}
					}
				}
			});

			return 0;
		}
	});
})();