import React from 'react';
import {findDOMNode} from 'react-dom';

const {number, bool, func, oneOf, any, string} = React.PropTypes;

export const ScrollAxes = {
  X: 'x',
  Y: 'y',
  XY: 'xy'
};

export const FastTrack = {
  PAGING: 'paging',
  GOTO: 'goto',
  OFF: null
};

export class GenericScrollBox extends React.Component {

  static defaultProps = {
    nativeScroll: 'orientation' in window,
    className: 'scroll-box--wrapped',
    axes: ScrollAxes.XY,
    hoverProximity: 50,
    disabled: false,
    outset: false,
    scrollMinX: 2,
    scrollMinY: 2,
    defaultEasing: (percent, elapsed, min, max, duration) => max * Math.sqrt(1 - --percent * percent) + min,

    // Drag
    captureHandleDrag: true,

    // Events
    onViewportScroll: target => {},

    // Fast tracking
    fastTrack: FastTrack.GOTO,
    fastTrackDuration: 500,

    // Keyboard
    captureKeyboard: true,
    keyboardStepX: 30,
    keyboardStepY: 30,
    keyboardScrollDuration: 200,

    // Wheel
    captureWheel: true,
    wheelStepX: 30,
    wheelStepY: 30,
    propagateWheelScroll: true,
    swapWheelAxes: false,
    wheelScrollDuration: 100
  };

  static propTypes = {
    nativeScroll: bool,
    className: string,
    axes: oneOf([ScrollAxes.X, ScrollAxes.Y, ScrollAxes.XY]),
    hoverProximity: number,
    disabled: bool,
    outset: bool,
    scrollMinX: number,
    scrollMinY: number,
    defaultEasing: func,

    // Drag
    captureHandleDrag: bool,

    // Events
    onViewportScroll: func,

    // Fast tracking
    fastTrack: oneOf([FastTrack.GOTO, FastTrack.PAGING, FastTrack.OFF]),
    fastTrackDuration: number,

    // Keyboard
    captureKeyboard: bool,
    keyboardStepX: number,
    keyboardStepY: number,
    keyboardScrollDuration: number,

    // Wheel
    captureWheel: bool,
    wheelStepX: number,
    wheelStepY: number,
    propagateWheelScroll: bool,
    swapWheelAxes: bool,
    wheelScrollDuration: number,

    // Layout
    trackXChildren: any,
    trackYChildren: any,
    handleXChildren: any,
    handleYChildren: any
  };

  // Handle elements.
  // Set to `null` when component is unmounted.
  handleX = null;
  handleY = null;

  // Track elements.
  // Set to `null` when component is unmounted.
  trackX = null;
  trackY = null;

  // Viewport element.
  // Set to `null` when component is unmounted.
  viewport = null;

  // Scroll position in pixels that was last requested.
  targetX = 0;
  targetY = 0;

  // Previously requested scroll position.
  previousX = 0;
  previousY = 0;

  // Actual scroll position that user observes.
  // This changes repeatedly during animation, while is static these
  // values are equal to `x` and `y`.
  scrollX = 0;
  scrollY = 0;

  // Maximum values for horizontal and vertical scroll positions.
  scrollMaxX = 0;
  scrollMaxY = 0;

  // Maximum values for horizontal and vertical handle positions. If native scroll is used then equals to 0.
  trackMaxX = 0;
  trackMaxY = 0;

  // Does scroll box require actual presence of horizontal or vertical scroll bars.
  // If set to `true`, then axis is permitted via `props.axes` and corresponding `scrollMax >= scrollMin`.
  exposesX = false;
  exposesY = false;

  // Timestamp when scroll position started to change last time.
  _start = 0;

  // Duration of currently running animation. In case no animation is in progress `_duration` equals to 0.
  _duration = 0;

  // If set to `true` prevents triggering `onViewportScroll` if any scrolling occurs.
  // Automatically reset to `false` then scroll animation finishes.
  _silent = false;

  _touchOffsetX = 0;
  _touchOffsetY = 0;
  _touchStart = null;
  _touchEnd = null;

  scrollBy(dx, dy, duration, easing, silent) {
    this.scrollTo(this.targetX + dx, this.targetY + dy, duration, silent);
  }

