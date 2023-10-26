import { React } from "react";
const {Web3} = require("web3")

export default function GetOwnerBTN({scaAddress}) {
  const web3 = new Web3(window.ethereum)
  const getOwner = async () => {
    const abi = require("../../abi/SimpleAccount.json")
    const contract = new web3.eth.Contract(abi,scaAddress)
    console.log(await contract.methods.owner().call())
  }

  return (
    <div>
        <button onClick={getOwner}>get Owner</button>
    </div>
  );
}