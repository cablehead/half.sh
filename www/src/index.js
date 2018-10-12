import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import ScrollIntoViewIfNeeded from 'react-scroll-into-view-if-needed'

import update from 'immutability-helper'

import styled from 'styled-components'
import { injectGlobal, css } from 'styled-components'

import { reset } from 'styled-reset'


const theme = {
  white: '#eee',
  grey: '#ccc',
  black: '#666',
  blue: '#659BB6',
  green: '#5FAD56',
  red: '#F24D4D',
  brown: '#47403e',
}


injectGlobal`
  ${reset}

  html, body {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: 'Inconsolata';
    font-weight: 100;
    font-size: 10pt;
    color: ${theme.grey};
    background: ${theme.brown};
  }

  pre {
    margin-right: 1px;
    padding: 2px;
    border-right: 1px solid ${theme.black};
  }
`

const Tab = styled.div`
  height: 1em;
  margin-right: 1px;
  padding: 2px;
  ${props => {
    if (props.selected) return css`
      color: ${theme.white};
    `
  }}
`

const Panel = styled.pre`
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
      color: ${theme.white};
      background: ${theme.blue};
    `.concat(base)

    if (props.exitcode == 0) return css`
      color: ${theme.grey};
      background: ${theme.black};
    `.concat(base)

    return css`
      color: #eee;
      background: ${theme.red};
    `.concat(base)
    }}
`

const Starred = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid ${theme.black};
  margin-bottom: 1px;
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
        <Panel
          selected={ this.props.selected }
          exitcode={ exitcode }
        >
          { atob(run).trim() }
        </Panel>
        { stderr != "" && <Panel>{ atob(stderr).trim() }</Panel> }
        { stdout != "" && <Panel>{ atob(stdout).trim() }</Panel> }
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

    if (!Object.keys(project).length) return <div><Panel>...</Panel></div>

    const starred = Object.entries((project[P] || {}).node)
      .filter(([k, v]) => v.starred)
      .map(([k, v]) => { return {k: k, o: v.stdout} })
      .sort((a, b) => (a.k - b.k))

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
          <Node node={ C.node[x] } selected={ x == project[P].N } />
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

      { (starred.length > 0) &&
      <Starred>{
        starred.map((x) => <pre key={ x.k }>{ atob(x.o).trim() }</pre>)
      }</Starred>
      }

      <div style={{ flex: 1, overflow: 'auto' }}>
      { Tree(project[P] || {}, 'dev') }
      </div>

      <div style={{ display: 'flex', marginBottom: '1px' }}>
        { Object.keys(project).sort().map((k) =>
          <Tab key={ k } selected={ P == k }>
            { project[k].name }
          </Tab>
        ) }
      </div>

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
