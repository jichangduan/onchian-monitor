
require("dotenv").config()

const cron = require("node-cron")
const fs = require("fs")
const {ethers} = require("ethers")

const provider = new ethers.JsonRpcProvider(process.env.ETH_PRC_URL)
const poolAbi = [
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() view returns (uint128)"
    ]

const pools = JSON.parse(fs.readFileSync("pools.json", "utf-8"))

// 向TG发告警信息
async function sendAlert(message) {
    // .env 中读取
    const webhookUrl = process.env.BOT_WEBHOOK_URL
    const chatId = process.env.TELEGRAM_CHAT_ID

    const fetch = require("node-fetch");
    const res = await fetch(`${webhookUrl}?chat_id=${chatId}&text=${encodeURIComponent(message)}`)
    if(!res.ok){
        console.error("告警发送失败!")
    }
}

const TVL_THRESHOLD = BigInt("100000000000000000000")

async function monitorPools() {
    console.log(`[${new Date().toLocaleDateString()}] 开始监控池子…… \n`)
    for (const pool of pools){
        try{
            const contract = new ethers.Contract(pool.id, poolAbi, provider)
            const liquidity = await contract.liquidity()

            console.log(` ${pool.token0.symbol}-${pool.token1.symbol} TVL: ${liquidity.toString()}`)

            if(liquidity < TVL_THRESHOLD){
                const msg = `TVL 跌破阈值 \n${pool.token0.symbol} - ${pool.token1.symbol} TVL:${liquidity.toString()}`
                await sendAlert(msg)
            }

        }catch(e){
            console.log(`读取失败 ${pool.id}`, e.message)
        }
    }
}

cron.schedule("* * * * *", monitorPools)

console.log("监控服务启动，开始每分钟检查一次...")