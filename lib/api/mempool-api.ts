import axios from "axios"
import { detectAddressTypeToScripthash } from "../utils/address-helpers"
import { IUnspentResponse } from "./electrum-api.interface"
import { UTXO } from "../types/UTXO.interface"

export class MempoolApi {
    constructor() {

    }
    private async request(method: 'GET'|'POST', path: string, options: {[key: string]: any}) {
        let resp = await axios.request({
            method,
            url: `https://mempool.space/api${path}`,
            ...options
        })
        return resp.data
    }

    public async getUnspentAddress(address: string): Promise<IUnspentResponse | any> {
        let utxos = await this.request('GET', `/address/${address}/utxo`, {})
        const data = {unconfirmed: 0, confirmed: 0, utxos: [] as UTXO[]};
        for (const utxo of utxos) {
            if (!utxo.status.confirmed) {
                data.unconfirmed += utxo.value;
            } else {
                data.confirmed += utxo.value;
            }
            // data.balance += utxo.value;
            data.utxos.push({
                txid: utxo.txid,
                txId: utxo.txid,
                outputIndex: utxo.vout,
                index: utxo.vout,
                vout: utxo.vout,
                value: utxo.value,
            })
        }
        return data
    }

    public async broadcast(rawTx: string) {
        await this.request('POST', '/tx', {
            data: rawTx
        })
        return true
    }
    


    async waitUntilUTXO(address: string, satoshis: number, intervalSeconds = 10, exactSatoshiAmount = false): Promise<UTXO> {
        return new Promise((resolve, reject) => {
            let intervalId: any;
            const checkForUtxo = async () => {
                console.log('...');
                try {
                    console.log("a")
                    const response: any = await this.getUnspentAddress(address).catch((e) => {
                        console.log("c")
                        console.error(e);
                        return {unconfirmed: 0, confirmed: 0, utxos: []};
                    });
                    console.log("b")
                    console.log(response.utxos)
                    const utxos = response.utxos.sort((a, b) => a.value - b.value);
                    for (const utxo of utxos) {
                        // If the exact amount was requested, then only return if the exact amount is found
                        if (exactSatoshiAmount) {
                            if (utxo.value === satoshis) {
                                clearInterval(intervalId);
                                console.log("xxx")
                                resolve(utxo);
                                return;
                            }
                        } else {
                            if (utxo.value >= satoshis) {
                                clearInterval(intervalId);
                                console.log("eeee")
                                resolve(utxo);
                                return;
                            }
                        }
                    }

                    console.log("d")
                } catch (error) {
                    console.error(error);
                    reject(error);
                    clearInterval(intervalId);
                }
            };
            intervalId = setInterval(checkForUtxo, intervalSeconds * 1000);
        });
    }
}