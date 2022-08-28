/**
 * 存储localStorage
 */
export const setStore = (name, content) => {
	if (!name) return;
	if (typeof content !== 'string') {
		content = JSON.stringify(content);
	}
	window.localStorage.setItem(name, content);
}

/**
 * 获取localStorage
 */
export const getStore = name => {
	if (!name) return;
	return window.localStorage.getItem(name);
}

/**
 * 删除localStorage
 */
export const removeStore = name => {
	if (!name) return;
	window.localStorage.removeItem(name);
}

/**
 * 获取style样式
 */
export const getStyle = (element, attr, NumberMode = 'int') => {
    let target;
    // scrollTop 获取方式不同，没有它不属于style，而且只有document.body才能用
    if (attr === 'scrollTop') { 
        target = element.scrollTop;
    }else if(element.currentStyle){
        target = element.currentStyle[attr]; 
    }else{ 
        target = document.defaultView.getComputedStyle(element,null)[attr]; 
    }
    //在获取 opactiy 时需要获取小数 parseFloat
    return  NumberMode == 'float'? parseFloat(target) : parseInt(target);
} 

/**
 * 页面到达底部，加载更多
 */
export const loadMore = (element, callback) => {
	let windowHeight = window.screen.height;
	let height;
	let setTop;
	let paddingBottom;
	let marginBottom;
    let requestFram;
    let oldScrollTop;

    document.body.addEventListener('scroll',() => {
       loadMore();
    }, false)
    //运动开始时获取元素 高度 和 offseTop, pading, margin
	element.addEventListener('touchstart',() => {
        height = element.offsetHeight;
        setTop = element.offsetTop;
        paddingBottom = getStyle(element,'paddingBottom');
        marginBottom = getStyle(element,'marginBottom');
    },{passive: true})

    //运动过程中保持监听 scrollTop 的值判断是否到达底部
    element.addEventListener('touchmove',() => {
       loadMore();
    },{passive: true})

    //运动结束时判断是否有惯性运动，惯性运动结束判断是非到达底部
    element.addEventListener('touchend',() => {
       	oldScrollTop = document.body.scrollTop;
       	moveEnd();
    },{passive: true})
    
    const moveEnd = () => {
        requestFram = requestAnimationFrame(() => {
            if (document.body.scrollTop != oldScrollTop) {
                oldScrollTop = document.body.scrollTop;
                loadMore();
                moveEnd();
            }else{
            	cancelAnimationFrame(requestFram);
            	//为了防止鼠标抬起时已经渲染好数据从而导致重获取数据，应该重新获取dom高度
            	height = element.offsetHeight;
                loadMore();
            }
        })
    }

    const loadMore = () => {
        if (document.body.scrollTop + windowHeight >= height + setTop + paddingBottom + marginBottom) {
            callback();
        }
    }
}

/**
 * 显示返回顶部按钮，开始、结束、运动 三个过程中调用函数判断是否达到目标点
 */
export const showBack = callback => {
    let requestFram;
    let oldScrollTop;

    document.addEventListener('scroll',() => {
       showBackFun();
    }, false)
    document.addEventListener('touchstart',() => {
       showBackFun();
    },{passive: true})

    document.addEventListener('touchmove',() => {
       showBackFun();
    },{passive: true})

    document.addEventListener('touchend',() => {
        oldScrollTop = document.body.scrollTop;
        moveEnd();
    },{passive: true})
    
    const moveEnd = () => {
        requestFram = requestAnimationFrame(() => {
            if (document.body.scrollTop != oldScrollTop) {
                oldScrollTop = document.body.scrollTop;
                moveEnd();
            }else{
                cancelAnimationFrame(requestFram);
            }
            showBackFun();
        })
    }

    //判断是否达到目标点
    const showBackFun = () => {
        if (document.body.scrollTop > 500) {
            callback(true);
        }else{
            callback(false);
        }
    }
}


/**
 * 运动效果
 * @param {HTMLElement} element   运动对象，必选
 * @param {JSON}        target    属性：目标值，必选
 * @param {number}      duration  运动时间，可选
 * @param {string}      mode      运动模式，可选
 * @param {function}    callback  可选，回调函数，链式动画
 */
