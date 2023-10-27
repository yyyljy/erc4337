import { useEffect, useState } from "react";
import { ethers } from "ethers";
import GetOwnerBTN from "./components/atoms/GetOwnerBTN";
const { Web3 } = require("web3");

function App() {
  const [web3, setWeb3] = useState(new Web3(window.ethereum));
  const [account, setAccount] = useState(ethers.ZeroAddress);
  // const entryAddress = process.env.REACT_APP_ENTRYPOINT_ADDRESS;
  const [entryAddress, setEntryAddress] = useState(ethers.ZeroAddress)
  const [targetAddr, setTargetAddr] = useState(
    "0x6de175459DE142b3bcd1B63d3E07F21Da48c7c14"
  );
  const [scaAddress, setSCAaddress] = useState(ethers.ZeroAddress);
  const [method, setMethod] = useState("setMessage");
  const [inputs, setInputs] = useState([`testMessage`]);
  const [callData, setCallData] = useState("");
  const [userOp, setUserOp] = useState({
    sender: ethers.ZeroAddress,
    nonce: "0x",
    initCode: "0x",
    callData: "0x",
    callGasLimit: "0xffffff",
    verificationGasLimit: "0xffffff",
    preVerificationGas: "0xffffff",
    maxFeePerGas: "0xaffffffff",
    maxPriorityFeePerGas: "0xaffffffff",
    signature:
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    paymasterAndData: "0x",
  });
  const [nonce, setNonce] = useState();
  const [gas, setGas] = useState();
  const [chainId, setChainId] = useState();
  const signer = new ethers.Wallet(
    process.env.REACT_APP_USER_PRIVATE_KEY,
    web3.provider
  );

  useEffect(() => {
    if (!web3) setWeb3(new Web3(window.ethereum));
    if (account !== ethers.ZeroAddress) getChainId();
    // console.log(ethers.toNumber(chainId))
    // if (account === ethers.ZeroAddress) getAccounts();
    if (account !== ethers.ZeroAddress && scaAddress === ethers.ZeroAddress) getSCAAddress();
  }, [account]);

  const getChainId = async () => {
    let currentChain = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(currentChain);
  };

  const getAccounts = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
      } else {
        alert('INSTALL METAMASK!!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEntryPoint = async () => {
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_supportedEntryPoints",
      }),
    };

    const res = await fetch(
      `https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      options
    ).catch((err) => console.error(err));
    try{
      let addr = (await res.json()).result
      setEntryAddress(addr[0])
    }catch{
      console.log("Fetch Entry Error")
    }
  };

  const getSCAAddress = async () => {
    if (account === ethers.ZeroAddress) getAccounts();
    const abi = require("./abi/SimpleAccountFactory.json");
    const factoryContract = new web3.eth.Contract(
      abi,
      process.env.REACT_APP_ACCOUNT_FACTORY_ADDRESS
    );
    const res = await factoryContract.methods.getAddress(account, "0").call();
    if (res) {
      setUserOp({...userOp, sender: res})
      setSCAaddress(res)
    }
    // console.log(res)
    return res;
  };

  const deploySCA = async () => {
    let sender = scaAddress
    if(sender === ethers.ZeroAddress) sender = await getSCAAddress();
    const initcode = process.env.REACT_APP_ACCOUNT_FACTORY_ADDRESS+"5fbfb9cf000000000000000000000000"+account.slice(2)+"0000000000000000000000000000000000000000000000000000000000000000"
    // const params = {
    //   sender: scaAddress,
    //   nonce: "0x0",
    //   initCode: initcode,
    //   callData: "0x",
    //   callGasLimit: "0x238c",
    //   verificationGasLimit: "0x60b15",
    //   preVerificationGas: "0xab90",
    //   maxFeePerGas: "0xfffffffff",
    //   maxPriorityFeePerGas: "0xffffffff",
    //   signature:
    //     "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    //   paymasterAndData: "0x",
    // };
    const params = {...userOp, sender:sender, nonce:"0x0", initCode:initcode}
    setUserOp(params)
    const res = await fetchEstimateGas(params);
    let op = {
      ...params,
      preVerificationGas: res.preVerificationGas,
      verificationGasLimit: res.verificationGasLimit,
      callGasLimit: res.callGasLimit,
    };
    setUserOp(op)
    const signed = await signUserOp(op);
    const userOpHash = await sendOp(signed);
  };

  const getNonce = async () => {
    const abi = require("./abi/entrypoint.json");
    const entryContract = new web3.eth.Contract(abi, entryAddress);
    const nonce = await entryContract.methods.getNonce(scaAddress, "0").call();
    // console.log("nonce : ", nonce);
    let nn = web3.utils.toHex(nonce);
    setNonce(nn);
    setUserOp({...userOp, nonce:nn})
    return nn;
  };

  const createCallData = async () => {
    const accountABI = new ethers.Interface([
      "function execute(address dest, uint256 value, bytes calldata func)",
    ]);
    const msgabi = require("./abi/messageContract.json");
    const calldata = accountABI.encodeFunctionData("execute", [
      targetAddr,
      ethers.ZeroAddress,
      new ethers.Interface(msgabi).encodeFunctionData(method, [inputs]),
    ]);
    setCallData(calldata);
    setUserOp({...userOp, callData:calldata})
    return calldata;
  };

  const fetchEstimateGas = async (params) => {
    // await getNonce();
    // params = { ...params, nonce: nonce };
    // console.log(params)
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_estimateUserOperationGas",
        params: [params, entryAddress],
      }),
    };
    const response = await fetch(
      `https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
      options
    );
    try {
      const gasResult = await response.json();
      if (gasResult.result) {
        setUserOp({...userOp, 
          preVerificationGas:gasResult.result.preVerificationGas,
          verificationGasLimit:gasResult.result.verificationGasLimit,
          callGasLimit:gasResult.result.callGasLimit})
        setGas(gasResult.result);
        return gasResult.result;
      }
      return false;
    } catch {
      return false;
    }
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

  const signUserOp = async (op) => {
    const userOpHash = await getUserOpHash(op);
    const signature = await signUserOpHash(userOpHash);
    setUserOp(Object.assign(Object.assign({}, op), { signature }));
    return Object.assign(Object.assign({}, op), { signature });
  };

  const sendOp = async (signed) => {
    let param = signed?signed:userOp
    console.log(param)
    const res = await fetchAlchemy("eth_sendUserOperation", param)
  };

  async function getUserOpHash(userOp) {
    const op = await (0, ethers.resolveProperties)(userOp);
    return (0, getUserOpHash2)(op, entryAddress, chainId);
  }

  async function signUserOpHash(userOpHash) {
    return await signer.signMessage(ethers.getBytes(userOpHash));
  }

  async function getUserOpHash2(op, entryPoint, chainId) {
    const userOpHash = ethers.keccak256(await packUserOp(op));
    const enc = new ethers.AbiCoder().encode(
      ["bytes32", "address", "uint256"],
      [userOpHash, entryPoint, ethers.toNumber(chainId)]
    );
    return ethers.keccak256(enc);
  }

  async function packUserOp(op) {
    return new ethers.AbiCoder().encode(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32",
      ],
      [
        op.sender,
        ethers.toNumber(op.nonce),
        ethers.keccak256(op.initCode),
        ethers.keccak256(op.callData),
        ethers.toNumber(op.callGasLimit),
        ethers.toNumber(op.verificationGasLimit),
        ethers.toNumber(op.preVerificationGas),
        ethers.toNumber(op.maxFeePerGas),
        ethers.toNumber(op.maxPriorityFeePerGas),
        ethers.keccak256(op.paymasterAndData),
      ]
    );
  }

  const fetchAlchemy =  async (method, params) => {
    if(params.sender === ethers.ZeroAddress) {
      let sca = await getSCAAddress()
      setSCAaddress(sca)
      params = {...params, sender: sca}
    }
    if(params.nonce === "0x") {
      let nc = await getNonce()
      setNonce(nc)
      params = {...params, nonce: nc}
    }
    let ent = ethers.ZeroAddress
    if(entryAddress === ethers.ZeroAddress){
      ent = await fetchEntryPoint()
      setEntryAddress(ent)
    }
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: method,
        params: [params, entryAddress === ethers.ZeroAddress ? ent : entryAddress],
      }),
    }
    fetch(`https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`, options)
    .then((response) => response.json())
    .then((response) => {
      console.log("response : ",response)
      return response
    })
    .catch((err) => console.error(err));
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <button onClick={getAccounts}>지갑연결</button>
          <button onClick={fetchEntryPoint}>fetchEntryPoint</button>
          <button onClick={getNonce}>getNonce</button>
        </p>
        <label>{`ChainId : ${chainId}`}</label>
        <br />
        <label>{`Account : ${account}`}</label>
        <br />
        <label>{`SCA : ${scaAddress}`}</label>
        <br />
        <label>{`EntryPointAddress : ${entryAddress}`}</label>
        <br />
        <label>{`nonce : ${nonce}`}</label>
        <br />
        <label>{`gas : ${gas ? JSON.stringify(gas) : ""}`}</label>
        <br />
        <p>
          <button onClick={deploySCA}>deploySCA</button>
        </p>
        <p>
          <button onClick={getNonce}>getNonce</button>
        </p>
        <p>
          <label>targetContractAddress</label>
          <br />
          <input
            name="targetContractAddress"
            onChange={(e) => {
              setTargetAddr(e.target.value);
            }}
            value={targetAddr}
          ></input>
          <br />
          <label>method</label>
          <br />
          <input
            name="method"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
            }}
          ></input>
          <br />
          <label>inputs</label>
          <br />
          <input
            name="inputs"
            onChange={(e) => {
              setInputs(e.target.value);
            }}
          ></input>
          <br />
          <button
            onClick={() => {
              createCallData();
            }}
          >
            createCallData
          </button>
          <input value={callData} name="callData" onChange={(e)=>{
            setCallData(e.target.value)
          }}></input>
        </p>
        <p>
          <button
            onClick={() => {
              fetchEstimateGas(userOp);
            }}
          >
            fetchEstimateGas
          </button>
        </p>
        <p>
          <button
            onClick={() => {
              signUserOp(userOp);
            }}
          >
            signUserOp
          </button>
        </p>
        <p>
          <button
            onClick={() => {
              sendOp();
            }}
          >
            sendOp
          </button>
        </p>
        <GetOwnerBTN scaAddress={scaAddress}/>
        <br/>
        <textarea onChange={(e)=>{setUserOp(e.target.value)}} value={JSON.stringify(userOp,null, 2)}/>
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