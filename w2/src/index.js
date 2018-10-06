import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import ScrollIntoViewIfNeeded from 'react-scroll-into-view-if-needed'

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

console.log(css`
  color: white;
  background: ${theme.blue};
`)

const Pre = styled.pre`
  margin-right: 2px;
  padding: 2px;
  background: #fefefe;
  padding: 2px;
  max-width: 82ch;
  max-height: 40ch;
  overflow: auto;
  overflow-wrap: break-word;

  ${props => {
    if (!('exitcode' in props)) return

    let base = css`
      white-space: pre-wrap;
      word-wrap: break-word;
    `

    if (props.selected) return css`
      color: #eee;
      background: ${theme.green};
    `.concat(base)

    if (props.exitcode == 0) return css`
      color: #eee;
      background: ${theme.blue};
    `.concat(base)

    return css`
      color: #eee;
      background: ${theme.red};
    `.concat(base)
    }}
`

const Starred = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  opacity: 0.9;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #F2C14E;
  justify-content: center;

  & pre {
    background: #7E6551;
    color: #eee;
    margin-right: 2px;
  }
`

class Node extends Component {
  render() {
    let { run, stdout, stderr, exitcode } = this.props.data.node[this.props.node]
    return <ScrollIntoViewIfNeeded
      options={{
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
        }}
      active={ this.props.node==this.props.data.selected }>
        <Pre
          selected={ this.props.node==this.props.data.selected }
          exitcode={ exitcode }
        >
          { atob(run).trim() }
        </Pre>
        { stderr != "" && <Pre>{ atob(stderr).trim() }</Pre> }
        { stdout != "" && <Pre>{ atob(stdout).trim() }</Pre> }
    </ScrollIntoViewIfNeeded>
  }
}

class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      root: [],
      starred: [],
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

    return <div>
      { Tree(this.state.root) }
      { (this.state.starred.length > 0) &&
      <Starred>
      { this.state.starred.map((x) => <pre>
        { atob(this.state.node[x].stdout).trim() }
      </pre>) }
      </Starred>
      }
    </div>
  }
}


ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
