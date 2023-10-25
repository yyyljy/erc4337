# Mumbai

## Entry Point

"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

## Simple Account Factory Address

"0x9406Cc6185a346906296840746125a0E44976454"

## Deploy SCA 순서

1. SimpleAccountFactory에서 getAddress(address, salt)로 SCA 주소를 미리 확인

   - address는 EOA 지갑주소, salt는 nonce값 (일반적으론 0 넣으면 됨)

2. initCode를 세팅한 UserOp를 작성 후 eth_estimateUserOperationGas 호출

   - `Given UserOperation optionally without gas limits and gas prices, return the needed gas limits.`
   - `The signature field is ignored by the wallet`
   - `Still, it might require putting a “semi-valid” signature (e.g. a signature in the right length)`

3. 2번에서 return 받은 gas 값을 userOp에 세팅

4. paymaster(대납자)가 없는 경우 EntryPoint의 depositTo() 함수를 통해 SCA에 balance를 deposit 해줘야함.

   메타마스크에서 SCA에 직접 보내도 됨(Metamask - Mumbai 테스트 완료)

5. userOp에 signature값 생성 후 세팅하여 eth_sendUserOperation 호출

### Example Data

#### initCode Sample

ops.sender : 0xf88Af9e8A2FE1453970891aE031Ad77FD6D2CB44
ops.initCode : 0x9406cc6185a346906296840746125a0e449764545fbfb9cf000000000000000000000000f9ce4d8b7800e6000a370c399ea4a63312926fb10000000000000000000000000000000000000000000000000000000000000000

#### initCode 분석

SCA Address : 0x9406cc6185a346906296840746125a0e44976454
Function Call Code : 5fbfb9cf000000000000000000000000

- function input
  - EOA Address : f9ce4d8b7800e6000a370c399ea4a63312926fb1
  - salt : 0000000000000000000000000000000000000000000000000000000000000000
    - uint256 Max -> Hex = 0xfff... (f가 256/4 = 64자리)

#### [example Tx](https://mumbai.polygonscan.com/tx/0xb6a87876937da48bb9e1d7e58145851057f05bd8b2af82aed158b02a3b8d1347)



## eth_sendUserOperation과 signature

