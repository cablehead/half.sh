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
  margin-right: 2px;
  padding: 2px;
  background: #fefefe;
  padding: 2px;
  max-width: 82ch;
  max-height: 40ch;
  overflow: auto;

  ${props => {
    if (!('exitcode' in props)) return

    if (props.selected) return css`
      color: #eee;
      background: ${theme.green};
    `

    if (props.exitcode == 0) return css`
      color: #eee;
      background: ${theme.blue};
    `
    return css`
      color: #eee;
      background: ${theme.red};
    `
    }}
`


class Node extends Component {
  render() {
    let { run, stdout, stderr, exitcode } = this.props.data.node[this.props.node]
    return <div>
        <Pre
          selected={ this.props.node==this.props.data.selected }
          exitcode={ exitcode }
        >
          { atob(run).trim() }
        </Pre>
        { stderr != "" && <Pre>{ atob(stderr).trim() }</Pre> }
        { stdout != "" && <Pre>{ atob(stdout).trim() }</Pre> }
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
        console.log(data)
        self.setState(update(self.state, data))

        console.log(self.state)
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

    let Tree = (root) => root.sort().map((x) => {
        return <div key={ x } style={{
          display: "flex",
          flexWrap: "nowrap",
          }}>
          <Node node={ x } data={ this.state } />
          { this.state.tree[x] &&
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}>
                { this.state.tree[x] && Tree(this.state.tree[x]) }
            </div> }
        </div>
      })

    return Tree(this.state.root)
  }
}


ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
