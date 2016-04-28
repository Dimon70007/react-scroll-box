import 'classlist-polyfill';

import React, {Component} from 'react';
import ReactDOM, {findDOMNode} from 'react-dom';
import classNames from 'classnames';

import './index.less';
import {GenericScrollBox, FastTrack, ScrollAxes} from '../main/GenericScrollBox';

function toPositiveInteger(val) {
  return Math.max(0, val / 1);
}

class Demo extends Component {

  state = {
    nativeScroll: null,
    axes: ScrollAxes.XY,
    hoverProximity: 50,
    disabled: false,
    outset: true,
    scrollMinX: 2,
    scrollMinY: 2,

    captureHandleDrag: true,

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
    propagateWheelScroll: false,
    swapWheelAxes: false,
    wheelScrollDuration: 100
  };

  onKeyPressNumbersOnly(e) {
    if (e.charCode < 48 || e.charCode > 57) {
      e.preventDefault();
    }
  }

  componentDidMount() {
    this.refs.scrollBox.scrollTo(this.refs.scrollBox.scrollMaxX / 2,  0);
    this.refs.scrollBox.scrollTo(this.refs.scrollBox.scrollMaxX / 2, this.refs.scrollBox.scrollMaxY / 2, 5000);
  }

  render() {
    let {nativeScroll, ...props} = this.state;
    if (nativeScroll == null) {
      props.nativeScroll = 'orientation' in window;
    } else {
      props.nativeScroll = nativeScroll;
    }
    return (
      <div className="container">
        <div className="row">

          <GenericScrollBox {...props} ref="scrollBox" className="scroll-box--example scroll-box--wrapped">
            <div className="scroll-box__viewport">
              <div className="scroll-box__bg">
                <h1><span className="light">React</span> <abbr about="Scroll" aria-label="Scroll">Scro<i className="fa fa-long-arrow-up"/><i className="fa fa-long-arrow-down"/></abbr> Box <span className="light">0.2.4</span></h1>
              </div>
            </div>
          </GenericScrollBox>

        </div>
        <div className="row">
          <form>
            <div className="col-md-4">
              <h3>General</h3>

              <fieldset className="form-group">
                <p><a name="native-scroll"/><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">nativeScroll</code></p>
                <p>Use native scrollbars. By default, this flag is set to <code>true</code> on mobile platforms and <code>false</code> on desktops. Paltforms are distinguished by presence of <code>window.orientation</code>.</p>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="native-scroll"
                           checked={this.state.nativeScroll === false}
                           onChange={e => this.setState({nativeScroll: false})}/>
                    Custom scrollbars
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="native-scroll"
                           checked={this.state.nativeScroll === true}
                           onChange={e => this.setState({nativeScroll: true})}/>
                    Native scrollbars
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="native-scroll"
                           checked={this.state.nativeScroll === null}
                           onChange={e => this.setState({nativeScroll: null})}/>
                    Platform-dependent scrollbars
                  </label>
                </div>
            </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{ScrollAxes}'}</code> <code className="prop__name">axes</code></p>
                <p>Scroll axes which are managed by scroll box. If scroll axis is not listed then corresponding scroll offset would be constantly equal to 0.</p>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="axes"
                           checked={this.state.axes === ScrollAxes.X}
                           onChange={e => this.setState({axes: ScrollAxes.X})}/>
                    <code>ScrollAxes.X</code>
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="axes"
                           checked={this.state.axes === ScrollAxes.Y}
                           onChange={e => this.setState({axes: ScrollAxes.Y})}/>
                    <code>ScrollAxes.Y</code>
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="axes"
                           checked={this.state.axes === ScrollAxes.XY}
                           onChange={e => this.setState({axes: ScrollAxes.XY})}/>
                    <code>ScrollAxes.XY</code>
                  </label>
                </div>
              </fieldset>

              <fieldset className={classNames('form-group', {'form-group--disabled': props.nativeScroll})}>
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">hoverProximity</code></p>
                <p>
                  <a href="#native-scroll"
                     className={classNames({hidden: !props.nativeScroll})}>
                    <i className="fa fa-fw fa-warning fa--left"/>Requires custom scrollbars to be enabled
                  </a>
                </p>
                <p>Maximum distance between cursor and scroll track edge where track is considered to be hovered. Useful when you want to have thin scrollbars but don't want make user aim precisely to grab them. Set to 0 to disable hover proximity detection.</p>
                <div className="input-group">
                  <input type="number"
                         disabled={props.nativeScroll}
                         className="form-control"
                         value={this.state.hoverProximity}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({hoverProximity: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">disabled</code></p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           checked={this.state.disabled}
                           onChange={e => this.setState({disabled: e.target.checked})}/>
                    Disable scroll box
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">outset</code></p>
                <p>Display scrollbars outside of scrollable area. Outset scrllbars do not require additional space and do not affect surrounding layout.</p>
                <p>On mobile devices when native scrollbars are used this property has no effect because scrollbars have zero width and thus don't crop any space from viewport.</p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           checked={this.state.outset}
                           onChange={e => this.setState({outset: e.target.checked})}/>
                    Ouset scrollbars
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">scrollMinX</code> <code className="prop__name">scrollMinY</code></p>
                <p>Minimum difference in content and viewport sizes to enable scrolling.</p>
                <div className="input-group">
                  <div className="input-group-addon">X</div>
                  <input type="number"
                         className="form-control"
                         value={this.state.scrollMinX}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({scrollMinX: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
                <div className="input-group">
                  <div className="input-group-addon">Y</div>
                  <input type="number"
                         className="form-control"
                         value={this.state.scrollMinY}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({scrollMinY: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
              </fieldset>

            </div>

            <div className="col-md-4">
              <h3>Keyboard</h3>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">captureKeyboard</code></p>
                <p>Use keyboard for scrolling when scroll box viewport or its nested content is focused. Keyboard is not captured for <code>&lt;input type="text"/&gt;</code> and <code>&lt;textarea/&gt;</code> elements placed inside scroll box.</p>
                <p><kbd>PgUp</kbd> <kbd>PgDown</kbd> <kbd>Home</kbd> <kbd>End</kbd> and arrow keys are captured.</p>
                <p>You can page-scroll alternate axis with <nobr><kbd>Shift</kbd> + <kbd>PgUp</kbd></nobr> and <nobr><kbd>Shift</kbd> + <kbd>PgDown</kbd></nobr> shortcuts.</p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           checked={this.state.captureKeyboard}
                           onChange={e => this.setState({captureKeyboard: e.target.checked})}/>
                    Use keyboard scrolling
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">keyboardStepX</code> <code className="prop__name">keyboardStepY</code></p>
                <p>Distance to scroll by when arrow keys are pressed.</p>
                <div className="input-group">
                  <div className="input-group-addon">X</div>
                  <input type="number"
                         className="form-control"
                         value={this.state.keyboardStepX}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({keyboardStepX: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
                <div className="input-group">
                  <div className="input-group-addon">Y</div>
                  <input type="number"
                         className="form-control"
                         value={this.state.keyboardStepY}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({keyboardStepY: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">keyboardScrollDuration</code></p>
                <p>Keyboard smooth scrolling animation duration. Set to 0 to disable smooth keyboard scrolling.</p>
                <div className="input-group">
                  <input type="number"
                         className="form-control"
                         value={this.state.keyboardScrollDuration}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({keyboardScrollDuration: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">msec</div>
                </div>
              </fieldset>

              <h3><br/>Fast Tracking</h3>
              <p>
                <a href="#native-scroll"
                   className={classNames({hidden: !props.nativeScroll})}>
                  <i className="fa fa-fw fa-warning fa--left"/>Requires custom scrollbars to be enabled
                </a>
              </p>

              <fieldset className={classNames('form-group', {'form-group--disabled': props.nativeScroll})}>
                <p><a name="fast-track"/><code className="prop__type">{'{FastTrack}'}</code> <code className="prop__name">fastTrack</code></p>
                <p>Defines expected behavior when user clicks on scroll track.</p>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="fast-track"
                           disabled={props.nativeScroll}
                           checked={this.state.fastTrack === FastTrack.PAGING}
                           onChange={e => this.setState({fastTrack: FastTrack.PAGING})}/>
                    <code>FastTrack.PAGING</code>
                    <p><small>Content is scrolled by one page.</small></p>
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="fast-track"
                           disabled={props.nativeScroll}
                           checked={this.state.fastTrack === FastTrack.GOTO}
                           onChange={e => this.setState({fastTrack: FastTrack.GOTO})}/>
                    <code>FastTrack.GOTO</code>
                    <p><small>Content is scrolled directly to the corresponding position.</small></p>
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio"
                           name="fast-track"
                           disabled={props.nativeScroll}
                           checked={this.state.fastTrack === FastTrack.OFF}
                           onChange={e => this.setState({fastTrack: FastTrack.OFF})}/>
                    <code>FastTrack.OFF</code>
                    <p><small>Prevent fast tracking.</small></p>
                  </label>
                </div>
              </fieldset>

              <fieldset className={classNames('form-group', {'form-group--disabled': props.nativeScroll})}>
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">fastTrackDuration</code></p>
                <p>Animation duration of fast track smooth scroll.</p>
                <div className="input-group">
                  <input type="number"
                         disabled={props.nativeScroll}
                         className="form-control"
                         value={this.state.fastTrackDuration}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({fastTrackDuration: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">msec</div>
                </div>
              </fieldset>

            </div>

            <div className="col-md-4">
              <h3>Mouse</h3>

              <fieldset className={classNames('form-group', {'form-group--disabled': props.nativeScroll})}>
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">captureHandleDrag</code></p>
                <p>
                  <a href="#native-scroll"
                     className={classNames({hidden: !props.nativeScroll})}>
                    <i className="fa fa-fw fa-warning fa--left"/>Requires custom scrollbars to be enabled
                  </a>
                </p>
                <p>Allow user to drag scroll handles.</p>
                <p>If handle drag is disabled along with enabled <a href="#fast-track">fast track</a> then clicking on a handle would cause fast tracking.</p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           disabled={props.nativeScroll}
                           checked={this.state.captureHandleDrag}
                           onChange={e => this.setState({captureHandleDrag: e.target.checked})}/>
                    Draggable handles
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">captureWheel</code></p>
                <p>Use mouse wheel for scrolling. You can scroll alternate axis with <kbd>Shift</kbd> key is pressed.</p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           checked={this.state.captureWheel}
                           onChange={e => this.setState({captureWheel: e.target.checked})}/>
                    Use mouse wheel
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">wheelStepX</code> <code className="prop__name">wheelStepY</code></p>
                <p>Wheel scrolling distance.</p>
                <div className="input-group">
                  <div className="input-group-addon">X</div>
                  <input type="number"
                         className="form-control"
                         value={this.state.wheelStepX}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({wheelStepX: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
                <div className="input-group">
                  <div className="input-group-addon">Y</div>
                  <input type="number"
                         className="form-control"
                         value={this.state.wheelStepY}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({wheelStepY: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">px</div>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">propagateWheelScroll</code></p>
                <p>Propagate wheel scroll event to parent if scrolling reached maximum or minimum value.</p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           checked={this.state.propagateWheelScroll}
                           onChange={e => this.setState({propagateWheelScroll: e.target.checked})}/>
                    Propagate wheel scroll
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{boolean}'}</code> <code className="prop__name">swapWheelAxes</code></p>
                <div className="checkbox">
                  <label>
                    <input type="checkbox"
                           checked={this.state.swapWheelAxes}
                           onChange={e => this.setState({swapWheelAxes: e.target.checked})}/>
                    Swap wheel scrolling axes
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <p><code className="prop__type">{'{int}'}</code> <code className="prop__name">wheelScrollDuration</code></p>
                <p>Wheel smooth scrolling animation duration. Set to 0 to disable smooth whee scrolling.</p>
                <div className="input-group">
                  <input type="number"
                         className="form-control"
                         value={this.state.wheelScrollDuration}
                         onKeyPress={this.onKeyPressNumbersOnly}
                         onChange={e => this.setState({wheelScrollDuration: toPositiveInteger(e.target.value)})}/>
                  <div className="input-group-addon">msec</div>
                </div>
              </fieldset>
            </div>

          </form>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Demo/>, document.getElementById('demo'));
