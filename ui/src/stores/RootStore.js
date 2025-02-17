import { action } from 'mobx'
import Web3Store from './Web3Store'
import HomeStore from './HomeStore'
import ForeignStore from './ForeignStore'
import AlertStore from './AlertStore'
import GasPriceStore from './GasPriceStore'
import TxStore from './TxStore'
// import HOME_ERC_ABI from '../../abis/HomeBridgeErcToErc.abi'
import { decodeBridgeMode } from './utils/bridgeMode'
import { getWeb3Instance } from './utils/web3'

class RootStore {
  constructor() {
    this.bridgeModeInitialized = false
    this.setBridgeMode()
    this.alertStore = new AlertStore()
    this.web3Store = new Web3Store(this)
    this.homeStore = new HomeStore(this)
    this.foreignStore = new ForeignStore(this)
    this.gasPriceStore = new GasPriceStore(this)
    this.txStore = new TxStore(this)
  }

  @action
  async setBridgeMode() {
    this.bridgeMode = 'ERC_TO_ERC'
    this.bridgeModeInitialized = true
  }
}

export default new RootStore()
