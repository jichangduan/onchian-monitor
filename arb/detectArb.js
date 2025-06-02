
require("dotenv").config()
const{ethers} = require("ethers")

const provider = new ethers.JsonRpcProvider(process.env.ETH_PRC_URL)

// 池子ABI只需要slot0
// sqrtPriceX96 是价格的平方根，按 Q96.96 定点格式存储
const poolAbi = [
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)"
]

const poolA = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
const poolB = "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36"

// 价格转换函数
function getPriceFromSqrtX96(sqrtPriceX96){
    const ratio = sqrtPriceX96 ** 2 / 2 **(96 * 2)
    // 函数的输出是 ETH/USDC，但取倒数后输出 USDC/ETH
    return 1 / ratio
}

async function fetchPrice() {
    const contractA = new ethers.Contract(poolA, poolAbi, provider)
    const contractB = new ethers.Contract(poolB, poolAbi, provider)

    const slotA = await contractA.slot0()
    const slotB = await contractB.slot0()

    const priceA = getPriceFromSqrtX96(ethers.formatUnits(slotA.sqrtPriceX96))
    const priceB = getPriceFromSqrtX96(ethers.formatEther(slotB.sqrtPriceX96))

    console.log(`A池子(0.3%): ${priceA.toFixed(2)} USDC/ETH`)
    console.log(`B池子(0.05%): ${priceB.toFixed(2)}USDC/ETH`)
 
    const diff = ((priceB - priceA) / priceA) * 100
    console.log(`差价:${diff.toFixed(4)}%`)

    // 判断是否满足套利条件
    const threshold = 0.5 // 0.5% 套利
    if(Math.abs(diff) > threshold){
        console.log("满足套利条件")
    }else{
        console.log("暂无交易机会")
    }
}

fetchPrice()