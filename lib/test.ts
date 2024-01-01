import { MempoolApi } from "./api/mempool-api"

async function main() {
    let api = new MempoolApi()
    let utxos = await api.getUnspentAddress('bc1pdp6ge0v4ggvr95escf57u79rld90n6rq9rd9w0x8lpplsrep5p3sjvtsw4')
    console.log(utxos)
}

main()