export const animate = (element, target, duration = 400, mode = 'ease-out', callback) => {
    clearInterval(element.timer);

    //判断不同参数的情况
    if (duration instanceof Function) {
        callback = duration;
        duration = 400;
    }else if(duration instanceof String){
        mode = duration;
        duration = 400;
    }

    //判断不同参数的情况
    if (mode instanceof Function) {
        callback = mode;
        mode = 'ease-out';
    }

    //获取dom样式
    const attrStyle = attr => {
        if (attr === "opacity") { 
            return Math.round(getStyle(element, attr, 'float') * 100);
        } else {
            return getStyle(element, attr);
        }
    }
    //根字体大小，需要从此将 rem 改成 px 进行运算
    const rootSize = parseFloat(document.documentElement.style.fontSize);

    const unit = {};
    const initState = {};

    //获取目标属性单位和初始样式值
    Object.keys(target).forEach(attr => {
        if (/[^\d^\.]+/gi.test(target[attr])) {
            unit[attr] = target[attr].match(/[^\d^\.]+/gi)[0] || 'px';
        }else{
            unit[attr] = 'px';
        }
        initState[attr] = attrStyle(attr);
    });

    //去掉传入的后缀单位
    Object.keys(target).forEach(attr => {
        if (unit[attr] == 'rem') {
            target[attr] = Math.ceil(parseInt(target[attr])*rootSize);
        }else{
            target[attr] = parseInt(target[attr]);
        }
    });


    let flag = true; //假设所有运动到达终点
    const remberSpeed = {};//记录上一个速度值,在ease-in模式下需要用到
    element.timer = setInterval(() => {
        Object.keys(target).forEach(attr => {
            let iSpeed = 0;  //步长
            let status = false; //是否仍需运动
            let iCurrent = attrStyle(attr) || 0; //当前元素属性址
            let speedBase = 0; //目标点需要减去的基础值，三种运动状态的值都不同
            let intervalTime; //将目标值分为多少步执行，数值越大，步长越小，运动时间越长
            switch(mode){
                case 'ease-out': 
                    speedBase = iCurrent;
                    intervalTime = duration*5/400;
                    break;
                case 'linear':
                    speedBase = initState[attr];
                    intervalTime = duration*20/400;
                    break;
                case 'ease-in':
                    let oldspeed = remberSpeed[attr] || 0;
                    iSpeed = oldspeed + (target[attr] - initState[attr])/duration;
                    remberSpeed[attr] = iSpeed
                    break;
                default:
                    speedBase = iCurrent;
                    intervalTime = duration*5/400; 
            }
            if (mode !== 'ease-in') {
                iSpeed = (target[attr] - speedBase) / intervalTime;
                iSpeed = iSpeed > 0 ? Math.ceil(iSpeed) : Math.floor(iSpeed);
            }
            //判断是否达步长之内的误差距离，如果到达说明到达目标点
            switch(mode){
                case 'ease-out': 
                    status = iCurrent != target[attr]; 
                    break;
                case 'linear':
                    status = Math.abs(Math.abs(iCurrent) - Math.abs(target[attr])) > Math.abs(iSpeed);
                    break;
                case 'ease-in':
                    status = Math.abs(Math.abs(iCurrent) - Math.abs(target[attr])) > Math.abs(iSpeed);
                    break;
                default:
                    status = iCurrent != target[attr]; 
            }

            if (status) {
                flag = false; 
                //opacity 和 scrollTop 需要特殊处理
                if (attr === "opacity") {
                    element.style.filter = "alpha(opacity:" + (iCurrent + iSpeed) + ")";
                    element.style.opacity = (iCurrent + iSpeed) / 100;
                } else if (attr === 'scrollTop') {
                    element.scrollTop = iCurrent + iSpeed;
                }else{
                    element.style[attr] = iCurrent + iSpeed + 'px';
                }
            } else {
                flag = true;
            }

            if (flag) {
                clearInterval(element.timer);
                if (callback) {
                    callback();
                }
            }
        })
    }, 20);
}


/**
 * 深度克隆
 * @param {object} obj  要克隆的对象或者值
 * 检测非object和null，直接返回
 * 检测RegExp类型，返回一个新的正则对象
 * 检测Map类型，返回一个新的Map类型，值相同
 * 检测Set类型，返回一个新的Set类型，值相同
 * 检测Object，array，通过迭代方式给新的对象赋值，循环deepclone
 */
export const deepclone = (obj) => {
    if(typeof obj !== 'object' || !obj) return obj;
    let result = null;
    if(obj instanceof RegExp){
        result = new RegExp(obj);
        return result;
    }else if(obj instanceof Map){
        result = new Map();
        obj.forEach((item, key) => {
            result.set(key, item);
        });
        return result;
    } else if(obj instanceof Set) {
        result = new Set();
        obj.forEach((item, index) => {
            result.add(item);
        });
        return result;
    } else {
        result = new obj.constructor();
        for(let i in obj) {
            result[i] = deepclone(obj[i]);
        }
        return result;
    }
    return result;
}

