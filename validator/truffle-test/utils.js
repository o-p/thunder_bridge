const path = require('path')

const sender = require(path.join(__dirname, '../src/lib/sender'))
const receiptor = require(path.join(__dirname, '../src/lib/receiptor'))
const locker = require(path.join(__dirname, '../src/lib/locker'))
const Web3 = require('web3')

const { expect } = require('chai')

const gasPriceService = {
  getPrice: async (timestamp) => {
    return await web3.eth.getGasPrice()
  },
}

async function futureBlock(w3, n = 1) {
  const begin = await web3.eth.getBlockNumber()
  for (let i = 0; i < n; i++) {
    await w3.miner.mine(Date.now() + Number(i) * 1000)
  }
  const end = await w3.eth.getBlockNumber()
  console.log(`make block ${begin} -> ${end}`)
}

async function makeTransfer(w3, erc20, from, to) {
  const nonce = await w3.eth.getTransactionCount(from)
  const receipt = await erc20.methods.transfer(to, w3.utils.toWei('0.01')).send({ from, gas: 100000, nonce })
  return {
    eventType: 'erc-erc-affirmation-request',
    event: receipt.events.Transfer,
  }
}

function newWeb3() {
  const w3 = new Web3(web3.currentProvider)

  w3.extend({
    property: 'miner',
    methods: [
      {
        name: 'start',
        call: 'miner_start',
      },
      {
        name: 'stop',
        call: 'miner_stop',
      },
      {
        name: 'snapshot',
        call: 'evm_snapshot',
      },
      {
        name: 'revert',
        call: 'evm_revert',
        params: 1,
      },
      {
        name: 'mine',
        call: 'evm_mine',
        params: 1,
      },
      {
        name: 'setHead',
        call: 'dev_setHead',
        params: 1,
      },
    ],
  })

  return w3
}


class ChainOpGanache {
  constructor(w3) {
    this.w3 = w3
  }

  async minerStart() {
    return this.w3.miner.start()
  }

  async minerStop() {
    return this.w3.miner.stop()
  }

  async snapshot() {
    return this.w3.miner.snapshot()
  }

  async revert(id) {
    return this.w3.miner.revert(id)
  }

  async makeOneBlock(dummy, expectFail = false) {
    const begin = await this.w3.eth.getBlockNumber()

    let err
    try {
      await this.w3.miner.mine(Date.now())
    } catch (e) {
      if (!expectFail) {
        throw e
      }
      err = e
    }

    if (expectFail) {
      expect(err).to.be.not.null
    }

    const end = await this.w3.eth.getBlockNumber()
    console.log(`make block ${begin} -> ${end}`)
  }

  async futureBlock(n = 1) {
    const begin = await this.w3.eth.getBlockNumber()
    for (let i = 0; i < n; i++) {
      await this.w3.miner.mine(Date.now() + Number(i) * 1000)
    }
    const end = await this.w3.eth.getBlockNumber()
    console.log(`make block ${begin} -> ${end}`)
  }
}

class ChainOpPala {
  constructor(w3) {
    this.w3 = w3
  }

  async minerStart() {}

  async minerStop() {}

  async snapshot() {
    return this.w3.eth.getBlockNumber()
  }

  async revert(id) {
    // dev set head
    // await this.w3.currentProvider.engine.stop()
    const before = await this.w3.eth.getBlockNumber()
    try {
      await this.w3.miner.setHead(id)
    } catch (e) {
      console.log("ignore", e)
    }

    let count = 0
    while (true) {
      try {
        const current = await this.w3.eth.getBlockNumber()
        console.log("before", before, id)
        console.log("current", current, id)
        break
      } catch (e) {
        count += 1
        if (count > 10) {
          console.log("=============")
          console.log("revert get block error=", e)
        }
      }

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
    }
    // await this.w3.currentProvider.engine.start()
    console.log("OH YA!!!!!!!!!!!!!")
  }

  async makeOneBlock(dummy, expectail = false) {
    console.log("make one block #1")
    const nonce = await this.w3.eth.getTransactionCount(dummy)
    await this.w3.eth.sendTransaction({ from: dummy, to: dummy, nonce: nonce })
    console.log("make one block #2")
  }

  async futureBlock(n = 1) {
    const begin = await this.w3.eth.getBlockNumber()
    let current = begin
    console.log("hihi qqq", current)
    while (current < begin + n) {
      console.log("hihi", current)
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
      current = await this.w3.eth.getBlockNumber()
    }
  }
}

async function ChainOpWeb3(w3) {
  const id = await w3.eth.net.getId()
  if (id === 19) {
    return new ChainOpPala(w3)
  }
  return new ChainOpGanache(w3)
}

// This accounts are generated by mnemonic:
// 'wisdom zero output drift choice bright east stuff craft inform invest patient'
const Accounts = [
  (v1 = {
    address: '0x0b663c33A72819d2371Ad7939A4C29dc31C0881b',
    privateKey: '4bf3b1bb36eb3f53d1ae5e6309510e17fe41df9a26a236de3385872211e0eab4',
  }),
  (v2 = {
    address: '0x99FACa9358aeA27eeD49b4DE150757c89F8c2a0D',
    privateKey: '62911097680a3251a49e89d7b6f200b909acb13f8aba98ec4a0a77a71ab4f4e6',
  }),
  (v3 = {
    address: '0x3B128139756e78e16a3DeaDEeE0c529Bf182a90A',
    privateKey: '7469990333fa18a8fed66b945970b3af09de3d6a5863535cf102b3938a7ff41a',
  }),
]

async function newQueue() {
  const queue = []
  return {
    queue,
    sendToQueue: (item) => {
      queue.push(item)
    },
  }
}

async function getReceiptFromSenderQueue(w3, queue) {
  const txHash = queue.pop().transactionHash
  expect(txHash).to.be.not.undefined
  return await w3.eth.getTransactionReceipt(txHash)
}

async function newSender(w3, id, validator) {
  const chainId = await w3.eth.net.getId()
  const w = new sender.SenderWeb3Impl(id, chainId, validator, w3, gasPriceService)
  const l = new locker.FakeLocker()

  return new sender.Sender(id, w, l, null)
}

async function newReceiptor(w3, id) {
  const w = new receiptor.ReceiptorWeb3Impl(w3)
  return new receiptor.Receiptor(id, w)
}

async function newSenders(w3, number = 3) {
  const senders = []
  for (let i = 0; i < number; i++) {
    senders.push(await newSender(w3, `v${i}`, Accounts[i]))
  }
  return senders
}

async function newQueues(number = 3) {
  const queues = []
  for (let i = 0; i < number; i++) {
    queues.push(await newQueue())
  }
  return queues
}

async function newReceiptors(w3, number = 3) {
  const rs = []
  for (let i = 0; i < number; i++) {
    rs.push(await newReceiptor(w3, `r${i}`))
  }
  return rs
}

module.exports = {
  getReceiptFromSenderQueue,
  gasPriceService,
  newQueue,
  newQueues,
  newSender,
  newSenders,
  newReceiptor,
  newReceiptors,
  newWeb3,
  makeTransfer,
  Accounts,
  ChainOpWeb3,
}
