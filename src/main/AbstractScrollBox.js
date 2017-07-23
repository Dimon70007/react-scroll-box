import React from 'react';
import {findDOMNode} from 'react-dom';
import {arrayOf, bool, element, func, node, number, object, oneOf, oneOfType, string} from 'prop-types';

export const FastTrackMode = {
  PAGING: 'paging',
  GOTO: 'goto'
};

export const ScrollEasing = {
  easeQuadOut(percent, elapsed, min, max, duration) {
    percent -= 1;
    return min + max * Math.sqrt(1 - Math.pow(percent, 2));
  }
};

export class AbstractScrollBox extends React.Component {

  static propTypes = {
    // Viewport element.
    children: element.isRequired,

    // Use native client scroll bars.
    nativeScrollBars: bool,

    className: string,
    style: object,

    disabled: bool,

    // Events
    onScroll: func,
    onScrollX: func,
    onScrollY: func,

    onScrollStart: func,
    onScrollStartX: func,
    onScrollStartY: func,

    onScrollEnd: func,
    onScrollEndX: func,
    onScrollEndY: func,

    // Disable scrolling in corresponding direction.
    disableScrollX: bool,
    disableScrollY: bool,

    // Toggle scroll bar visibility for corresponding direction.
    hideScrollBarX: bool,
    hideScrollBarY: bool,

    // Toggle show scroll bars outside of scroll box rectangle.
    // This has no effect when native scroll bars are enabled on mobile device.
    outsetScrollBarX: bool,
    outsetScrollBarY: bool,

    // Minimum number of pixels when scroll bars are required.
    scrollMinX: number,
    scrollMinY: number,

    // Distance from cursor to edge of the scroll track when scroll bar is considered to be hovered.
    trackHoverProximityX: number,
    trackHoverProximityY: number,

    // Default easing functions applied when scroll with non-zero duration is requested.
    easingX: func,
    easingY: func,

    // Handle drag
    captureHandleDragX: bool,
    captureHandleDragY: bool,
    // Interrupt handle drag when programmatic scrolling requested.
    interruptibleHandleDrag: bool,

    // Fast tracking occurs when user clicks on scroll track.
    captureFastTrackX: bool,
    captureFastTrackY: bool,

    fastTrackModeX: oneOf(Object.values(FastTrackMode)),
    fastTrackModeY: oneOf(Object.values(FastTrackMode)),

    fastTrackScrollDurationX: number,
    fastTrackScrollDurationY: number,

    // Keyboard
    captureKeyboard: bool,
    keyboardStepX: number,
    keyboardStepY: number,
    keyboardScrollDurationX: number,
    keyboardScrollDurationY: number,

    // Wheel
    captureWheel: bool,
    wheelLineHeight: number,
    wheelStepX: number,
    wheelStepY: number,
    propagateWheelScrollX: bool,
    propagateWheelScrollY: bool,
    swapWheelAxes: bool,
    wheelScrollDurationX: number,
    wheelScrollDurationY: number,

    // Touch
    captureTouch: bool,
    propagateTouchScrollX: bool,
    propagateTouchScrollY: bool,
    touchSingleAxis: bool,
    touchStartDistance: number,
    continuousTouchScrollX: bool,
    continuousTouchScrollY: bool,

    inertiaEasingX: func,
    inertiaEasingY: func,
    inertiaDistanceX: func,
    inertiaDistanceY: func,
    inertiaDurationX: func,
    inertiaDurationY: func,

    // Layout
    trackChildrenX: node,
    trackChildrenY: node,
    handleChildrenX: node,
    handleChildrenY: node
  };