  scrollTo(x, y, duration = 0, easing = this.props.defaultEasing, silent = false) {
    // Consider actual scroll position to be a starting point.
    this._duration = duration;
    this._start = Date.now();
    this.previousX = this.scrollX;
    this.previousY = this.scrollY;
    if (!isNaN(x)) {
      this.targetX = x;
    }
    if (!isNaN(y)) {
      this.targetY = y;
    }
    this._easing = easing;
    this._silent = Boolean(silent);
    this._forceSync();
  }

  // Synchronize scrollbar positions immediately without waiting for animation frame.
  _forceSync() {
    const {handleX, handleY, viewport, _start, _silent} = this;
    if (!viewport) {
      return; // Component was unmounted.
    }
    const {scrollY, scrollX, previousX, previousY, _easing, _duration} = this,
          {axes, nativeScroll, outset, onViewportScroll, scrollMinX, scrollMinY} = this.props,
          {clientWidth, clientHeight, offsetWidth, offsetHeight, scrollWidth, scrollHeight, scrollTop, scrollLeft} = viewport;

    const SCROLL_MAX_X = Math.max(0, scrollWidth - clientWidth),
          SCROLL_MAX_Y = Math.max(0, scrollHeight - clientHeight);

    this.exposesX = axes.indexOf(ScrollAxes.X) > -1 && SCROLL_MAX_X >= scrollMinX;
    this.exposesY = axes.indexOf(ScrollAxes.Y) > -1 && SCROLL_MAX_Y >= scrollMinY;

    let el = findDOMNode(this);
    el.classList.toggle('scroll-box--show-axis-x', this.exposesX);
    el.classList.toggle('scroll-box--show-axis-y', this.exposesY);

    // Scrollbars may have non-zero thickness so in case of outset positioning
    // pixes cropped by scrollbar must be compensated.
    let width = '100%',
        height = '100%';
    if (nativeScroll && outset) {
      let trackYWidth = offsetWidth - clientWidth,
          trackXHeight = offsetHeight - clientHeight;
      if (trackYWidth) {
        width = `calc(100% + ${trackYWidth}px)`;
      }
      if (trackXHeight) {
        height = `calc(100% + ${trackXHeight}px)`;
      }
    }
    viewport.style.width = width;
    viewport.style.height = height;

    let targetX = Math.max(0, Math.min(Math.round(this.targetX), SCROLL_MAX_X)) * this.exposesX,
        targetY = Math.max(0, Math.min(Math.round(this.targetY), SCROLL_MAX_Y)) * this.exposesY,
        x = targetX,
        y = targetY;

    if (!nativeScroll && scrollY == scrollTop && scrollX == scrollLeft) {
      let elapsed = Date.now() - _start;
      if (elapsed < _duration && typeof _easing == 'function') {
        let ratio = _easing(elapsed / _duration, elapsed, 0, 1, _duration);

        // Compute eased scroll positions.
        x = Math.round(previousX + ratio * (targetX - previousX));
        y = Math.round(previousY + ratio * (targetY - previousY));
      } else {
        // Scroll animation completed.
        this._duration = 0;
      }
      // Prevent native scrolling glitches, especially if native scroll is inertial or smooth.
      viewport.scrollLeft = x;
      viewport.scrollTop = y;
    } else {
      // Viewport scroll position is not synced with component state.
      // This is usually caused by system scrolling, resize of element etc.
      // So stop running animation and update component state with current
      // viewport scroll offsets.
      this._duration = 0;
      x = targetX = scrollLeft;
      y = targetY = scrollTop;
    }
    this.targetX = targetX;
    this.targetY = targetY;

    if (scrollX == x && scrollY == y && this.scrollMaxX == SCROLL_MAX_X && this.scrollMaxY == SCROLL_MAX_Y) {
      if (!this._duration) {
        // Animation has completed and geometry did not change.
        this._easing = null;
        this._silent = false;
      }
      // Viewport did not change its scroll parameters, so invocation of `onViewportScroll` and
      // further altering geometry of handles and tracks is not required.
      return;
    }
    this.scrollX = x;
    this.scrollY = y;
    this.scrollMaxX = SCROLL_MAX_X;
    this.scrollMaxY = SCROLL_MAX_Y;
    this.trackMaxX = 0;
    this.trackMaxY = 0;

    // Update custom handle positions and sizes.
    // Scrollbar size represents ratio of content and viewport sizes.
    if (!nativeScroll) {
      this.trackMaxX = this.trackX.clientWidth - handleX.offsetWidth;
      this.trackMaxY = this.trackY.clientHeight - handleY.offsetHeight;

      handleX.style.width = clientWidth / scrollWidth * 100 + '%';
      handleX.style.left = this.trackMaxX * x / SCROLL_MAX_X + 'px';

      handleY.style.height = clientHeight / scrollHeight * 100 + '%';
      handleY.style.top = this.trackMaxY * y / SCROLL_MAX_Y + 'px';
    }
    if (!_silent && !(scrollX == x && scrollY == y)) {
      onViewportScroll(this);
    }
  }

