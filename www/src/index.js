import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import ScrollIntoViewIfNeeded from 'react-scroll-into-view-if-needed'

import update from 'immutability-helper'

import styled from 'styled-components'
import { injectGlobal, css } from 'styled-components'

import { reset } from 'styled-reset'

import ReactHtmlParser from 'react-html-parser'


const theme = {
  white: '#fefefe',
  grey: '#ccc',
  black: '#666',
  blue: '#508ba9',
  green: '#5FAD56',
  red: '#F24D4D',
  brown: '#383331',
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
    background: #867976;
  }

  pre {
    margin-right: 2px;
    padding: 2px;
  }
`

const Tab = styled.div`
  height: 1em;
  margin-right: 1px;
  padding: 2px;
  background: ${theme.white}
  ${props => {
    if (props.selected) return css`
      background: ${theme.green}
    `
  }}
`

const Panel = styled.pre`
  max-width: 82ch;
  max-height: 40ch;
  overflow: auto;
  overflow-wrap: break-word;
  background: ${theme.white};

  ${props => {
    if (!('exitcode' in props)) return

    let base = css`
      white-space: pre-wrap;
      word-wrap: break-word;
    `

    if (props.selected) return css`
      background: ${theme.blue};
      color: ${theme.white};
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
  background: #ada900;
  margin-bottom: 1px;
`

class Stdout extends Component {
  render() {
    let { stdout, raw } = this.props
    if (stdout != "") {
      stdout = atob(stdout).trim()
    }

    if (!raw) return <Panel>{ stdout.substring(0, 2000) }</Panel>
    return <div style={{width: '80ch', height: '40ch'} }>
      <Custom code={ stdout } />
    </div>
  }
}


class Node extends Component {
  render() {
    let { run, stdout, stderr, exitcode, raw } = this.props.node

    if (atob(run).trim() == 'geo2map') raw = true

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
          { this.props.edit && <textarea
              cols="60"
              rows="2"
              autofocus="autofocus"
              onFocus={
                (ev) => ev.target.setSelectionRange(0, ev.target.value.length)
              }
              onKeyDown={
                (ev) => {
                  if (ev.key == 'Enter' && ev.metaKey) {
                    this.props.editNode(
                      this.props.P, this.props.N, ev.target.value)
                  }
                }
              }
              >
              { atob(run).trim() }
            </textarea>

            || atob(run).trim()
          }
        </Panel>
        { stderr != "" && <Panel>{ atob(stderr).trim() }</Panel> }
        { stdout != "" && <Stdout stdout={ stdout } raw={ raw } /> }
    </ScrollIntoViewIfNeeded>
  }
}


class Custom extends Component {
  componentDidMount() {
    console.log('did mount')
    eval(this.props.code)((this.refs.el))
  }

  shouldComponentUpdate() {
    let should = (this.props.code != this.last)
    this.last = this.props.code
    return should
  }

  componentDidUpdate() {
    console.log('did update')
    eval(this.props.code)((this.refs.el))
  }

  render() {
    return <div style={{ width: '100%', height: '100%' }} ref="el"></div>
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
      ws = new WebSocket('ws://' + window.location.hostname + ':8000/data')
      this.ws = ws

      ws.onopen = function() {
        console.log('connected')
      }

      ws.onmessage = function (event) {
        var data = JSON.parse(event.data)

        data = update(self.state, data)

        if (Object.keys(data.project).length) {
          if (!data.P) data.P = Object.keys(data.project)[0]
          if (!data.project[data.P].N) {
            const nodes = Object.entries(data.project[data.P].node)
              .filter(([k, v]) => v.stdin == 'dev')
              .map(([k, v]) => k)
            if (nodes.length) data.project[data.P].N = nodes[0]
          }
        }

        self.setState(data)
      }

      ws.onclose = function(event) {
        console.log('close', event)
        ws = null
        setTimeout(reconnect, 1000)
      }
    }
    reconnect()

    document.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  handleKeyDown(ev) {
    if (ev.key == 'Enter') {
      let { P, project } = this.state
      this.setState({edit: project[P].N})
    }
  }

  editNode(P, N, run) {
    this.setState({
      edit: null,
      project: update(
        this.state.project,
        {[P]: {'node': {[N]: {'run': {'$set': btoa(run)}}}}})
      })
    this.ws.send(JSON.stringify({m: 'cat', 'a': [P, N, run]}))
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    let { P, project } = this.state

    if (!Object.keys(project).length) return <div><Panel>...</Panel></div>

    const starred = Object.entries((project[P] || {}).node)
      .filter(([k, v]) => v.starred)
      .map(([k, v]) => { return {k: k, o: {stdout: v.stdout, raw: v.raw}} })
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
          <Node
            P={ P }
            N={ x }
            node={ C.node[x] }
            selected={ x == project[P].N }
            edit={ x == this.state.edit }
            editNode={ this.editNode.bind(this) }
            />
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
          starred.map((x) => <Stdout key={ x.k } stdout={ x.o.stdout } raw={ x.o.raw } />)
        }</Starred>
      }

      <div style={{ flex: 1, overflow: 'auto' }}>
      { Tree(project[P] || {}, 'dev') }
      </div>

      { (Object.keys(project).length > 1) &&
        <div style={{ display: 'flex', marginBottom: '1px' }}>
          { Object.keys(project).sort().map((k) =>
            <Tab key={ k } selected={ P == k }>
              { project[k].name }
            </Tab>
          ) }
        </div>
      }

    </div>
  }
}


ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
