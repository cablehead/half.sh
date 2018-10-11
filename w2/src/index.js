import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import ScrollIntoViewIfNeeded from 'react-scroll-into-view-if-needed'

import update from 'immutability-helper'

import styled from 'styled-components'
import { injectGlobal, css } from 'styled-components'

import { reset } from 'styled-reset'


const theme = {
  white: '#fefefe',
  blue: '#659BB6',
  lightbrown: '#938581',
  green: '#5FAD56',
  red: '#F24D4D',
}


injectGlobal`
  ${reset}

  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: 'Inconsolata';
    font-size: 10pt;
    color: #333;
    background: ${theme.lightbrown};
  }
`

const Tab = styled.div`
  height: 1em;
  margin-right: 2px;
  padding: 2px;
  background: ${theme.white};
  ${props => {
    if (props.selected) return css`
      color: #eee;
      background: ${theme.green};
    `
  }}
`

const Pre = styled.pre`
  margin-right: 2px;
  background: ${theme.white};
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
    let { run, stdout, stderr, exitcode } = this.props.node
    return <ScrollIntoViewIfNeeded
      options={{
        behavior: 'smooth',
        scrollMode: 'if-needed',
        block: 'nearest',
        inline: 'nearest',
        }}
      active={ this.props.selected }>
        <Pre
          selected={ this.props.selected }
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
      project: false,
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
    const { P, project } = this.state

    if (!Object.keys(project).length) return <div><Pre>...</Pre></div>

    let Tree = (C, stdin) => {
      const nodes = Object.entries(C.node)
        .filter(([k, v]) => v.stdin == stdin)
        .map(([k, v]) => k)

      if (!nodes.length) return

      return <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}>
        {
        nodes.sort().map((x) => <div key={ x } style={{
          display: "flex",
          flexWrap: "nowrap",
          }}>
          <Node node={ C.node[x] } selected={ x == C.N } />
          { Tree(C, x) }
        </div>)
        }
      </div>
    }

    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        }}>
      <div style={{ display: 'flex' }}>
        { Object.keys(project).sort().map((k) =>
          <Tab key={ k } selected={ P == k }>
            { project[k].name }
          </Tab>
        ) }
      </div>
      { Tree(project[P] || {}, 'dev') }
    </div>

    let Noog = (root) => root.sort().map((x) => {
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
                { Tree(this.state.tree[x]) }
            </div> }
        </div>
      })

      return <div>

      <div style={{ flex: 1, overflow: 'auto' }}>
      { Tree(this.state.root) }
      </div>

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