  onTouchStart = e => {
    if (this.props.nativeScroll || this.props.disabled || e.touches.length > 1 || e.isDefaultPrevented()) {
      return;
    }
    e.stopPropagation();
    let touch = e.touches[0],
        x = this.viewport.scrollLeft,
        y = this.viewport.scrollTop;
    this._touchOffsetX = x + touch.screenX;
    this._touchOffsetY = y + touch.screenY;
    this._touchStart = {x, y};
  };

  onTouchMove = e => {
    if (!this._touchStart) {
      return;
    }
    e.preventDefault();
    let touch = e.touches[0],
        x = this._touchOffsetX - touch.screenX,
        y = this._touchOffsetY - touch.screenY;
    if (this._touchEnd) {
      let coords = this._touchStart;
      this._touchStart = this._touchEnd;
      this._touchEnd = coords;
      coords.x = x;
      coords.y = y;
    } else {
      this._touchEnd = {x, y};
    }
    this.scrollTo(x, y, 0);
  };

  onTouchEnd = e => {
    if (!this._touchEnd) {
      return;
    }
    const {_touchStart, _touchEnd} = this;
    let dt = Date.now() - this._start,
        dx = _touchStart.x - _touchEnd.x,
        dy = _touchStart.y - _touchEnd.y,
        distance = Math.sqrt(dx * dx + dy * dy),
        velocity = distance / dt * 100;

    this._touchStart = null;
    this._touchEnd = null;
    this.scrollTo(_touchEnd.x - velocity * dx / distance, _touchEnd.y - velocity * dy / distance, velocity);
  };

  onScroll = e => {
    if (this.props.nativeScroll && e.target == this.viewport) {
      this._forceSync();
    }
  };

  onWheel = e => {
    const {wheelStepX, wheelStepY, nativeScroll, disabled, captureWheel, propagateWheelScroll, swapWheelAxes, wheelScrollDuration} = this.props,
          {targetX, targetY, scrollMaxX, scrollMaxY} = this,
          el = e.target;
    if (
      nativeScroll || disabled || e.isDefaultPrevented() || // Event prevented.
      !captureWheel || // Wheel events prevented.
      (el != this.viewport && el.tagName.toLocaleLowerCase() == 'textarea') // Nested textarea is focused and its is not a viewport.
    ) {
      return;
    }
    // Normalize mouse wheel delta among browsers and devices.
    // Usually `event.delta*` in IE 100-400, in Chrome 100-300, in FF 3-10, and these values may even
    // differ in different browser versions. Those W3C guys should better have standard on that.
    let dx = e.deltaX / Math.abs(e.deltaX) * wheelStepX * this.exposesX || 0,
        dy = e.deltaY / Math.abs(e.deltaY) * wheelStepY * this.exposesY || 0;
    if (
      (dx < 0 && !targetX) || (dx > 0 && targetX == scrollMaxX) ||
      (dy < 0 && !targetY) || (dy > 0 && targetY == scrollMaxY)
    ) {
      // Content is scrolled to its possible limit.
      if (!propagateWheelScroll) {
        e.preventDefault();
      }
      return;
    }
    // By default, Google Chrome changes scrolling orientation if shift key is pressed,
    // so propagate this behavior to other browsers as well.
    if (e.shiftKey && !dx) {
      dx = dy;
      dy = 0;
    }
    if (swapWheelAxes) {
      [dx, dy] = [dy, dx];
    }
    e.preventDefault();
    this.scrollBy(dx, dy, wheelScrollDuration);
  };

