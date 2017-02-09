/**
 * Extend jquery with a scrollspy plugin.
 * This watches the window scroll and fires events when elements are scrolled into viewport.
 *
 * throttle() and getTime() taken from Underscore.js
 * https://github.com/jashkenas/underscore
 *
 * @author Copyright 2013 John Smart
 * @license https://raw.github.com/thesmart/jquery-scrollspy/master/LICENSE
 * @see https://github.com/thesmart
 * @version 0.1.2
 */
(function($) {

  var jWindow = $(window);
  var elements = [];
  var elementsInView = [];
  var isSpying = false;
  var ticks = 0;
  var unique_id = 1;
  var offset = {
    top : 0,
    right : 0,
    bottom : 0,
    left : 0,
  }

  /**
   * Find elements that are within the boundary
   * @param {number} top
   * @param {number} right
   * @param {number} bottom
   * @param {number} left
   * @return {jQuery}   A collection of elements
   */
  function findElements(top, right, bottom, left) {
    var hits = $();
    $.each(elements, function(i, element) {
      if (element.height() > 0) {
        var elTop = element.offset().top,
          elLeft = element.offset().left,
          elRight = elLeft + element.width(),
          elBottom = elTop + element.height();

        var isIntersect = !(elLeft > right ||
          elRight < left ||
          elTop > bottom ||
          elBottom < top);

        if (isIntersect) {
          hits.push(element);
        }
      }
    });

    return hits;
  }


  /**
   * Called when the user scrolls the window
   */
  function onScroll(scrollOffset) {
    // unique tick id
    ++ticks;

    // viewport rectangle
    var top = jWindow.scrollTop(),
      left = jWindow.scrollLeft(),
      right = left + jWindow.width(),
      bottom = top + jWindow.height();

    // determine which elements are in view
    var intersections = findElements(top+offset.top + scrollOffset || 200, right+offset.right, bottom+offset.bottom, left+offset.left);
    $.each(intersections, function(i, element) {

      var lastTick = element.data('scrollSpy:ticks');
      if (typeof lastTick != 'number') {
        // entered into view
        element.triggerHandler('scrollSpy:enter');
      }

      // update tick id
      element.data('scrollSpy:ticks', ticks);
    });

    // determine which elements are no longer in view
    $.each(elementsInView, function(i, element) {
      var lastTick = element.data('scrollSpy:ticks');
      if (typeof lastTick == 'number' && lastTick !== ticks) {
        // exited from view
        element.triggerHandler('scrollSpy:exit');
        element.data('scrollSpy:ticks', null);
      }
    });

    // remember elements in view for next tick
    elementsInView = intersections;
  }

  /**
   * Called when window is resized
  */
  function onWinSize() {
    jWindow.trigger('scrollSpy:winSize');
  }

  /**
   * Get time in ms
   * @license https://raw.github.com/jashkenas/underscore/master/LICENSE
   * @type {function}
   * @return {number}
   */
  var getTime = (Date.now || function () {
    return new Date().getTime();
  });

  /**
   * Returns a function, that, when invoked, will only be triggered at most once
   * during a given window of time. Normally, the throttled function will run
   * as much as it can, without ever going more than once per `wait` duration;
   * but if you'd like to disable the execution on the leading edge, pass
   * `{leading: false}`. To disable execution on the trailing edge, ditto.
   * @license https://raw.github.com/jashkenas/underscore/master/LICENSE
   * @param {function} func
   * @param {number} wait
   * @param {Object=} options
   * @returns {Function}
   */
  function throttle(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function () {
      previous = options.leading === false ? 0 : getTime();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function () {
      var now = getTime();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  /**
   * Enables ScrollSpy using a selector
   * @param {jQuery|string} selector  The elements collection, or a selector
   * @param {Object=} options Optional.
        throttle : number -> scrollspy throttling. Default: 100 ms
        offsetTop : number -> offset from top. Default: 0
        offsetRight : number -> offset from right. Default: 0
        offsetBottom : number -> offset from bottom. Default: 0
        offsetLeft : number -> offset from left. Default: 0
   * @returns {jQuery}
   */
  $.scrollSpy = function(selector, options) {
    var defaults = {
      throttle: 100,
      scrollOffset: 200 // offset - 200 allows elements near bottom of page to scroll
    };
    options = $.extend(defaults, options);

    var visible = [];
    selector = $(selector);
    selector.each(function(i, element) {
      elements.push($(element));
      $(element).data("scrollSpy:id", i);
      // Smooth scroll to section
      $('a[href="#' + $(element).attr('id') + '"]').click(function(e) {
        e.preventDefault();
        var offset = $(this.hash).offset().top + 1;
        $('html, body').animate({ scrollTop: offset - options.scrollOffset }, {duration: 400, queue: false, easing: 'easeOutCubic'});
      });
    });

    offset.top = options.offsetTop || 0;
    offset.right = options.offsetRight || 0;
    offset.bottom = options.offsetBottom || 0;
    offset.left = options.offsetLeft || 0;

    var throttledScroll = throttle(function() {
      onScroll(options.scrollOffset);
    }, options.throttle || 100);
    var readyScroll = function(){
      $(document).ready(throttledScroll);
    };

    if (!isSpying) {
      jWindow.on('scroll', readyScroll);
      jWindow.on('resize', readyScroll);
      isSpying = true;
    }

    // perform a scan once, after current execution context, and after dom is ready
    setTimeout(readyScroll, 0);


    selector.on('scrollSpy:enter', function() {
      visible = $.grep(visible, function(value) {
        return value.height() != 0;
      });

      var $this = $(this);

      if (visible[0]) {
        $('a[href="#' + visible[0].attr('id') + '"]').removeClass('active');
        if ($this.data('scrollSpy:id') < visible[0].data('scrollSpy:id')) {
          visible.unshift($(this));
        }
        else {
          visible.push($(this));
        }
      }
      else {
        visible.push($(this));
      }


      $('a[href="#' + visible[0].attr('id') + '"]').addClass('active');
    });
    selector.on('scrollSpy:exit', function() {
      visible = $.grep(visible, function(value) {
        return value.height() != 0;
      });

      if (visible[0]) {
        $('a[href="#' + visible[0].attr('id') + '"]').removeClass('active');
        var $this = $(this);
        visible = $.grep(visible, function(value) {
          return value.attr('id') != $this.attr('id');
        });
        if (visible[0]) { // Check if empty
          $('a[href="#' + visible[0].attr('id') + '"]').addClass('active');
        }
      }
    });

    return selector;
  };

  /**
   * Listen for window resize events
   * @param {Object=} options           Optional. Set { throttle: number } to change throttling. Default: 100 ms
   * @returns {jQuery}    $(window)
   */
  $.winSizeSpy = function(options) {
    $.winSizeSpy = function() { return jWindow; }; // lock from multiple calls
    options = options || {
      throttle: 100
    };
    return jWindow.on('resize', throttle(onWinSize, options.throttle || 100));
  };

  /**
   * Enables ScrollSpy on a collection of elements
   * e.g. $('.scrollSpy').scrollSpy()
   * @param {Object=} options Optional.
                      throttle : number -> scrollspy throttling. Default: 100 ms
                      offsetTop : number -> offset from top. Default: 0
                      offsetRight : number -> offset from right. Default: 0
                      offsetBottom : number -> offset from bottom. Default: 0
                      offsetLeft : number -> offset from left. Default: 0
   * @returns {jQuery}
   */
  $.fn.scrollSpy = function(options) {
    return $.scrollSpy($(this), options);
  };

})(jQuery);

/*!
 * Waves v0.7.5
 * http://fian.my.id/Waves
 *
 * Copyright 2014-2016 Alfiana E. Sibuea and other contributors
 * Released under the MIT license
 * https://github.com/fians/Waves/blob/master/LICENSE
 */

;(function(window, factory) {
    'use strict';

    // AMD. Register as an anonymous module.  Wrap in function so we have access
    // to root via `this`.
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return factory.apply(window);
        });
    }

    // Node. Does not work with strict CommonJS, but only CommonJS-like
    // environments that support module.exports, like Node.
    else if (typeof exports === 'object') {
        module.exports = factory.call(window);
    }

    // Browser globals.
    else {
        window.Waves = factory.call(window);
    }
})(typeof global === 'object' ? global : this, function() {
    'use strict';

    var Waves            = Waves || {};
    var $$               = document.querySelectorAll.bind(document);
    var toString         = Object.prototype.toString;
    var isTouchAvailable = 'ontouchstart' in window;


    // Find exact position of element
    function isWindow(obj) {
        return obj !== null && obj === obj.window;
    }

    function getWindow(elem) {
        return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
    }

    function isObject(value) {
        var type = typeof value;
        return type === 'function' || type === 'object' && !!value;
    }

    function isDOMNode(obj) {
        return isObject(obj) && obj.nodeType > 0;
    }

    function getWavesElements(nodes) {
        var stringRepr = toString.call(nodes);

        if (stringRepr === '[object String]') {
            return $$(nodes);
        } else if (isObject(nodes) && /^\[object (Array|HTMLCollection|NodeList|Object)\]$/.test(stringRepr) && nodes.hasOwnProperty('length')) {
            return nodes;
        } else if (isDOMNode(nodes)) {
            return [nodes];
        }

        return [];
    }

    function offset(elem) {
        var docElem, win,
            box = { top: 0, left: 0 },
            doc = elem && elem.ownerDocument;

        docElem = doc.documentElement;

        if (typeof elem.getBoundingClientRect !== typeof undefined) {
            box = elem.getBoundingClientRect();
        }
        win = getWindow(doc);
        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    function convertStyle(styleObj) {
        var style = '';

        for (var prop in styleObj) {
            if (styleObj.hasOwnProperty(prop)) {
                style += (prop + ':' + styleObj[prop] + ';');
            }
        }

        return style;
    }

    var Effect = {

        // Effect duration
        duration: 750,

        // Effect delay (check for scroll before showing effect)
        delay: 200,

        show: function(e, element, velocity) {

            // Disable right click
            if (e.button === 2) {
                return false;
            }

            element = element || this;

            // Create ripple
            var ripple = document.createElement('div');
            ripple.className = 'waves-ripple waves-rippling';
            element.appendChild(ripple);

            // Get click coordinate and element width
            var pos       = offset(element);
            var relativeY = 0;
            var relativeX = 0;
            // Support for touch devices
            if('touches' in e && e.touches.length) {
                relativeY   = (e.touches[0].pageY - pos.top);
                relativeX   = (e.touches[0].pageX - pos.left);
            }
            //Normal case
            else {
                relativeY   = (e.pageY - pos.top);
                relativeX   = (e.pageX - pos.left);
            }
            // Support for synthetic events
            relativeX = relativeX >= 0 ? relativeX : 0;
            relativeY = relativeY >= 0 ? relativeY : 0;

            var scale     = 'scale(' + ((element.clientWidth / 100) * 3) + ')';
            var translate = 'translate(0,0)';

            if (velocity) {
                translate = 'translate(' + (velocity.x) + 'px, ' + (velocity.y) + 'px)';
            }

            // Attach data to element
            ripple.setAttribute('data-hold', Date.now());
            ripple.setAttribute('data-x', relativeX);
            ripple.setAttribute('data-y', relativeY);
            ripple.setAttribute('data-scale', scale);
            ripple.setAttribute('data-translate', translate);

            // Set ripple position
            var rippleStyle = {
                top: relativeY + 'px',
                left: relativeX + 'px'
            };

            ripple.classList.add('waves-notransition');
            ripple.setAttribute('style', convertStyle(rippleStyle));
            ripple.classList.remove('waves-notransition');

            // Scale the ripple
            rippleStyle['-webkit-transform'] = scale + ' ' + translate;
            rippleStyle['-moz-transform'] = scale + ' ' + translate;
            rippleStyle['-ms-transform'] = scale + ' ' + translate;
            rippleStyle['-o-transform'] = scale + ' ' + translate;
            rippleStyle.transform = scale + ' ' + translate;
            rippleStyle.opacity = '1';

            var duration = e.type === 'mousemove' ? 2500 : Effect.duration;
            rippleStyle['-webkit-transition-duration'] = duration + 'ms';
            rippleStyle['-moz-transition-duration']    = duration + 'ms';
            rippleStyle['-o-transition-duration']      = duration + 'ms';
            rippleStyle['transition-duration']         = duration + 'ms';

            ripple.setAttribute('style', convertStyle(rippleStyle));
        },

        hide: function(e, element) {
            element = element || this;

            var ripples = element.getElementsByClassName('waves-rippling');

            for (var i = 0, len = ripples.length; i < len; i++) {
                removeRipple(e, element, ripples[i]);
            }

            if (isTouchAvailable) {
                element.removeEventListener('touchend', Effect.hide);
                element.removeEventListener('touchcancel', Effect.hide);
            }

            element.removeEventListener('mouseup', Effect.hide);
            element.removeEventListener('mouseleave', Effect.hide);
        }
    };

    /**
     * Collection of wrapper for HTML element that only have single tag
     * like <input> and <img>
     */
    var TagWrapper = {

        // Wrap <input> tag so it can perform the effect
        input: function(element) {

            var parent = element.parentNode;

            // If input already have parent just pass through
            if (parent.tagName.toLowerCase() === 'i' && parent.classList.contains('waves-effect')) {
                return;
            }

            // Put element class and style to the specified parent
            var wrapper       = document.createElement('i');
            wrapper.className = element.className + ' waves-input-wrapper';
            element.className = 'waves-button-input';

            // Put element as child
            parent.replaceChild(wrapper, element);
            wrapper.appendChild(element);

            // Apply element color and background color to wrapper
            var elementStyle    = window.getComputedStyle(element, null);
            var color           = elementStyle.color;
            var backgroundColor = elementStyle.backgroundColor;

            wrapper.setAttribute('style', 'color:' + color + ';background:' + backgroundColor);
            element.setAttribute('style', 'background-color:rgba(0,0,0,0);');

        },

        // Wrap <img> tag so it can perform the effect
        img: function(element) {

            var parent = element.parentNode;

            // If input already have parent just pass through
            if (parent.tagName.toLowerCase() === 'i' && parent.classList.contains('waves-effect')) {
                return;
            }

            // Put element as child
            var wrapper  = document.createElement('i');
            parent.replaceChild(wrapper, element);
            wrapper.appendChild(element);

        }
    };

    /**
     * Hide the effect and remove the ripple. Must be
     * a separate function to pass the JSLint...
     */
    function removeRipple(e, el, ripple) {

        // Check if the ripple still exist
        if (!ripple) {
            return;
        }

        ripple.classList.remove('waves-rippling');

        var relativeX = ripple.getAttribute('data-x');
        var relativeY = ripple.getAttribute('data-y');
        var scale     = ripple.getAttribute('data-scale');
        var translate = ripple.getAttribute('data-translate');

        // Get delay beetween mousedown and mouse leave
        var diff = Date.now() - Number(ripple.getAttribute('data-hold'));
        var delay = 350 - diff;

        if (delay < 0) {
            delay = 0;
        }

        if (e.type === 'mousemove') {
            delay = 150;
        }

        // Fade out ripple after delay
        var duration = e.type === 'mousemove' ? 2500 : Effect.duration;

        setTimeout(function() {

            var style = {
                top: relativeY + 'px',
                left: relativeX + 'px',
                opacity: '0',

                // Duration
                '-webkit-transition-duration': duration + 'ms',
                '-moz-transition-duration': duration + 'ms',
                '-o-transition-duration': duration + 'ms',
                'transition-duration': duration + 'ms',
                '-webkit-transform': scale + ' ' + translate,
                '-moz-transform': scale + ' ' + translate,
                '-ms-transform': scale + ' ' + translate,
                '-o-transform': scale + ' ' + translate,
                'transform': scale + ' ' + translate
            };

            ripple.setAttribute('style', convertStyle(style));

            setTimeout(function() {
                try {
                    el.removeChild(ripple);
                } catch (e) {
                    return false;
                }
            }, duration);

        }, delay);
    }


    /**
     * Disable mousedown event for 500ms during and after touch
     */
    var TouchHandler = {

        /* uses an integer rather than bool so there's no issues with
         * needing to clear timeouts if another touch event occurred
         * within the 500ms. Cannot mouseup between touchstart and
         * touchend, nor in the 500ms after touchend. */
        touches: 0,

        allowEvent: function(e) {

            var allow = true;

            if (/^(mousedown|mousemove)$/.test(e.type) && TouchHandler.touches) {
                allow = false;
            }

            return allow;
        },
        registerEvent: function(e) {
            var eType = e.type;

            if (eType === 'touchstart') {

                TouchHandler.touches += 1; // push

            } else if (/^(touchend|touchcancel)$/.test(eType)) {

                setTimeout(function() {
                    if (TouchHandler.touches) {
                        TouchHandler.touches -= 1; // pop after 500ms
                    }
                }, 500);

            }
        }
    };


    /**
     * Delegated click handler for .waves-effect element.
     * returns null when .waves-effect element not in "click tree"
     */
    function getWavesEffectElement(e) {

        if (TouchHandler.allowEvent(e) === false) {
            return null;
        }

        var element = null;
        var target = e.target || e.srcElement;

        while (target.parentElement) {
            if ( (!(target instanceof SVGElement)) && target.classList.contains('waves-effect')) {
                element = target;
                break;
            }
            target = target.parentElement;
        }

        return element;
    }

    /**
     * Bubble the click and show effect if .waves-effect elem was found
     */
    function showEffect(e) {

        // Disable effect if element has "disabled" property on it
        // In some cases, the event is not triggered by the current element
        // if (e.target.getAttribute('disabled') !== null) {
        //     return;
        // }

        var element = getWavesEffectElement(e);

        if (element !== null) {

            // Make it sure the element has either disabled property, disabled attribute or 'disabled' class
            if (element.disabled || element.getAttribute('disabled') || element.classList.contains('disabled')) {
                return;
            }

            TouchHandler.registerEvent(e);

            if (e.type === 'touchstart' && Effect.delay) {

                var hidden = false;

                var timer = setTimeout(function () {
                    timer = null;
                    Effect.show(e, element);
                }, Effect.delay);

                var hideEffect = function(hideEvent) {

                    // if touch hasn't moved, and effect not yet started: start effect now
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                        Effect.show(e, element);
                    }
                    if (!hidden) {
                        hidden = true;
                        Effect.hide(hideEvent, element);
                    }

                    removeListeners();
                };

                var touchMove = function(moveEvent) {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }
                    hideEffect(moveEvent);

                    removeListeners();
                };

                element.addEventListener('touchmove', touchMove, false);
                element.addEventListener('touchend', hideEffect, false);
                element.addEventListener('touchcancel', hideEffect, false);

                var removeListeners = function() {
                    element.removeEventListener('touchmove', touchMove);
                    element.removeEventListener('touchend', hideEffect);
                    element.removeEventListener('touchcancel', hideEffect);
                };
            } else {

                Effect.show(e, element);

                if (isTouchAvailable) {
                    element.addEventListener('touchend', Effect.hide, false);
                    element.addEventListener('touchcancel', Effect.hide, false);
                }

                element.addEventListener('mouseup', Effect.hide, false);
                element.addEventListener('mouseleave', Effect.hide, false);
            }
        }
    }

    Waves.init = function(options) {
        var body = document.body;

        options = options || {};

        if ('duration' in options) {
            Effect.duration = options.duration;
        }

        if ('delay' in options) {
            Effect.delay = options.delay;
        }

        if (isTouchAvailable) {
            body.addEventListener('touchstart', showEffect, false);
            body.addEventListener('touchcancel', TouchHandler.registerEvent, false);
            body.addEventListener('touchend', TouchHandler.registerEvent, false);
        }

        body.addEventListener('mousedown', showEffect, false);
    };


    /**
     * Attach Waves to dynamically loaded inputs, or add .waves-effect and other
     * waves classes to a set of elements. Set drag to true if the ripple mouseover
     * or skimming effect should be applied to the elements.
     */
    Waves.attach = function(elements, classes) {

        elements = getWavesElements(elements);

        if (toString.call(classes) === '[object Array]') {
            classes = classes.join(' ');
        }

        classes = classes ? ' ' + classes : '';

        var element, tagName;

        for (var i = 0, len = elements.length; i < len; i++) {

            element = elements[i];
            tagName = element.tagName.toLowerCase();

            if (['input', 'img'].indexOf(tagName) !== -1) {
                TagWrapper[tagName](element);
                element = element.parentElement;
            }

            if (element.className.indexOf('waves-effect') === -1) {
                element.className += ' waves-effect' + classes;
            }
        }
    };


    /**
     * Cause a ripple to appear in an element via code.
     */
    Waves.ripple = function(elements, options) {
        elements = getWavesElements(elements);
        var elementsLen = elements.length;

        options          = options || {};
        options.wait     = options.wait || 0;
        options.position = options.position || null; // default = centre of element


        if (elementsLen) {
            var element, pos, off, centre = {}, i = 0;
            var mousedown = {
                type: 'mousedown',
                button: 1
            };
            var hideRipple = function(mouseup, element) {
                return function() {
                    Effect.hide(mouseup, element);
                };
            };

            for (; i < elementsLen; i++) {
                element = elements[i];
                pos = options.position || {
                    x: element.clientWidth / 2,
                    y: element.clientHeight / 2
                };

                off      = offset(element);
                centre.x = off.left + pos.x;
                centre.y = off.top + pos.y;

                mousedown.pageX = centre.x;
                mousedown.pageY = centre.y;

                Effect.show(mousedown, element);

                if (options.wait >= 0 && options.wait !== null) {
                    var mouseup = {
                        type: 'mouseup',
                        button: 1
                    };

                    setTimeout(hideRipple(mouseup, element), options.wait);
                }
            }
        }
    };

    /**
     * Remove all ripples from an element.
     */
    Waves.calm = function(elements) {
        elements = getWavesElements(elements);
        var mouseup = {
            type: 'mouseup',
            button: 1
        };

        for (var i = 0, len = elements.length; i < len; i++) {
            Effect.hide(mouseup, elements[i]);
        }
    };

    /**
     * Deprecated API fallback
     */
    Waves.displayEffect = function(options) {
        console.error('Waves.displayEffect() has been deprecated and will be removed in future version. Please use Waves.init() to initialize Waves effect');
        Waves.init(options);
    };

    return Waves;
});

