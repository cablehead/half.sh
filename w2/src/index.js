import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import update from 'immutability-helper'

import styled from 'styled-components'
import { injectGlobal, css } from 'styled-components'

import { reset } from 'styled-reset'


const theme = {
  blue: '#659BB6',
  lightbrown: '#938581',
  green: '#5FAD56',
  red: '#F24D4D',
}


injectGlobal`
  ${reset}
  body {
    font-family: 'Inconsolata';
    font-size: 10pt;
    color: #333;
    margin: 2px;
    background: ${theme.lightbrown};
  }
`

const Pre = styled.pre`
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 2px;
  background: #fefefe;
  padding: 2px;
  max-width: 82ch;
  max-height: 40ch;
  overflow: auto;

  ${props => ('exitcode' in props) && (
    props.exitcode == 0
      && css`
        color: #eee;
        background: ${theme.blue};
      `
      || css`
        color: #eee;
        background: ${theme.red};
      `) }
`


class Node extends Component {
  render() {
    let { run, stdout, stderr, exitcode } = this.props.data.node[this.props.node]
    return <div>
      <div>
        <Pre exitcode={ exitcode }>
          { atob(run).trim() }
        </Pre>
        { stderr != "" && <Pre>{ atob(stderr).trim() }</Pre> }
        { stdout != "" && <Pre>{ atob(stdout).trim() }</Pre> }
      </div>
      { (this.props.data.tree[this.props.node] || []).map(
        (x) => <Node key={ x } node={ x } data={ this.props.data } /> ) }
    </div>
  }
}

class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      root: [],
    }
  }

  componentDidMount() {
    var ws
    var self = this
    this.mounted = true

    const reconnect = () => {
      console.log('reconnect', ws, self.mounted)
      ws = new WebSocket('ws://localhost:8000/data')

      ws.onopen = function() {
        console.log('connected')
      }

      ws.onmessage = function (event) {
        var data = JSON.parse(event.data)
        self.setState(update(self.state, data))
      }

      ws.onclose = function(event) {
        console.log('close', event)
        ws = null
        setTimeout(reconnect, 1000)
      }
    }
    reconnect()
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    if (!this.state.root.length) return <div><Pre>...</Pre></div>
    let { root, node } = this.state
    return <Node data={ this.state } node={ root[0] } />
  }
}


ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
