import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import styled from 'styled-components'
import { injectGlobal, css } from 'styled-components'

import { reset } from 'styled-reset'

injectGlobal`
  ${reset}
  body {
    font-family: 'Inconsolata';
    font-size: 10pt;
    color: #333;
    margin: 2px;
    background: #938581;
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

  ${props => ('exit_status' in props) && (
    props.exit_status == 0
      && css`
        color: #eee;
        background: #5FAD56;
      `
      || css`
        color: #eee;
        background: #F24D4D;
      `) }
`


class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
      node: {},
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
        var node = JSON.parse(event.data)
        self.setState({loaded: true, node: node})
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
    if (!this.state.loaded) return <div><Pre>...</Pre></div>
    let { command, out, exit_status } = this.state.node
    return <div>
      <Pre exit_status={ exit_status }>
        { command }
      </Pre>
      <Pre>
        { atob(out).trim() }
      </Pre>
    </div>
  }
}


ReactDOM.render(
  <Main />,
  document.getElementById('app')
)