(function () {
  'use strict';

  // common function which is often using
  var commonUse = {
    /**
     * [Add class to element]
     *
     * @param el {Object}   -- element.
     * @param cls {String}  -- classes.
     */
    addClass: function(el, cls) {
      var elClass = el.className;
      var blank = (elClass !== '') ? ' ' : '';
      var added = elClass + blank + cls;
      el.className = added;
    },

    /**
     * [Remove class from element]
     *
     * @param el {Object}   -- element.
     * @param cls {String}  -- classes.
     */
    removeClass: function(el, cls) {
      var elClass = ' '+el.className+' ';
      elClass = elClass.replace(/(\s+)/gi, ' ');
      var removed = elClass.replace(' '+cls+' ', ' ');
      removed = removed.replace(/(^\s+)|(\s+$)/g, '');
      el.className = removed;
    },

    /**
     * [if element has some class]
     *
     * @param el {Object}   -- element.
     * @param cls {String}  -- classes.
     *
     * @return  {Boolean}   -- true or false.
     */
    hasClass: function(el, cls) {
      var elClass = el.className;
      var elClassList = elClass.split(/\s+/);
      var x = 0;
      for(x in elClassList) {
        if(elClassList[x] == cls) {
          return true;
        }
      }
      return false;
    },

    /**
     * [add event to some element, dom0, dom1, supports fuck ie]
     *
     * @param el {Object}       -- element.
     * @param type {String}     -- event type, such as 'click', 'mouseover'.
     * @param func {Function}   -- function.
     *
     */
    addEvent: function(el, type, func) {
      if(el.addEventListener) {
        el.addEventListener(type, func, false);
      } else if(el.attachEvent){
        el.attachEvent('on' + type, func);
      } else{ 
        el['on' + type] = func;
      }  
    },

    /**
     * [remove event to some element, dom0, dom1, supports fuck ie]
     *
     * @param el {Object}       -- element.
     * @param type {String}     -- event type, such as 'click', 'mouseover'.
     * @param func {Function}   -- function.
     *
     */
    removeEvent: function(el, type, func) {
      if (el.removeEventListener){ 
        el.removeEventListener(type, func, false);
      } else if (el.detachEvent){
        el.detachEvent('on' + type, func);
      } else {
        delete el['on' + type];
      }
    },

    /**
     * [Remove element node]
     *
     * @param el {Object}   -- element.
     *
     */
    removeElement: function(el) {
      (el && el.parentNode) && el.parentNode.removeChild(el);
    },

    /**
     * [Set unique id]
     *
     * @param prefix {String}   -- id prefix name.
     *
     * @return  {String}
     */
    setUid: function(prefix) {
      do prefix += Math.floor(Math.random() * 1000000);
      while (document.getElementById(prefix));
      return prefix;
    },

    /**
     * [clone object]
     *
     * @param oldObj {Object}   -- old object need to be cloned
     *
     * @return  {Object} -- cloned object
     */
    clone:function (oldObj) {
      if (typeof(oldObj) != 'object') return oldObj;
      if (oldObj === null) return oldObj;
      var newObj = {};
      for (var i in oldObj)
      newObj[i] = commonUse.clone(oldObj[i]);
      return newObj;
    },
    
    /**
     * [extend object]
     *
     * @return  {Object}
     */
    extend: function() {
      var args = arguments;
      if (args.length < 1) return;
      var temp = this.clone(args[0]);
      for (var n = 1; n < args.length; n++) {
        for (var i in args[n]) {
          temp[i] = args[n][i];
        }
      }
      return temp;
    },

    /**
     * [event handler for ie8]
     *
     * @return  {Object} ev: event; target: event.target
     */
    eventHandler: function(e) {
      var ev = e || window.event;
      var target = ev.target || ev.srcElement;

      return {
        ev: ev,
        target: target
      };
    },

    /**
     * [event stopPropagation for ie8]
     *
     */
    stopPropagation: function(e) {
      if (e.stopPropagation) {
        e.stopPropagation(); 
      } else if (window.event) {
        window.event.cancelBubble = true;
      }
    },

    /**
     * [Get element offset postion, like jQuery `$el.offset()`;]
     *
     * @param el {Object} -- element.
     *
     * @return  {Object}  -- top and left
     */
    getOffset: function(el) {
      var box = el.getBoundingClientRect();

      return {
        top: box.top + window.pageYOffset - document.documentElement.clientTop,
        left: box.left + window.pageXOffset - document.documentElement.clientLeft
      };
    }
  };

  var Selecty = function(el, opts) {
    if (!(this instanceof Selecty)) return new Selecty(el, opts);
    this.settings = commonUse.extend({}, this.defaults, opts);

    this.el = el;
    this.multiple = false;
    this.selected = []; // cache option has been selected array
    this.shown = false;
    this.disabled = false; // is <select> disabled

    this.ul = null; // cache ul element
    this.optionLi = []; // cache option li, not include optgroup li
    this.items = null;  // cache <option> and <optgroup>
    this.options = null; // cache original options
    

    this.template = '<div class="selecty">'+
                      '<a class="selecty-selected"></a>'+
                      '<ul class="selecty-options"></ul>'+
                    '</div>';

    this.init(el);
  };

  Selecty.prototype = {

    defaults: {
      separator: ', '
    },

    /** 
     * [selecty init]
     *
     * @param el {Object}   -- element to call selecty.
     */
    init: function(el) {
      // handle call if use '#id'
      if (typeof el === 'string' && el[0] === '#') {
        el = document.getElementById(el.substr(1));
        this.el = el;
      }

      // if element is not given
      if(!el) {
        console.error('Need select element!');
        return;
      }

      // handle if <select> has no options
      if (el.length < 1) {
        console.error('No options inside <select>');
        return;
      }

      if (this.el.getAttributeNode('multiple') !== null) {
        this.multiple = true;
      }

      // just build for <select>
      el.nodeName === 'SELECT' && this.build();
    },
    
    /** 
     * [generate fake select]
     *
     */
    build: function() {
      var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        this.el.classList.add('selecty-select');
        var arrow = document.createElement('div');
        arrow.classList.add('selecty-arrow');
        arrow.style.top = commonUse.getOffset(this.el).top + this.el.offsetHeight/2 + 'px';
        arrow.style.right = commonUse.getOffset(this.el).left + 'px';
        this.el.parentNode.insertBefore(arrow, arrow.nextSibling);
        return;
      }
      this.el.style.display = 'none';  // hide original <select>

      this.options = this.el.querySelectorAll('option');
      this.items = this.el.querySelectorAll('option, optgroup');
      if (this.el.getAttributeNode('disabled') !== null) this.disabled = true;

      // inject html
      var $dropdown = document.createElement('div');
      $dropdown.innerHTML = this.template;
      var $wrapper = $dropdown.querySelector('.selecty');

      if (this.disabled) commonUse.addClass($wrapper, 'disabled');

      this.btn = $dropdown.querySelector('.selecty-selected');
      this.ul = $dropdown.querySelector('.selecty-options');

      var optionIndex = -1; // for use to set <li data-index='?'>
      var isOptgroup = false;

      // original option to selecty box
      for (var i = 0; i < this.items.length; i++) {
        optionIndex++;
        var $li = document.createElement('li');
        if (this.items[i].nodeName === 'OPTGROUP') {
          optionIndex--;
          isOptgroup = true;
          $li.innerHTML = this.items[i].getAttribute('label');
          commonUse.addClass($li, 'optgroup');
        } else {
          $li.innerHTML = this.items[i].innerHTML; // original <option> to li
          $li.setAttribute('data-value', this.items[i].value); // original value to li
          $li.setAttribute('data-index', optionIndex); // original index to li
          
          isOptgroup && commonUse.addClass($li, 'optgroup-option');

          if (this.items[i].getAttributeNode('selected') !== null) {
            this.selected.push(optionIndex); // selected to cache array
            commonUse.addClass($li, 'selected');
          }
          if (this.items[i].getAttributeNode('disabled') !== null) {
            commonUse.addClass($li, 'disabled');
          }
        }

        this.ul.appendChild($li);
      }

      this.optionLi = this.ul.querySelectorAll('li[data-index]');
      
      this.updateSelected();

      this.el.parentNode.insertBefore($dropdown.firstChild, this.el.nextSibling); // insert html
      this.events();
    },

    events: function() {
      if(this.disabled) return;

      var that = this;
      
      commonUse.addEvent(that.btn, 'click', function(e) {
        // close other selety if it has been showned
        var others = that.otherActived();
        if (others !== null) {
          commonUse.removeClass(others, 'active');
        }
        
        commonUse.stopPropagation(e);
        that.show();
        commonUse.addEvent(document, 'click', bodyClick);
      });

      commonUse.addEvent(document, 'keydown', function(e) {
        if (e.which == 27) that.hide(); // ESC hide options
      });

      var bodyClick = function(e) {
        var target = commonUse.eventHandler(e).target;
        var targetIndex = parseInt(target.getAttribute('data-index'));
        var isOptgroup = commonUse.hasClass(target, 'optgroup');

        if (isOptgroup) return; // do noting if click optgroup li

        if (target.nodeName === 'LI' && targetIndex !== null) {
          if (commonUse.hasClass(target, 'disabled')) return;
          if (that.multiple) {
            if (commonUse.hasClass(target, 'selected')) {
              that.selected.splice(that.selected.indexOf(targetIndex), 1); // remove clicked index from selected cache
            } else {
              that.selected.push(targetIndex); // add click index to selected cache
            }
            that.updateSelected();
          } else {
            that.selected = []; // empty cache selected index
            that.selected.push(targetIndex); // push clicked index to cache selected
            that.updateSelected();
            that.hide();
            commonUse.removeEvent(document, 'click', bodyClick);
          }
        } else {
          that.hide();
          commonUse.removeEvent(document, 'click', bodyClick);
        }
      };
    },

    /** 
     * [show options]
     * 
     */
    show: function() {
      commonUse.addClass(this.ul, 'active'); // show selecty options
      commonUse.addClass(this.el, 'active');
      this.shown = true;
    },

    /** 
     * [hide options]
     * 
     */
    hide: function() {
      commonUse.removeClass(this.ul, 'active');
      commonUse.removeClass(this.el, 'active');
      commonUse.removeEvent(document.body, 'click', function(e){});
      this.shown = false;
    },

    /** 
     * [get actived selecty element for closing it]
     * 
     */
    otherActived: function() {
      var allSelecty = document.body.querySelectorAll('.selecty-options');
      for (var i = 0; i < allSelecty.length; i++) {
        if (commonUse.hasClass(allSelecty[i], 'active')) {
          return allSelecty[i];
        }
      }
      return null;
    },

    /** 
     * [update selected option]
     *
     */
    updateSelected: function() {
      this.clearSelected();

      this.btn.innerHTML = ''; // empty btn's html

      // sort selected index asend
      this.selected.sort(function(a, b){
        return a-b;
      });

      for (var i = 0; i < this.selected.length; i++) {
        var selectedIndex = this.selected[i];
        this.options[selectedIndex].setAttribute('selected', 'selected');
        commonUse.addClass(this.optionLi[selectedIndex], 'selected');

        if (this.multiple) { // multiple
          var divide = this.settings.separator; // get selected text divide
          if(this.btn.innerHTML === '') divide = '';
          this.btn.innerHTML += divide+this.options[selectedIndex].innerHTML;
        } else {
          this.btn.innerHTML = this.options[selectedIndex].innerHTML;
        }
      }

      if(this.btn.innerHTML === '') this.btn.innerHTML = this.options[0].innerHTML; // default set first option to btn html
    },

    /** 
     * [clear all selected option, including original <option> and new <li>]
     *
     */
    clearSelected: function() {
      for (var i = 0; i < this.options.length; i++) {
        this.options[i].removeAttribute('selected');
        commonUse.removeClass(this.optionLi[i], 'selected');
      }
    }
  };

  // NPM, AMD, and wndow support
  if ('undefined' !== typeof module && !! module && !! module.exports) {
    module.exports =  Selecty;
  } else if (typeof define === 'function' && define.amd) {
    define([], function() {
      return Selecty;
    });
  } else {
    window.selecty = Selecty;
  }

  var jQuery = window.jQuery;
  // Support jQuery
  if (jQuery !== undefined) {
    jQuery.fn.selecty = function () {
      var args = Array.prototype.slice.call(arguments);
      return jQuery(this).each( function() {
        if (!args[0] || typeof args[0] === 'object') {
          new Selecty(this, args[0] || {});
        } else if (typeof args[0] === 'string') {
          Selecty.prototype[args[0]].apply(new Selecty(this), args.slice(1));
        }
      });
    };
  }

}());
$('.toggle').on('click', function () {
	var nav = '#'+$(this).data('activates');
	$(nav).toggleClass('visible');
});

jQuery.each(jQuery('textarea[autoresize]'), function() {
	var offset = this.offsetHeight - this.clientHeight;

	var resizeTextarea = function(el) {
		jQuery(el).css('height', 'auto').css('height', el.scrollHeight + offset);
	};
	jQuery(this).on('keyup input', function() { resizeTextarea(this); }).removeAttr('autoresize');
});