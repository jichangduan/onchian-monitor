
// fs用于写入文件
const fs = require("fs")
// node-fetch 用于发送HTTP请求  fetch是浏览器的API
const fetch = require("node-fetch")

// GRAPHQL API  uniswap V3 在 The Graph上的子图地址  de509cdd36a503f89df035c01457892f
const GRAPH_API = "https://gateway.thegraph.com/api/de509cdd36a503f89df035c01457892f/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"

// GRAPHQL 查询 TVL 排名前 20 的池子。
const query = `{
    pools(first:20, orderBy: totalValueLockedUSD, orderDirection: desc){
        id
        token0{
            symbol
            id
        }
        token1{
            symbol
            id
        }
    }
}`

async function fetchPools() {
    const res = await fetch(GRAPH_API, {
        method : "POST",
        // 请求体是JSON
        headers : {"Content-Type" : "application/json"},
        // 把GraphQL 查询语句打包成JSON提交
        body: JSON.stringify({query}),
    })


    // 把内容解析为JSON格式
    const json = await res.json()
    // console.log("Raw response:", JSON.stringify(json, null, 2));

    // GraphQL 相应中的pools数组
    const pools = json.data.pools

    fs.writeFileSync("pools.json", JSON.stringify(pools, null, 2))
    console.log(`共获取${pools.length}个池子，已保存到 pools.json`)
    console.log(pools.map(p => `${p.id}(${p.token0.symbol}-${p.token1.symbol})`).join("\n"))
}

fetchPools()
