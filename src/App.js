function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          <button onClick={fetchEntryPoint}>fetchEntryPoint</button>
        </p>
        <p>
          <button onClick={fetchEstimateGas}>fetchEstimateGas</button>
        </p>
      </header>
    </div>
  );
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

const fetchEstimateGas = async () => {
  const options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_estimateUserOperationGas",
      params: [
        {
          sender: "0x9f6a0be1f3aEF6D826d98f8A2D865acbfBb467D0",
          nonce: "0x2a",
          initCode:
            "0x9406cc6185a346906296840746125a0e449764545fbfb9cf00000000000000000000000039c1a4d1ff3cb5ddf491db05e6d3a4da61ed5b5f0000000000000000000000000000000000000052fc6748d0bcaf6794eae37095",
          callData:
            "0xb61d27f60000000000000000000000000be71941d041a32fe7df4a61eb2fcff3b03502c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000004d087d28800000000000000000000000000000000000000000000000000000000",
          callGasLimit:
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          verificationGasLimit:
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          preVerificationGas:
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          maxFeePerGas:
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          maxPriorityFeePerGas:
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          signature:
            "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
          paymasterAndData: "0x",
        },
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      ],
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

export default App;