  onKeyDown = e => {
    const {keyboardStepX, keyboardStepY, disabled, captureKeyboard, keyboardScrollDuration} = this.props;
    let el = e.target,
        tagName = el.tagName.toLocaleLowerCase();
    if (
      disabled || e.isDefaultPrevented() || // Event prevented.
      !captureKeyboard || !/3[3456789]|40/.test(String(e.keyCode)) || // Keyboard events prevented.
      tagName == 'textarea' || (tagName == 'input' && el.type == 'text') // Nested textarea or input is focused.
    ) {
      return;
    }
    // Prevent page scrolling.
    e.preventDefault();
    switch (e.keyCode) {
      case 36: // Home
        this.scrollTo(0, 0, keyboardScrollDuration);
        break;
      case 35: // End
        this.scrollTo(this.scrollMaxX, this.scrollMaxY, keyboardScrollDuration);
        break;
      case 33: // PgUp
      case 34: // PgDn
        let dy = this.viewport.clientHeight,
            dx = this.viewport.clientWidth;
        if (e.keyCode == 33) {
          // For PageUp invert direction.
          dy *= -1;
          dx *= -1;
        }
        if (e.shiftKey) {
          this.scrollBy(dx, 0, keyboardScrollDuration);
        } else {
          this.scrollBy(0, dy, keyboardScrollDuration);
        }
        break;
      case 38: // Up
        this.scrollBy(0, -keyboardStepY, keyboardScrollDuration);
        break;
      case 40: // Down
        this.scrollBy(0, keyboardStepY, keyboardScrollDuration);
        break;
      case 37: // Left
        this.scrollBy(-keyboardStepX, 0, keyboardScrollDuration);
        break;
      case 39: // Right
        this.scrollBy(keyboardStepX, 0, keyboardScrollDuration);
        break;
    }
  };