  static defaultProps = {
    nativeScrollBars: false,

    className: 'scroll-box--wrapped',
    style: null,

    disabled: false,

    onScroll(target, dx, dy) {},
    onScrollX(target, dx) {},
    onScrollY(target, dy) {},

    onScrollStart(target) {},
    onScrollStartX(target) {},
    onScrollStartY(target) {},

    onScrollEnd(target) {},
    onScrollEndX(target) {},
    onScrollEndY(target) {},

    disableScrollX: false,
    disableScrollY: false,

    hideScrollBarX: false,
    hideScrollBarY: false,

    outsetScrollBarX: false,
    outsetScrollBarY: false,

    scrollMinX: 2,
    scrollMinY: 2,

    trackHoverProximityX: 50,
    trackHoverProximityY: 50,

    easingX: ScrollEasing.easeQuadOut,
    easingY: ScrollEasing.easeQuadOut,

    // Handle drag
    captureHandleDragX: true,
    captureHandleDragY: true,
    interruptibleHandleDrag: true,

    // Fast track
    captureFastTrackX: true,
    captureFastTrackY: true,

    fastTrackModeX: FastTrackMode.PAGING,
    fastTrackModeY: FastTrackMode.PAGING,

    fastTrackScrollDurationX: 500,
    fastTrackScrollDurationY: 500,

    // Keyboard
    captureKeyboard: true,
    keyboardStepX: 30,
    keyboardStepY: 30,
    keyboardScrollDurationX: 200,
    keyboardScrollDurationY: 200,

    // Wheel
    captureWheel: true,
    // Used when scroll by line-height is requested.
    wheelLineHeight: 24,
    wheelStepX: 100,
    wheelStepY: 100,
    propagateWheelScrollX: false,
    propagateWheelScrollY: true,
    swapWheelAxes: false,
    wheelScrollDurationX: 100,
    wheelScrollDurationY: 100,

    // Touch
    captureTouch: true,
    propagateTouchScrollX: true,
    propagateTouchScrollY: true,
    touchSingleAxis: true,
    touchStartDistance: 10,
    continuousTouchScrollX: false,
    continuousTouchScrollY: false,

    inertiaEasingX: ScrollEasing.easeQuadOut,
    inertiaEasingY: ScrollEasing.easeQuadOut,
    inertiaDistanceX: (dx, dt) => dx / dt * 100,
    inertiaDistanceY: (dy, dt) => dy / dt * 100,
    inertiaDurationX: (dx, dt) => dx / dt * 100,
    inertiaDurationY: (dy, dt) => dy / dt * 100,

    // Layout
    trackChildrenX: null,
    trackChildrenY: null,
    handleChildrenX: null,
    handleChildrenY: null
  };

