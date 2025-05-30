
// 加载.env 文件到配置环境 Node.js 的process.env对象中
require("dotenv").config()
const fs = require("fs")
const {ethers} = require("ethers")

// 接受一个 JSON-RPC 节点地址,可以调用区块链上任意函数、获取区块数据、查询合约状态
const provider = new ethers.JsonRpcProvider(process.env.ETH_PRC_URL)

const poolAbi = [
    //  uniswap V3 核心池子合约中定义的函数  
    // slot0  返回当前池子的价格 tick等状态
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    // 返回池子流动性
    "function liquidity() view returns (uint128)"
]

const pools = JSON.parse(fs.readFileSync("pools.json","utf-8"))

async function fetchPoolData() {
    for(const pool of pools){
        try{
            // 实例化合约对象、指向池子的合约地址
            const poolContract = new ethers.Contract(pool.id, poolAbi, provider)
            // 读取池子里的价格和流动性
            const slot0 = await poolContract.slot0()
            const liquidity = await poolContract.liquidity()
            console.log(`池子：${pool.id}`)
            console.log(`   代币：${pool.token0.symbol} - ${pool.token1.symbol}`)
            console.log(`   价格：${slot0.sqrtPriceX96.toString()}`)
            console.log(`   流动性：${liquidity.toString()} \n`)

        } catch (e){
            console.log(`读取失败:${pool.id}`,e.message)
        }
    }
}

fetchPoolData()