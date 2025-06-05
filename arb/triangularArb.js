require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.ETH_PRC_URL); 

// Uniswap V3 pool ABI
const poolAbi = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

//  读取代币的精度和名称symbol
const erc20Abi = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// 三个池子地址（Uniswap V3 主网）
const pools = {
    usdc_weth: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
    weth_dai:  "0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8",
    dai_usdc:  "0x6c6bc977e13df9b0de53b251522280bb72383700"
  };
  
  

// 获取某个池子的实际价格（token0/token1），自动识别精度
async function getPoolPrice(poolAddress) {
    // 用ABI和地址实例化池子合约对象
    const contract = new ethers.Contract(poolAddress, poolAbi, provider);
    const slot0 = await contract.slot0();
    // 获取池子两个代币的地址，然后用erc20Abi读取代币的精度和symbol，用于后续计算价格
    const token0Addr = await contract.token0();
    const token1Addr = await contract.token1();
  
    const token0 = new ethers.Contract(token0Addr, erc20Abi, provider);
    const token1 = new ethers.Contract(token1Addr, erc20Abi, provider);
    // 分别发送四个请求字段，获取精度和symbol
    const [dec0, dec1, sym0, sym1] = await Promise.all([
      token0.decimals(),
      token1.decimals(),
      token0.symbol(),
      token1.symbol()
    ]);
    
    // 先把slot0.sqrtPriceX96 从Q96格式解码为浮点数，然后取平方，得到实际价格
    const sqrtPriceX96 = Number(slot0.sqrtPriceX96); // 这是 BigInt → Number
    const sqrtPrice = sqrtPriceX96 / (2 ** 96);
    // 价格*token精度因子，确保价格是正确的
    const price = sqrtPrice ** 2 * (10 ** Number(dec0) / 10 ** Number(dec1)); // 转换精度类型
  
    return {
      symbol0: sym0,
      symbol1: sym1,
      price,
    };
  }
  

// 三角套利模拟：USDC → WETH → DAI → USDC  用1个U模拟
async function simulateTriangularArbitrage(inputUSDC = 1) {
  // 并行获取三个池子的价格
    const [p0, p1, p2] = await Promise.all([
    getPoolPrice(pools.usdc_weth),
    getPoolPrice(pools.weth_dai),
    getPoolPrice(pools.dai_usdc)
  ]);

  console.log(`USDC → WETH 价格: 1 ETH = ${p0.price.toFixed(2)} USDC (${p0.symbol0}-${p0.symbol1})`);
  console.log(`WETH → DAI 价格: 1 ETH = ${p1.price.toFixed(2)} DAI (${p1.symbol0}-${p1.symbol1})`);
  console.log(`DAI → USDC 价格: 1 DAI = ${p2.price.toFixed(6)} USDC (${p2.symbol0}-${p2.symbol1})`);

  // 模拟兑换路径
  const wethAmount = inputUSDC / p0.price;
  const daiAmount = wethAmount * p1.price;
  const outputUSDC = daiAmount * p2.price;

  console.log(`\n模拟三角套利兑换结果：`);
  console.log(`起始：${inputUSDC} USDC`);
  console.log(`WETH 中间兑换：${wethAmount.toFixed(6)} ETH`);
  console.log(`DAI 中间兑换：${daiAmount.toFixed(6)} DAI`);
  console.log(`最终返回：${outputUSDC.toFixed(6)} USDC`);

  const profit = outputUSDC - inputUSDC;
  const threshold = 0.002; // 至少 0.2% 利润才认为有机会

  if (profit > threshold) {
    console.log(`\n套利机会！预计利润 ≈ ${profit.toFixed(6)} USDC`);
  } else {
    console.log(`\n暂无套利空间。`);
  }
}

simulateTriangularArbitrage();
