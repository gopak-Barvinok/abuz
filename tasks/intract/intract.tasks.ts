import { task, types } from "hardhat/config";
import { getChainInfo } from "../../utils/ChainInfoUtils";
import "../../utils/Util.tasks";
import { delay, getAccounts } from "../../utils/Utils";

import {
    LineaCampaignIdentifiers,
    authenticate,
    claimTask,
} from "./intractApiMethods";

task("intractClaimWave7Trading", "")
    .addParam("delay", "Add delay between operations", undefined, types.float, true)
    .addOptionalParam("startAccount", "Starting account index", undefined, types.string)
    .addOptionalParam("endAccount", "Ending account index", undefined, types.string)
    .addParam("randomize", "Take random accounts and execution order", undefined, types.int, true)
    .addOptionalParam(
        "accountIndex",
        "Index of the account for which it will be executed",
        undefined,
        types.string
    )
    .setAction(async (taskArgs, hre) => {
        const currentNetwork = await hre.ethers.provider.getNetwork();
        const chainInfo = getChainInfo(currentNetwork.chainId);

        const accounts = await getAccounts(taskArgs, hre.ethers.provider);

        const campaignId = LineaCampaignIdentifiers.Wave7.CampaignId;
        const taskId = LineaCampaignIdentifiers.Wave7.tasksIds.Trade;

        for (const account of accounts) {
            try {
                console.log(`\n#${accounts.indexOf(account)} Address: ${account.address}`);
                try {
                    const authInfo = await authenticate({ account: account });
                    await claimTask(authInfo.token, campaignId, taskId);
                    if (taskArgs.delay != undefined) {
                        await delay(taskArgs.delay);
                    }
                } catch (e: any) {
                    console.log(e.message);
                }
            } catch (error) {
                console.log(`Error when process account`);
                console.log(error);
            }
        }
});
