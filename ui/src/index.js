import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'mobx-react'
import RootStore from './stores/RootStore'
import { bridgeType } from './stores/utils/bridgeMode'

ReactDOM.render(
  <Provider RootStore={RootStore}>
    <BrowserRouter basename={`/${bridgeType}`}>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
