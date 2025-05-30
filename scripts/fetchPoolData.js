
// 加载.env 文件到配置环境 Node.js 的process.env对象中
require("dotenv").config()
const fs = require("fs")
const {ethers} = require("ethers")

const provider = new ethers.JsonRpcProvider(process.env.ETH_PRC_URL)

const poolAbi = [
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinalityNext, uint8 feProtocol, bool unlocked)",
    "function liquidity() view returns (uint128)"
]

const pools = JSON.parse(fs.readFileSync("pools.json","utf-8"))

async function fetchPoolData() {
    for(const pool of pools){
        try{
            const poolContract = new ethers.Contract(pool.id, poolAbi, provider)
            
            const slot0 = await poolContract.slot0()
            const liquidity = await poolContract.liquidity()
            console.log(`池子：${pool.id}`)
            console.log(`   代币：${pool.token0.symbol} - ${pool.token1.symbol}`)
            console.log(`   价格：${slot0.sqrtPriceX96.toString()}`)
            console.log(`   流动性：${liquidity.toString()} \n`)

        } catch (err){
            console.log(`读取失败:${pool.id}`,err.message)
        }
    }
}

fetchPoolData()