/**
 * JSON.stringify的克隆
 */

export const jsonstringify = (data) => {
    // 确认一个对象是否存在循环引用
    const isCyclic = (obj) => {
    // 使用Set数据类型来存储已经检测过的对象
        let stackSet = new Set()
        let detected = false
    
        const detect = (obj) => {
            // 不是对象类型的话，可以直接跳过
            if (obj && typeof obj != 'object') {
                return
            }
            // 当要检查的对象已经存在于stackSet中时，表示存在循环引用
            if (stackSet.has(obj)) {
                return detected = true
            }
            // 将当前obj存如stackSet
            stackSet.add(obj)
        
            for (let key in obj) {
                // 对obj下的属性进行挨个检测
                if (obj.hasOwnProperty(key)) {
                    detect(obj[key])
                }
            }
            // 平级检测完成之后，将当前对象删除，防止误判
            /*
                例如：对象的属性指向同一引用，如果不删除的话，会被认为是循环引用
                let tempObj = {
                name: '前端胖头鱼'
                }
                let obj4 = {
                obj1: tempObj,
                obj2: tempObj
                }
            */
            stackSet.delete(obj)
        }
    
        detect(obj)
    
        return detected
    }
  
    // 特性七:
    // 对包含循环引用的对象（对象之间相互引用，形成无限循环）执行此方法，会抛出错误。
    if (isCyclic(data)) {
      throw new TypeError('Converting circular structure to JSON')
    }
  
    // 特性九:
    // 当尝试去转换 BigInt 类型的值会抛出错误
    if (typeof data === 'bigint') {
      throw new TypeError('Do not know how to serialize a BigInt')
    }
  
    const type = typeof data
    const commonKeys1 = ['undefined', 'function', 'symbol']
    const getType = (s) => {
      return Object.prototype.toString.call(s).replace(/\[object (.*?)\]/, '$1').toLowerCase()
    }
  
    // 非对象
    if (type !== 'object' || data === null) {
      let result = data
      // 特性四：
      // NaN 和 Infinity 格式的数值及 null 都会被当做 null。
      if ([NaN, Infinity, null].includes(data)) {
        result = 'null'
        // 特性一：
        // `undefined`、`任意的函数`以及`symbol值`被`单独转换`时，会返回 undefined
      } else if (commonKeys1.includes(type)) {
        // 直接得到undefined，并不是一个字符串'undefined'
        return undefined
      } else if (type === 'string') {
        result = '"' + data + '"'
      }
  
      return String(result)
    } else if (type === 'object') {
      // 特性五:
      // 转换值如果有 toJSON() 方法，该方法定义什么值将被序列化
      // 特性六:
      // Date 日期调用了 toJSON() 将其转换为了 string 字符串（同Date.toISOString()），因此会被当做字符串处理。
      if (typeof data.toJSON === 'function') {
        return jsonstringify(data.toJSON())
      } else if (Array.isArray(data)) {
        let result = data.map((it) => {
          // 特性一:
          // `undefined`、`任意的函数`以及`symbol值`出现在`数组`中时会被转换成 `null`
          return commonKeys1.includes(typeof it) ? 'null' : jsonstringify(it)
        })
  
        return `[${result}]`.replace(/'/g, '"')
      } else {
        // 特性二：
        // 布尔值、数字、字符串的包装对象在序列化过程中会自动转换成对应的原始值。
        if (['boolean', 'number'].includes(getType(data))) {
          return String(data)
        } else if (getType(data) === 'string') {
          return '"' + data + '"'
        } else {
          let result = []
          // 特性八
          // 其他类型的对象，包括 Map/Set/WeakMap/WeakSet，仅会序列化可枚举的属性
          Object.keys(data).forEach((key) => {
            // 特性三:
            // 所有以symbol为属性键的属性都会被完全忽略掉，即便 replacer 参数中强制指定包含了它们。
            if (typeof key !== 'symbol') {
              const value = data[key]
              // 特性一
              // `undefined`、`任意的函数`以及`symbol值`，出现在`非数组对象`的属性值中时在序列化过程中会被忽略
              if (!commonKeys1.includes(typeof value)) {
                result.push(`"${key}":${jsonstringify(value)}`)
              }
            }
          })
  
          return `{${result}}`.replace(/'/, '"')
        }
      }
    }
  }