  onDragStart(e, axis) {
    const {disabled, captureHandleDrag} = this.props;
    if (disabled || !captureHandleDrag || e.button != 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    let track;
    if (axis == ScrollAxes.X) {
      track = this.trackX;
    } else {
      track = this.trackY;
    }
    const OFFSET_X = e.clientX - this.handleX.offsetLeft,
          OFFSET_Y = e.clientY - this.handleY.offsetTop;

    let onDrag = e => {
      if (!this.viewport || e.button != 0) {
        onDragEnd(); // Component was unmounted or button was released.
      }
      if (axis == ScrollAxes.X) {
        var x = this.scrollMaxX * (e.clientX - OFFSET_X) / this.trackMaxX;
      } else {
        var y = this.scrollMaxY * (e.clientY - OFFSET_Y) / this.trackMaxY;
      }
      this.scrollTo(x, y, 0);
    };

    let onDragEnd = e => {
      removeEventListener('mousemove', onDrag);
      removeEventListener('mouseup', onDragEnd);
      if (this.viewport) {
        // Ensure component is mounted.
        track.classList.remove('scroll-box__track--dragged');
      }
    };

    addEventListener('mousemove', onDrag);
    addEventListener('mouseup', onDragEnd);
    track.classList.add('scroll-box__track--dragged');
  };

  onDragStartX = e => this.onDragStart(e, ScrollAxes.X);

  onDragStartY = e => this.onDragStart(e, ScrollAxes.Y);

  onFastTrack(e, axis) {
    const {disabled, fastTrack, fastTrackDuration} = this.props;
    if (disabled || e.button != 0) {
      return; // Component is disabled or secondary mouse button is being pressed.
    }
    let x, y;
    const {clientWidth, clientHeight, scrollWidth, scrollHeight} = this.viewport,
          POINTER_X = e.clientX - this.trackX.getBoundingClientRect().left,
          POINTER_Y = e.clientY - this.trackY.getBoundingClientRect().top;

    switch (fastTrack) {

      case FastTrack.PAGING:
        if (axis == ScrollAxes.X) {
          x = this.targetX + (1 - 2 * (POINTER_X < this.handleX.offsetLeft)) * clientWidth;
        } else {
          y = this.targetY + (1 - 2 * (POINTER_Y < this.handleY.offsetTop)) * clientHeight;
        }
        break;

      case FastTrack.GOTO:
        if (axis == ScrollAxes.X) {
          x = POINTER_X / this.trackX.clientWidth * scrollWidth - clientWidth / 2;
        } else {
          y = POINTER_Y / this.trackY.clientHeight * scrollHeight - clientHeight / 2;
        }
        break;

      default: return;
    }
    this.scrollTo(x, y, fastTrackDuration);
  };

  onFastTrackX = e => this.onFastTrack(e, ScrollAxes.X);

  onFastTrackY = e => this.onFastTrack(e, ScrollAxes.Y);

  _updateTrackHoverStatus(e, track) {
    const {clientX, clientY} = e,
          {hoverProximity} = this.props,
          {width, left, top, height} = track.getBoundingClientRect();

    track.classList.toggle('scroll-box__track--hover',
      clientY - height - top < hoverProximity && top - clientY < hoverProximity &&
      clientX - width - left < hoverProximity && left - clientX < hoverProximity);
  }

  onCursorApproachingTrack = e => {
    let {nativeScroll, disabled, captureHandleDrag, fastTrack} = this.props;
    // Do not track cursor proximity for native scroll bar, when handle is being dragged,
    // when selection is in progress or when another handle is being dragged (even on another
    // scroll box instance).
    if (nativeScroll || disabled || (!captureHandleDrag && fastTrack == FastTrack.OFF) || e.buttons > 0) {
      return;
    }
    // Update track hover status only if it is actually in use.
    if (this.exposesX) {
      this._updateTrackHoverStatus(e, this.trackX);
    }
    if (this.exposesY) {
      this._updateTrackHoverStatus(e, this.trackY);
    }
  };

  _updateReferences() {
    let {refs} = this;
    for (let ref in refs) {
      if (refs.hasOwnProperty(ref)) {
        this[ref] = findDOMNode(refs[ref]);
      }
    }
    this.viewport = findDOMNode(this).lastChild;
  }

  componentDidMount() {
    let requestForceSync = () => {
      if (!this.viewport) {
        return; // Component was unmounted.
      }
      if (window.requestAnimationFrame) {
        requestAnimationFrame(requestForceSync);
      } else {
        setTimeout(requestForceSync, 1000 / 30);
      }
      this._forceSync();
    };
    this._updateReferences();
    requestForceSync();
    addEventListener('mousemove', this.onCursorApproachingTrack);
  }

  componentDidUpdate() {
    this._updateReferences();
    this._forceSync();
  }

  componentWillUnmount() {
    this.viewport = null;
    removeEventListener('mousemove', this.onCursorApproachingTrack);
  }

  render() {
    const {axes, trackXChildren, trackYChildren, handleXChildren, handleYChildren, disabled, nativeScroll, outset, className, children, style} = this.props;
    let classNames = ['scroll-box'];
    if (className) {
      classNames.unshift(className);
    }
    if (disabled) {
      classNames.push('scroll-box--disabled');
    }
    if (nativeScroll) {
      classNames.push('scroll-box--native');
    }
    if (outset) {
      classNames.push('scroll-box--outset');
    }
    if (axes.indexOf(ScrollAxes.X) > -1) {
      classNames.push('scroll-box--has-axis-x');
    }
    if (axes.indexOf(ScrollAxes.Y) > -1) {
      classNames.push('scroll-box--has-axis-y');
    }
    return (
      <div style={style}
           className={classNames.join(' ')}
           onScroll={this.onScroll}
           onWheel={this.onWheel}
           onKeyDown={this.onKeyDown}
           onTouchStart={this.onTouchStart}
           onTouchMove={this.onTouchMove}
           onTouchEnd={this.onTouchEnd}
           onTouchCancel={this.onTouchEnd}
           tabIndex="-1">
        <div className="scroll-box__track scroll-box__track--x"
             onMouseDown={this.onFastTrackX}
             ref="trackX">
          <div className="scroll-box__handle scroll-box__handle--x"
               onMouseDown={this.onDragStartX}
               ref="handleX">
            {handleXChildren}
          </div>
          {trackXChildren}
        </div>
        <div className="scroll-box__track scroll-box__track--y"
             onMouseDown={this.onFastTrackY}
             ref="trackY">
          <div className="scroll-box__handle scroll-box__handle--y"
               onMouseDown={this.onDragStartY}
               ref="handleY">
            {handleYChildren}
          </div>
          {trackYChildren}
        </div>
        {React.Children.only(children)}
      </div>
    );
  }
}
