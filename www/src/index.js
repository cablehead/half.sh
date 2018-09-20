import './reset.css'
import './global.css'


import React, { Component } from 'react'
import ReactDOM from 'react-dom'


function scrollTo(element, top, left, duration) {
    var increment = 20

    var state = {
      currentTime: 0,
      top: {
        start: element.scrollTop,
        change: top - element.scrollTop,
        currentTime: 0,
      },
      left: {
        start: element.scrollLeft,
        change: left - element.scrollLeft,
        currentTime: 0,
      },
    }

    var animateScroll = function() {
        state.currentTime += increment;

        var t = state.currentTime / duration;

        element.scrollTop = state.top.start + (
          Motion.easeOutQuad(t) * state.top.change)
        element.scrollLeft = state.left.start + (
          Motion.easeOutQuad(t) * state.left.change)

        if(state.currentTime < duration) {
            setTimeout(animateScroll, increment);
        }
    };
    animateScroll();
}


var Motion = {
  // no easing, no acceleration
  linear: function (t) { return t },
  // accelerating from zero velocity
  easeInQuad: function (t) { return t*t },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t*(2-t) },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
  // accelerating from zero velocity
  easeInCubic: function (t) { return t*t*t },
  // decelerating to zero velocity
  easeOutCubic: function (t) { return (--t)*t*t+1 },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
  // accelerating from zero velocity
  easeInQuart: function (t) { return t*t*t*t },
  // decelerating to zero velocity
  easeOutQuart: function (t) { return 1-(--t)*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
}


import hljs from 'highlight.js'
import 'highlight.js/styles/tomorrow.css'

const PP = (s) => {
  s = JSON.stringify(s, null, 2)
  s = s.split('\n').slice(0, 10).join('\n')
  s = hljs.highlightAuto(s)
  return s.value
}


class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: '',
      seeds: [],
      starred: [],
      tree: {},
      values: {},
    }
  }

  componentDidMount() {
    var ws;
    var parent = this
    this.mounted = true

    const reconnect = () => {
      console.log("reconnect", ws, parent.mounted)
      ws = new WebSocket('ws://localhost:8000/data')

      ws.onopen = function() {
        console.log("connected")
      }

      ws.onmessage = function (event) {
        var command = JSON.parse(event.data)
        parent.setState(command)
      }

      ws.onclose = function(event) {
        console.log("close", event);
        ws = null
        setTimeout(reconnect, 1000)
      }
    }
    reconnect()
  }

  componentWillUnmount() {
    this.mounted = false
  }

  componentDidUpdate() {
    var el = document.querySelector('.selected')
    if (!el) return
    if (el == this.prev_selected) return
    this.prev_selected = el
    scrollTo(
      window.document.body,
      (el.offsetTop - el.scrollTop + el.clientTop) - 100,
      (el.offsetLeft - el.scrollLeft + el.clientLeft) - 100,
      150)
  }

  render() {
    return <div>
      { (this.state.starred.length > 0) &&
        <div className="starred">
        {
          this.state.starred.map(
            (x) => <div key={x}><div className="node">
              <pre><code>
                { atob(this.state.values[x].out).trim() }
              </code></pre>
            </div></div>)
        }
        </div>
      }

      <div className="row">
        {
          this.state.seeds.map((x) => <Bar
            key={x}
            tree={ this.state.tree }
            values={ this.state.values }
            selected={ this.state.selected }
            node={ x } />
          )
        }
      </div>
    </div>
  }
}


class Bar extends Component {
  render() {
    var { tree, values, selected, node } = this.props
    tree = tree || {}
    if (!values[node]) return ''
    return <div>
      <div className={ 'node ' + (node == selected ? 'selected':'') }>
        <pre className="command">
          <code>{ atob(values[node].command).trim() }
          </code></pre>
        <pre><code>{ atob(values[node].out).trim() } </code></pre>
      </div>

      { (tree[node]) && <div className="row">
        {
          tree[node].map((x) => <Bar
              key={x}
              tree={tree}
              values={values}
              node={x}
              selected={selected}
            />)
        }
        </div>
      }
    </div>
  }
}


ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
