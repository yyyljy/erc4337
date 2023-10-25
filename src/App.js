import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { ecsign, toRpcSig, keccak256 as keccak256_buffer } from 'ethereumjs-util'
const { Web3 } = require("web3")

function App() {
  const entryAddress = process.env.REACT_APP_ENTRYPOINT_ADDRESS
  const [web3, setWeb3] = useState(new Web3(window.ethereum))
  const [account, setAccount] = useState(ethers.ZeroAddress)
  const [targetAddr, setTargetAddr] = useState("0x6de175459DE142b3bcd1B63d3E07F21Da48c7c14")
  const [scaAddress, setSCAaddress] = useState(ethers.ZeroAddress)
  const [method, setMethod] = useState("")
  const [inputs, setInputs] = useState([""])
  const [callData, setCallData] = useState("")
  const [userOp, setUserOp] = useState({
    sender: "0x74dbFB665536AcE9E65b6c9ff5bE1D99AA78eEA8",
    nonce: "0x",
    initCode: "0x",
    callData:
      "0x",
    callGasLimit:
      "0xffffff",
    verificationGasLimit:
      "0xffffff",
    preVerificationGas:
      "0xffffff",
    maxFeePerGas:
      "0xaffffffff",
    maxPriorityFeePerGas:
      "0xaffffffff",
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    paymasterAndData: "0x",
  })
  const [nonce, setNonce] = useState()
  const [gas, setGas] = useState()
  const [chainId, setChainId] = useState()
  const signer = new ethers.Wallet(process.env.REACT_APP_USER_PRIVATE_KEY, web3.provider)

  useEffect(() => {
    if (!web3) setWeb3(new Web3(window.ethereum))
    if (web3) getChainId()
    // console.log(ethers.toNumber(chainId))
    if (account === ethers.ZeroAddress) getAccounts()
    if (scaAddress === ethers.ZeroAddress) getSCAAddress()
  }, [web3, account, scaAddress])

  const getChainId = async () => {
    let currentChain = await window.ethereum.request({ method: 'eth_chainId' })
    setChainId(currentChain)
  }
  const getAccounts = async () => {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    if (accounts) setAccount(accounts[0])
  }

  const fetchEntryPoint = async () => {
    const options = {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_supportedEntryPoints",
      }),
    };

    fetch(
      "https://polygon-mumbai.g.alchemy.com/v2/qi_CqFczPxdn5GUyNWEStBTOjfaylzVh",
      options
    )
      .then((response) => response.json())
      .then((response) => console.log(response))
      .catch((err) => console.error(err));
  };

  const getSCAAddress = async () => {
    if (account === ethers.ZeroAddress) getAccounts()
    const abi = require("./abi/SimpleAccountFactory.json")
    const factoryContract = new web3.eth.Contract(abi, process.env.REACT_APP_ACCOUNT_FACTORY_ADDRESS)
    const res = await factoryContract.methods.getAddress(account, "0").call()
    if (res) setSCAaddress(res)
    // console.log(res)
    return res
  }

  const deploySCA = async () => {
    const senderAddress = await getSCAAddress()
    console.log("ownerAccount: ", account)
    console.log("SCA : ", senderAddress)
    const initcode = "0x9406cc6185a346906296840746125a0e449764545fbfb9cf000000000000000000000000" + senderAddress.slice(2) + "0000000000000000000000000000000000000000000000000000000000000000"
    const params = {
      sender: senderAddress,
      nonce: "0x2a",
      initCode: initcode,
      callData:
        "0x",
      callGasLimit:
        "0xffffff",
      verificationGasLimit:
        "0xffffff",
      preVerificationGas:
        "0xffffff",
      maxFeePerGas:
        "0xfffffffffffffffffffffffffffffff",
      maxPriorityFeePerGas:
        "0xfffffffffffffffffffffffffffffff",
      signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
      paymasterAndData: "0x",
    }
    await fetchEstimateGas(params)
  };

  const getNonce = async () => {
    const abi = require("./abi/entrypoint.json")
    const entryContract = new web3.eth.Contract(abi, entryAddress)
    const nonce = await entryContract.methods.getNonce(scaAddress, "0").call()
    // console.log("nonce : ", nonce)
    let nn = web3.utils.toHex(nonce)
    setNonce(nn)
    return nn
  }

  const createCallData = async () => {
    const accountABI = new ethers.Interface(["function execute(address dest, uint256 value, bytes calldata func)"])
    const msgabi = require("./abi/messageContract.json")
    const calldata = accountABI.encodeFunctionData("execute", [
      targetAddr,
      ethers.ZeroAddress,
      new ethers.Interface(msgabi).encodeFunctionData(method, [inputs]),
    ])
    setCallData(calldata)
    return calldata
  }

  const fetchEstimateGas = async (params) => {
    await getNonce()
    params = { ...params, nonce: nonce }
    // console.log(params)
    const options = {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_estimateUserOperationGas",
        params: [
          params,
          entryAddress,
        ],
      }),
    };
    const response = await fetch(
      "https://polygon-mumbai.g.alchemy.com/v2/qi_CqFczPxdn5GUyNWEStBTOjfaylzVh",
      options
    )
    try {
      const gasResult = await response.json()
      if (gasResult.result) {
        setGas(gasResult.result)
        return gasResult.result
      }
      return false
    } catch {
      return false
    }
    // const op = {
    //   sender: scaAddress,
    //   nonce: "0x0",
    //   initCode: "0x",
    //   callData: calldata,
    //   callGasLimit:'0xfffff',
    //   verificationGasLimit:'0xfffff',
    //   preVerificationGas:'0xfffff',
    //   maxFeePerGas: '0xfffff',
    //   maxPriorityFeePerGas: '0xfffff',
    //   paymasterAndData: '0x',
    //   signature: '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
    // }
    // {
    //   "jsonrpc": "2.0",
    //   "id": 1,
    //   "result": {
    //     "preVerificationGas": "0xab84",
    //     "verificationGasLimit": "0x14347",
    //     "callGasLimit": "0x238c"
    //   }
    // }
  };

  const signUserOp = async () => {
    const op = {
      sender: '0x74dbFB665536AcE9E65b6c9ff5bE1D99AA78eEA8',
      nonce: '0x0',
      initCode: '0x',
      callData: '0xb61d27f60000000000000000000000006de175459de142b3bcd1b63d3e07f21da48c7c14000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064368b87720000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b746573744d736753656e6400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      callGasLimit: '0x581D',
      verificationGasLimit: '0x5FC1B',
      preVerificationGas: '0xB248',
      maxFeePerGas: '0x69A4C7232',
      maxPriorityFeePerGas: '0x69A4C7220',
      signature: '0x',
      paymasterAndData: '0x'
    }
    const userOpHash = await getUserOpHash(op)
    const signature = await signUserOpHash(userOpHash)
    return Object.assign(Object.assign({}, op), { signature })
  }

  const sendOp = async () => {
    // let op = userOp
    // let calld = await createCallData()
    // let nn = await getNonce()
    // op = { ...op, callData: calld, nonce: nn }
    // let gg = await fetchEstimateGas(op)
    // if (gg) op = { ...op, preVerificationGas: gg.preVerificationGas, verificationGasLimit: gg.verificationGasLimit, callGasLimit: gg.callGasLimit }
    const op = await signUserOp()
    console.log(op)
    setUserOp(op)
    const options = {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [
          op,
          entryAddress
        ]
      })
    };
    console.log(options)
    fetch('https://polygon-mumbai.g.alchemy.com/v2/qi_CqFczPxdn5GUyNWEStBTOjfaylzVh', options)
      .then(response => response.json())
      .then(response => console.log(response))
      .catch(err => console.error(err));
  }

  async function getUserOpHash(userOp) {
    const op = await (0, ethers.resolveProperties)(userOp);
    return (0, getUserOpHash2)(op, entryAddress, chainId);
  }

  async function signUserOpHash(userOpHash) {
    return await signer.signMessage(ethers.getBytes(userOpHash))
  }
  
  async function getUserOpHash2 (op, entryPoint, chainId) {
    const userOpHash = ethers.keccak256(await packUserOp(op))
    const enc = new ethers.AbiCoder().encode(
      ['bytes32', 'address', 'uint256'],
      [userOpHash, entryPoint, ethers.toNumber(chainId)])
    return ethers.keccak256(enc)
  }

  async function packUserOp (op) {
    return new ethers.AbiCoder().encode(
      ['address', 'uint256', 'bytes32', 'bytes32',
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
        'bytes32'],
      [op.sender, ethers.toNumber(op.nonce), ethers.keccak256(op.initCode), ethers.keccak256(op.callData),
        ethers.toNumber(op.callGasLimit), ethers.toNumber(op.verificationGasLimit), ethers.toNumber(op.preVerificationGas), ethers.toNumber(op.maxFeePerGas), ethers.toNumber(op.maxPriorityFeePerGas),
        ethers.keccak256(op.paymasterAndData)])
  }

  return (
    <div className="App">
      <header className="App-header">
        <label>{`ChainId : ${chainId}`}</label><br />
        <label>{`SCA : ${scaAddress}`}</label><br />
        <label>{`nonce : ${nonce}`}</label><br />
        <label>{`gas : ${gas ? JSON.stringify(gas) : ""}`}</label><br />
        <p>
          <button onClick={fetchEntryPoint}>fetchEntryPoint</button>
        </p>
        <p>
          <button onClick={deploySCA}>deploySCA</button>
        </p>
        <p>
          <button onClick={() => { getNonce() }}>getNonce</button>
        </p>
        <p>
          <label>targetContractAddress</label>
          <br />
          <input name="targetContractAddress" onChange={(e) => { setTargetAddr(e.target.value) }}></input>
          <br />
          <label>method</label>
          <br />
          <input name="method" onChange={(e) => { setMethod(e.target.value) }}></input>
          <br />
          <label>inputs</label>
          <br />
          <input name="inputs" onChange={(e) => { setInputs(e.target.value) }}></input>
          <br />
          <button onClick={() => { createCallData() }}>createCallData</button>
        </p>
        <p>
          <button onClick={() => { fetchEstimateGas(userOp) }}>fetchEstimateGas</button>
        </p>
        <p>
          <button onClick={() => { signUserOp(userOp) }}>signUserOp</button>
        </p>
        <p>
          <button onClick={() => { sendOp() }}>sendOp</button>
        </p>
      </header>
    </div>
  );
}

export default App;


// {
//   sender: '0x74dbFB665536AcE9E65b6c9ff5bE1D99AA78eEA8',
//   nonce: '0x0',
//   initCode: '0x',
//   callData: '0xb61d27f60000000000000000000000006de175459de142b3bcd1b63d3e07f21da48c7c14000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000064368b87720000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b746573744d736753656e6400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//   callGasLimit: '0x581D',
//   verificationGasLimit: '0x5FC1B',
//   preVerificationGas: '0xB248',
//   maxFeePerGas: '0x69A4C7232',
//   maxPriorityFeePerGas: '0x69A4C7220',
//   signature: '0x98c8f0d1e23ac75158cc716cec8ba02d6c4cafa8e9b6f51b34f69fe572f112ed4843fd27a88d93f6a2fe2c7c3dc12a1351d96b781ce054d6a2e4c946d195ba8c1c',
//   paymasterAndData: '0x'
// }