  constructor(props) {
    super(props);

    let _scrollX = 0,
        _scrollY = 0,
        _prevX = 0,
        _prevY = 0,
        _targetX = 0,
        _targetY = 0,
        _durationX = 0,
        _durationY = 0,
        _easingX,
        _easingY,
        _timestampX = 0,
        _timestampY = 0,

        _terminationTimestampY = null,

        _scrollMaxX = 0,
        _scrollMaxY = 0,

        _trackMaxX = 0,
        _trackMaxY = 0,

        _requiresScrollBarX = false,
        _requiresScrollBarY = false,

        _requestId,

        _scrollingX = false,
        _scrollingY = false,

        _prevScrollEndX,
        _prevScrollEndY,

        _onScrollX,
        _onScrollY,
        _onScrollEndX,
        _onScrollEndY,

        _prevTickX = 0,
        _prevTickY = 0,
        _tickX = 0,
        _tickY = 0,

        // Refs
        _root,
        _viewport,
        _handleX,
        _handleY,
        _trackX,
        _trackY;

    const setHandleX = ref => _handleX = ref;
    const setHandleY = ref => _handleY = ref;

    const setTrackX = ref => _trackX = ref;
    const setTrackY = ref => _trackY = ref;

    this.componentDidMount = () => {
      _root = findDOMNode(this);
      _viewport = _root.firstChild;

      const requestPropagateChanges = () => {
        if (window.cancelAnimationFrame) {
          _requestId = requestAnimationFrame(requestPropagateChanges);
        } else {
          _requestId = setTimeout(requestPropagateChanges, 1000 / 30);
        }
        propagateChanges();
      };

      requestPropagateChanges();
      addEventListener('mousemove', handleTrackHover);

      // Fix https://github.com/facebook/react/issues/8968
      _root.addEventListener('touchstart', handleTouchStart);
    };

    this.componentWillUnmount = () => {
      _root = null;

      if (window.cancelAnimationFrame) {
        cancelAnimationFrame(_requestId);
      } else {
        clearTimeout(_requestId);
      }
      removeEventListener('mousemove', handleTrackHover);
    };

    this.componentDidUpdate = () => {
      _viewport = _root.firstChild;
      propagateChanges();
    };

    this.render = () => {
      const {
        className,
        style,
        disabled,

        outsetScrollBarX,
        outsetScrollBarY,

        nativeScrollBars,

        disableScrollX,
        disableScrollY,
        hideScrollBarX,
        hideScrollBarY,

        children,
        trackChildrenX,
        trackChildrenY,
        handleChildrenX,
        handleChildrenY
      } = this.props;

      let classNames = ['scroll-box'];
      if (className) {
        classNames.push(className);
      }
      if (disabled) {
        classNames.push('scroll-box--disabled');
      }
      if (outsetScrollBarX) {
        classNames.push('scroll-box--outset-x');
      }
      if (outsetScrollBarY) {
        classNames.push('scroll-box--outset-y');
      }
      if (!disableScrollX && !hideScrollBarX) {
        classNames.push('scroll-box--enable-x');
      }
      if (!disableScrollY && !hideScrollBarY) {
        classNames.push('scroll-box--enable-y');
      }
      if (nativeScrollBars) {
        classNames.push('scroll-box--native-scroll-bars');
      }

      return (
          <div style={style}
               className={classNames.join(' ')}
               onWheel={handleWheel}
               onKeyDown={handleKeyDown}
               tabIndex="-1">
            {children}
            <div className="scroll-box__track scroll-box__track--x"
                 onMouseDown={handleFastTrackX}
                 ref={setTrackX}>
              <div className="scroll-box__handle scroll-box__handle--x"
                   onMouseDown={handleDragStartX}
                   ref={setHandleX}>
                {handleChildrenX}
              </div>
              {trackChildrenX}
            </div>
            <div className="scroll-box__track scroll-box__track--y"
                 onMouseDown={handleFastTrackY}
                 ref={setTrackY}>
              <div className="scroll-box__handle scroll-box__handle--y"
                   onMouseDown={handleDragStartY}
                   ref={setHandleY}>
                {handleChildrenY}
              </div>
              {trackChildrenY}
            </div>
          </div>
      );
    };

    this.scrollTo = ({
        x, y,

        easing,
        easingX = easing || this.props.easingX,
        easingY = easing || this.props.easingY,

        duration = 0,
        durationX = duration,
        durationY = duration,

        onScrollX = this.props.onScrollX,
        onScrollY = this.props.onScrollY,

        onScrollEndX = this.props.onScrollEndX,
        onScrollEndY = this.props.onScrollEndY
    } = {}) => {

      if (!isNaN(x) && x !== null) {
        _prevX = _scrollX;
        _prevTickX = _tickX++;
        _prevScrollEndX = _onScrollEndX;

        _targetX = parseInt(x);
        _easingX = easingX;
        _durationX = durationX;
        _timestampX = Date.now();
        _onScrollX = onScrollX;
        _onScrollEndX = onScrollEndX;
      }

      if (!isNaN(y) && y !== null) {
        _tickY++;
        _prevY = _scrollY;
        _prevScrollEndY = _onScrollEndY;

        _targetY = parseInt(y);
        _easingY = easingY;
        _durationY = durationY;
        _timestampY = Date.now();
        _onScrollY = onScrollY;
        _onScrollEndY = onScrollEndY;
      }

      propagateChanges();
    };

    this.scrollToX = (x, options) => this.scrollTo({...options, x});

    this.scrollToY = (y, options) => this.scrollTo({...options, y});

    this.scrollBy = ({dx, dy, ...options} = {}) => {
      this.scrollTo({
        ...options,
        x: _targetX + dx,
        y: _targetY + dy
      });
    };

    this.scrollByX = (dx, options) => this.scrollBy({...options, dx});
    
    this.scrollByY = (dy, options) => this.scrollBy({...options, dy});

    this.scrollToPage = ({
        x, y,
        ...options
    } = {}) => {
      x *= this.getPageWidth();
      y *= this.getPageHeight();
      this.scrollTo({...options, x, y});
    };

    this.scrollToPageX = (x, options) => this.scrollToPage({...options, x});

    this.scrollToPageY = (y, options) => this.scrollToPage({...options, y});

    this.scrollByPage = ({
        dx, dy,
        ...options
    } = {}) => {
      dx *= this.getPageWidth();
      dy *= this.getPageHeight();
      this.scrollBy({...options, dx, dy});
    };

    this.scrollByPageX = (dx, options) => this.scrollByPage({...options, dx});

    this.scrollByPageY = (dy, options) => this.scrollByPage({...options, dy});

    this.getPageWidth = () => _viewport.clientWidth;

    this.getPageHeight = () => _viewport.clientHeight;

    Object.defineProperties(this, {
      targetX: {
        get: () => _targetX,
        set: x => this.scrollToX(x)
      },
      targetY: {
        get: () => _targetY,
        set: y => this.scrollToY(y)
      },
      scrollX: {
        get: () => _scrollX,
        set: x => this.scrollToX(x)
      },
      scrollY: {
        get: () => _scrollY,
        set: y => this.scrollToY(y)
      },
      scrollMaxX: {get: () => _scrollMaxX},
      scrollMaxY: {get: () => _scrollMaxY}
    });






    const handleScrollStart = () => {};


    // Do not handle any keyboard events when text-related controls are focused.
    const isScrollPrevented = event => /textarea|input/i.test(event.target.tagName);





    const propagateChanges = () => {
      const {
          disableScrollX,
          disableScrollY,

          scrollMinX,
          scrollMinY,

          nativeScrollBars,

          outsetScrollBarX,
          outsetScrollBarY
      } = this.props;

      const {
          clientWidth,
          clientHeight,

          offsetWidth,
          offsetHeight,

          scrollWidth,
          scrollHeight,

          scrollTop,
          scrollLeft
      } = _viewport;

      _scrollMaxX = scrollWidth - clientWidth;
      _scrollMaxY = scrollHeight - clientHeight;

      _requiresScrollBarX = !disableScrollX && _scrollMaxX >= scrollMinX;
      _requiresScrollBarY = !disableScrollY && _scrollMaxY >= scrollMinY;

      _root.classList.toggle('scroll-box--requires-x', _requiresScrollBarX);
      _root.classList.toggle('scroll-box--requires-y', _requiresScrollBarY);

      _viewport.style.height = do {
        if (nativeScrollBars && outsetScrollBarX) {
          `calc(100% + ${offsetHeight - clientHeight}px)`;
        } else {
          '100%';
        }
      };

      _viewport.style.width = do {
        if (nativeScrollBars && outsetScrollBarY) {
          `calc(100% + ${offsetWidth - clientWidth}px)`;
        } else {
          '100%';
        }
      };

      _targetX = Math.max(0, Math.min(_targetX, _scrollMaxX));
      _targetY = Math.max(0, Math.min(_targetY, _scrollMaxY));

      let nextScrollX = _scrollX,
          nextScrollY = _scrollY;

      if (_scrollX === scrollLeft && _scrollY === scrollTop) {
        // Controlled scroll position coincides with viewport position.

        if (nextScrollX !== _targetX) {
          const elapsedX = Date.now() - _timestampX;
          if (elapsedX < _durationX) {
            nextScrollX = Math.floor(_prevX + _easingX(elapsedX / _durationX, elapsedX, 0, 1, _durationX) * (_targetX - _prevX));
          } else {
            nextScrollX = _targetX;
          }
        }
        if (nextScrollY !== _targetY) {
          const elapsedY = Date.now() - _timestampY;
          if (elapsedY < _durationY) {
            nextScrollY = Math.floor(_prevY + _easingY(elapsedY / _durationY, elapsedY, 0, 1, _durationY) * (_targetY - _prevY));
          } else {
            nextScrollY = _targetY;
          }
        }
      }

      const nativeScrollingX = _scrollX !== scrollLeft,
            nativeScrollingY = _scrollY !== scrollTop;

      if (nativeScrollingX) {
        _targetX = nextScrollX = scrollLeft;
      }
      if (nativeScrollingY) {
        _targetY = nextScrollY = scrollTop;
      }

      const dx = _scrollX - nextScrollX,
            dy = _scrollY - nextScrollY;

      const tickX = _tickX,
            tickY = _tickY;

      const nextScrollingX = nextScrollX !== _targetX,
            nextScrollingY = nextScrollY !== _targetY;



      if (_prevTickY === _tickY) {

        if (_scrollingY) {
          if (nextScrollingY) {
            console.log('scroll');
            if (_onScrollY) {
              _onScrollY();
            }
          } else {
            if (_terminationTimestampY === null) {
              _terminationTimestampY = Date.now() + 1000;
            } else {
              if (Date.now() >= _terminationTimestampY) {
                _terminationTimestampY = null;
                console.log('scroll end 1');
                _scrollingY = false;

                if (_onScrollEndY) {
                  _onScrollEndY();
                }
                _onScrollY = null;
                _onScrollEndY = null;
              }
            }

          }
        }

      } else {
        _prevTickY = _tickY;
        _scrollingY = true;

        if (_prevScrollEndY !== _onScrollEndY /* Check other props of scroll */) {
          if (_prevScrollEndY) {
            console.log('scroll end 0');
            _prevScrollEndY();
          }
          _prevScrollEndY = null;
          console.log('scroll start');
        }
        _terminationTimestampY = null;
        console.log('scroll');
        if (_onScrollY) {
          _onScrollY();
        }
      }




      if (dx && tickX === _tickX) {
        _viewport.scrollLeft = _scrollX = nextScrollX;
      }

      if (dy && tickY === _tickY) {
        _viewport.scrollTop = _scrollY = nextScrollY;
      }

      if (nativeScrollBars) {
        return;
      }

      _trackMaxX = _trackX.clientWidth - _handleX.offsetWidth;
      _handleX.style.width = clientWidth / scrollWidth * 100 + '%';
      _handleX.style.left = _trackMaxX * nextScrollX / _scrollMaxX + 'px';

      _trackMaxY = _trackY.clientHeight - _handleY.offsetHeight;
      _handleY.style.height = clientHeight / scrollHeight * 100 + '%';
      _handleY.style.top = _trackMaxY * nextScrollY / _scrollMaxY + 'px';
    };

    const handleKeyDown = event => {
      const {
          disabled,
          captureKeyboard,
          keyboardStepX,
          keyboardStepY,
          keyboardScrollDurationX,
          keyboardScrollDurationY
      } = this.props;

      if (disabled || !captureKeyboard || isScrollPrevented(event)) {
        return;
      }

      const {keyCode, shiftKey} = event;
      const optionsX = {duration: keyboardScrollDurationX},
            optionsY = {duration: keyboardScrollDurationY};

      switch (keyCode) {

        case 33: // Page Up
          event.preventDefault();
          if (shiftKey) {
            this.scrollByX(-this.getPageWidth(), optionsX);
          } else {
            this.scrollByY(-this.getPageHeight(), optionsY);
          }
          break;

        case 34: // Page Down
          event.preventDefault();
          if (shiftKey) {
            this.scrollByX(this.getPageWidth(), optionsX);
          } else {
            this.scrollByY(this.getPageHeight(), optionsY);
          }
          break;

        case 35: // End
          event.preventDefault();
          this.scrollToY(this.scrollMaxY, optionsY);
          break;

        case 36: // Home
          event.preventDefault();
          this.scrollToY(0, optionsY);
          break;

        case 37: // Arrow Left
          event.preventDefault();
          this.scrollByX(-keyboardStepX, optionsX);
          break;

        case 38: // Arrow Up
          event.preventDefault();
          this.scrollByY(-keyboardStepY, optionsY);
          break;

        case 39: // Arrow Right
          event.preventDefault();
          this.scrollByX(keyboardStepX, optionsX);
          break;

        case 40: // Arrow Down
          event.preventDefault();
          this.scrollByY(keyboardStepY, optionsY);
          break;
      }
    };

    const handleFastTrack = (event, horizontal) => {
      const {
          disabled,

          captureFastTrackX,
          captureFastTrackY,

          fastTrackModeX,
          fastTrackModeY,

          fastTrackScrollDurationX,
          fastTrackScrollDurationY
      } = this.props;

      if (disabled || !(captureFastTrackX || captureFastTrackY) || event.button) {
        // Component is disabled or secondary mouse button is being pressed.
        return;
      }

      const {
          clientWidth,
          clientHeight,
          scrollWidth,
          scrollHeight
      } = _viewport;

      if (horizontal) {
        if (captureFastTrackX) {
          const pointerX = event.clientX - _trackX.getBoundingClientRect().left,
                optionsX = {duration: fastTrackScrollDurationX};

          if (fastTrackModeX === FastTrackMode.PAGING) {
            this.scrollToX(_targetX + (1 - 2 * (pointerX < _handleX.offsetLeft)) * this.getPageWidth(), optionsX);
          } else {
            this.scrollToX(pointerX / _trackX.clientWidth * scrollWidth - clientWidth / 2, optionsX);
          }
        }
      } else {
        if (captureFastTrackY) {
          const pointerY = event.clientY - _trackY.getBoundingClientRect().top,
                optionsY = {duration: fastTrackScrollDurationY};

          if (fastTrackModeY === FastTrackMode.PAGING) {
            this.scrollToY(_targetY + (1 - 2 * (pointerY < _handleY.offsetTop)) * this.getPageHeight(), optionsY);
          } else {
            this.scrollToY(pointerY / _trackY.clientHeight * scrollHeight - clientHeight / 2, optionsY);
          }
        }
      }
    };

    const handleFastTrackX = event => handleFastTrack(event, true);

    const handleFastTrackY = event => handleFastTrack(event, false);

    const handleDragStart = (event, horizontal) => {
      const {
          disabled,
          captureHandleDragX,
          captureHandleDragY
      } = this.props;

      // Handle can be dragged with main mouse button only.
      if (disabled || !(captureHandleDragX || captureHandleDragY) || event.button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const track = horizontal ? _trackX : _trackY;

      const offsetX = event.clientX - _handleX.offsetLeft,
            offsetY = event.clientY - _handleY.offsetTop;

      const handleDrag = event => {
        if (!_root || event.button) {
          stopDrag();
          return;
        }

        if (horizontal) {
          this.scrollToX(this.scrollMaxX * (event.clientX - offsetX) / _trackMaxX);
        } else {
          this.scrollToY(this.scrollMaxY * (event.clientY - offsetY) / _trackMaxY);
        }
      };

      const handleDragEnd = () => stopDrag();

      const stopDrag = () => {
        removeEventListener('mousemove', handleDrag);
        removeEventListener('mouseup', handleDragEnd);

        track.classList.remove('scroll-box__track--dragged');
      };

      addEventListener('mousemove', handleDrag);
      addEventListener('mouseup', handleDragEnd);

      track.classList.add('scroll-box__track--dragged');
    };

    const handleDragStartX = event => handleDragStart(event, true);

    const handleDragStartY = event => handleDragStart(event, false);

    const handleWheel = event => {
      let {target, deltaMode, deltaX, deltaY, shiftKey, nativeEvent} = event;

      const {
          wheelStepX,
          wheelStepY,
          disabled,
          nativeScrollBars,
          captureWheel,
          wheelLineHeight,
          propagateWheelScrollX,
          propagateWheelScrollY,
          swapWheelAxes,
          wheelScrollDurationX,
          wheelScrollDurationY
      } = this.props;

      if (nativeScrollBars && !captureWheel) {
        event.preventDefault();
      }
      if (disabled || nativeScrollBars || (target !== _viewport && isScrollPrevented(event))) {
        return;
      }

      // By default, Google Chrome changes scrolling orientation if shift key is pressed,
      // so propagate this behavior to other browsers as well.
      if (shiftKey && !deltaX) {
        deltaX = deltaY;
        deltaY = 0;
      }

      if (swapWheelAxes) {
        const buffer = deltaX;
        deltaX = deltaY;
        deltaY = buffer;
      }

      const stopPropagationX = !deltaX || (_requiresScrollBarX && ((deltaX < 0 && _targetX > 0) || (deltaX > 0 && _targetX !== _scrollMaxX))),
            stopPropagationY = !deltaY || (_requiresScrollBarY && ((deltaY < 0 && _targetY > 0) || (deltaY > 0 && _targetY !== _scrollMaxY)));

      const propagateX = deltaX * !stopPropagationX * propagateWheelScrollX,
            propagateY = deltaY * !stopPropagationY * propagateWheelScrollY;

      if (propagateX || propagateY) {
        if (propagateX === deltaX && propagateY === deltaY) {
          return;
        } else {
          event.stopPropagation();
          event.preventDefault();
          target.dispatchEvent(new WheelEvent(nativeEvent.type, {deltaX: propagateX, deltaY: propagateY}));
        }
      }

      let dx = deltaX * _requiresScrollBarX,
          dy = deltaY * _requiresScrollBarY;

      if (!dx && !dy) {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      // Converts received delta values into pixels.
      switch (deltaMode) {

        case 0x01: // Delta values are specified in lines.
          dx *= wheelLineHeight;
          dy *= wheelLineHeight;
          break;

        case 0x02: // Delta values are specified in pages.
          dx *= this.getPageWidth();
          dy *= this.getPageHeight();
          break;

        default:
          // Delta values are specified in pixels.
          break;
      }

      dx *= wheelStepX / 100;
      dy *= wheelStepY / 100;

      let nextTargetX = _targetX + dx,
          nextTargetY = _targetY + dy;

      // Prevent jumping to target position when animated scrolling is in progress,
      // but preserve scroll speed when mouse wheel events arrive frequently.
      if (Date.now() - _timestampX > wheelScrollDurationX) {
        nextTargetX = _scrollX + dx;
      }
      if (Date.now() - _timestampX > wheelScrollDurationY) {
        nextTargetY = _scrollY + dy;
      }

      if (dx) {
        this.scrollToX(nextTargetX, {duration: wheelScrollDurationX});
      }
      if (dy) {
        this.scrollToY(nextTargetY, {duration: wheelScrollDurationY});
      }
    };

    const toggleTrackHover = (track, status) => track.classList.toggle('scroll-box__track--hover', status);

    const isTrackHovered = (event, track, proximity) => {
      const {clientX, clientY} = event,
            {width, left, top, height} = track.getBoundingClientRect();

      return proximity > clientY - height - top &&
             proximity > clientX - width - left &&
             proximity > left - clientX &&
             proximity > top - clientY;
    };

    const handleTrackHover = event => {
      const {
          disabled,
          nativeScrollBars,
          captureHandleDragX,
          captureHandleDragY,
          captureFastTrackX,
          captureFastTrackY,
          trackHoverProximityX,
          trackHoverProximityY
      } = this.props;

      if ('orientation' in window || nativeScrollBars || disabled) {
        return;
      }

      if (_requiresScrollBarX && (captureHandleDragX || captureFastTrackX)) {
        const statusX = !event.buttons && isTrackHovered(event, _trackX, trackHoverProximityX);
        toggleTrackHover(_trackX, statusX);
      }
      if (_requiresScrollBarY && (captureHandleDragY || captureFastTrackY)) {
        const statusY = !event.buttons && isTrackHovered(event, _trackY, trackHoverProximityY);
        toggleTrackHover(_trackY, statusY);
      }
    };

    const isIgnoredChangeX = dx => (dx < 0 && !_targetX) || (dx > 0 && _targetX === _scrollMaxX);

    const isIgnoredChangeY = dy => (dy < 0 && !_targetY) || (dy > 0 && _targetY === _scrollMaxY);

    const preventDefault = event => {
      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const handleTouchStart = event => {
      const {target, touches} = event;
      const {
          disabled,
          nativeScrollBars,
          captureTouch,
          propagateTouchScrollX,
          propagateTouchScrollY,
          touchSingleAxis,
          touchStartDistance,
          continuousTouchScrollX,
          continuousTouchScrollY,

          inertiaEasingX,
          inertiaEasingY,
          inertiaDistanceX,
          inertiaDistanceY,
          inertiaDurationX,
          inertiaDurationY
      } = this.props;

      if (nativeScrollBars && !captureTouch) {
        preventDefault(event);
      }
      if (disabled || nativeScrollBars || touches.length > 1 || (target !== _viewport && isScrollPrevented(event))) {
        return;
      }

      const {
          clientX: initialClientX,
          clientY: initialClientY
      } = touches[0];
      const initialScrollX = _scrollX,
            initialScrollY = _scrollY;

      let prevClientX,
          prevClientY,
          lastClientX,
          lastClientY,
          prevTimestamp,
          lastTimestamp,
          horizontal,
          stopPropagationX,
          stopPropagationY;

      const handleTouchMove = event => {
        const {clientX, clientY} = event.touches[0];
        const dx = initialClientX - clientX,
              dy = initialClientY - clientY,
              pending = isNaN(lastClientX);

        if (pending && Math.sqrt(dx * dx + dy * dy) < touchStartDistance) {
          preventDefault(event);
          return;
        }
        if (pending && touchSingleAxis) {
          horizontal = Math.abs(dx) > Math.abs(dy);
        }
        if (pending || continuousTouchScrollX) {
          stopPropagationX = _requiresScrollBarX && !isIgnoredChangeX(dx);
        }
        if (pending || continuousTouchScrollY) {
          stopPropagationY = _requiresScrollBarY && !isIgnoredChangeY(dy);
        }

        prevClientX = lastClientX;
        prevClientY = lastClientY;
        lastClientX = clientX;
        lastClientY = clientY;
        prevTimestamp = lastTimestamp;
        lastTimestamp = Date.now();

        const targetX = initialScrollX + dx,
              targetY = initialScrollY + dy;

        if (touchSingleAxis) {
          if (horizontal) {
            if (stopPropagationX || !propagateTouchScrollX) {
              preventDefault(event);
              this.scrollToX(targetX);
            }
          } else {
            if (stopPropagationY || !propagateTouchScrollY) {
              preventDefault(event);
              this.scrollToY(targetY);
            }
          }
        } else {
          if (stopPropagationX || stopPropagationY || (!propagateTouchScrollX && !propagateTouchScrollY)) {
            preventDefault(event);
            this.scrollTo({x: targetX, y: targetY});
          }
        }
      };

      const handleTouchEnd = () => {
        removeEventListener('touchmove', handleTouchMove);
        removeEventListener('touchend', handleTouchEnd);
        removeEventListener('touchcancel', handleTouchEnd);

        if (isNaN(prevClientX)) {
          return;
        }
        const dt = lastTimestamp - prevTimestamp,
              dx = prevClientX - lastClientX,
              dy = prevClientY - lastClientY,
              distanceX = inertiaDistanceX(dx, dt),
              distanceY = inertiaDistanceY(dy, dt),
              durationX = Math.abs(inertiaDurationX(dx, dt)),
              durationY = Math.abs(inertiaDurationY(dy, dt));

        const targetX = _targetX + distanceX,
              targetY = _targetY + distanceY;

        if (touchSingleAxis) {
          if (horizontal) {
            this.scrollToX(targetX, {easingX: inertiaEasingX, durationX});
          } else {
            this.scrollToY(targetY, {easingY: inertiaEasingY, durationY});
          }
        } else {
          this.scrollTo({
            x: targetX,
            y: targetY,
            easingX: inertiaEasingX,
            easingY: inertiaEasingY,
            durationX,
            durationY
          });
        }
      };

      addEventListener('touchmove', handleTouchMove, {passive: false});
      addEventListener('touchend', handleTouchEnd);
      addEventListener('touchcancel', handleTouchEnd);
    };
  }
}