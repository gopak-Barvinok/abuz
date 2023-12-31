import axios, { AxiosError, AxiosResponse } from "axios";
import { ethers } from "ethers";
import * as fs from "fs";
import { MOCK_USER_AGENT } from "../../utils/Utils";
import {
    AuthInfo,
    GenerateNonceResponse,
    LineaCampaingInfo,
    UserCampaingInfo,
    UserResponsePayload,
    WalletRequestPayload,
} from "./intractApiModels";

export const INTRACT_ENDPOINT_URL = "https://api.intract.io/api/";
export const LOGIN_MESSAGE = "Please sign this message to verify your identity. Nonce: ";
export const REFERRAL_INFO = {
    referralCode: "JTlb4u",
    referralLink: "https://www.intract.io/referral?utm_source=navbar",
    referralSource: "REFERRAL_PAGE",
};
export const LineaCampaignIdentifiers = {
    MainCampaignId: "6549ed0333cc8772783b858b",
    Wave1: {
        Name: "Metamask",
        CampaignId: "654a0e8d95c012164b1f1620",
        tasksIds: {
            BridgeOnMetamask: "654a0e8d95c012164b1f1621",
            SwapOnMetamask: "654a0e8d95c012164b1f1623",
        },
    },
    Wave2: {
        Name: "Bridging and Onramps",
        CampaignId: "65535ae63cd33ebafe9d68f8",
        tasksIds: {
            BridgeCore: "65535ae63cd33ebafe9d68f9",
            StargateProjectId: "653f74996e3c9704874cdd5a",
            OrbiterProjectId: "653aa0a76e3c9704874cdd31",
            RhinoFiProjectId: "653f8538731c016673c182f8",
            BridgeBonus25: {
                StargateTaskId: "65535ae63cd33ebafe9d6909",
                OrbiterTaskId: "65535ae63cd33ebafe9d6900",
                RhinoFiTaskId: "65535ae63cd33ebafe9d6921",
            },
            BridgeBonus500: "65535ae63cd33ebafe9d68fb",
            BridgeBonus1000: "65535ae63cd33ebafe9d68fd",
            Review: "65535ae63cd33ebafe9d68ff",
        },
    },
    Wave3: {
        Name: "Swaps",
        CampaignId: "655b48ec2e9188e21c94e93e",
        KyberSwapProjectId: "65565bd586b270fa5f703375",
        SyncSwapProjectId: "655659a386b270fa5f703361",
        IzumiProjectId: "65565a2f86b270fa5f703366",
        tasksIds: {
            SwapCore: "655b48ec2e9188e21c94e93f",
            SwapAggregator: "655b48ec2e9188e21c94e941",
            Swap20Times: "655b48ed2e9188e21c94e943",
            Swap1000: "655b48ed2e9188e21c94e946",
            SwapLSD: "655b48ed2e9188e21c94e948",
            SwapReview: "655b48ed2e9188e21c94e94a",
        },
    },
    Wave4: {
        Name: "Lending",
        CampaignId: "65647f06731b793354cb239c",
        ZkMoneyProjectId: "656194d9fcb39c430a90b585",
        GranaryFinanceProjectId: "655fa1d24e89ee27a3df3afd",
        MendiFinanceProjectId: "655c98119dd9d3a008aaf957",
        LayerBankProjectId: "655c98009dd9d3a008aaf956",
        tasksIds: {
            LendingCore: "65647f06731b793354cb239d",
            StableAsCollateral: "65647f06731b793354cb23a1",
            LsdAsCollateral: "65647f06731b793354cb23a5",
            Repay: "65647f06731b793354cb23a9",
            Review: "65647f06731b793354cb23b0",
        },
    },
    Wave5: {
        Name: "Liquidity",
        CampaignId: "656db678132add9470b7595c",
        Velocore: "65647a184b53507f1de4ea8c",
        XYFinance: "65659f81646593f64862d08c",
        tasksIds: {
            LiquidityCore: "656db678132add9470b7595d",
            LiquidityLst: "656db678132add9470b75961",
            LiquidityVe: "656db678132add9470b75965",
            LiquiditySingle: "656db678132add9470b75969",
            LiquidityReview: "656db678132add9470b7596d",
        },
    },
    Wave6: {
        Name: "PoH verification",
        CampaignId: "65705a282a20cd7291eb8e4b",
    },
    Wave7: {
        Name: "Trading",
        CampaignId: "6572fc0bef415b56fd67608f",
        tasksIds: {
            Trade: "6572fc0bef415b56fd676090",
            Review: "6572fc0bef415b56fd67609a",
        },
    },
    Wave8: {
        Name: "SocialFi",
        CampaignId: "65798e5c7d62adc325a44d92",
        tasksIds: {
            Core: "65798e5c7d62adc325a44d98",
        },
    },
};

export const InteractApiUrls = {
    GenerateNonce: "https://api.intract.io/api/qv1/auth/generate-nonce",
    Wallet: "https://api.intract.io/api/qv1/auth/wallet",
    GetLineaUserCampaing: "https://api.intract.io/api/qv1/auth/get-user?projectId=6549ed0333cc8772783b858b",
    ClaimTask: "https://api.intract.io/api/qv1/campaign/{campaignId}/claim-task-xp",
    LineaCampaignInfo: "https://api.intract.io/api/qv1/journey/fetch",
};

export var AuthCache: AuthInfo[] = [];

interface AuthArgs {
    account: ethers.Wallet;
    referralCode?: string | null;
}

export async function authenticate({ account, referralCode = null }: AuthArgs): Promise<AuthInfo> {
    // Check for existing auth info

    if (AuthCache.length == 0) {
        try {
            AuthCache = require(`./ItractAuthCache.json`);
        } catch {
            // ignore
        }
    }

    const filePath = `./tasks/intract/ItractAuthCache.json`;

    var authInfo = AuthCache.find((info) => info.address == account.address);

    var expiresDay = new Date();
    expiresDay.setDate(expiresDay.getDate() + 6);

    if (authInfo && new Date(authInfo.expires) > expiresDay) {
        return authInfo;
    }

    const generateNonceResponse: AxiosResponse<GenerateNonceResponse> = await axios.post(
        InteractApiUrls.GenerateNonce,
        {
            walletAddress: account.address,
            headers: {
                "User-Agent": MOCK_USER_AGENT,
            },
        }
    );

    // console.log("\ngenerateNonceResponse");
    // console.log(generateNonceResponse);
    // console.log(
    //     `Sing message ${LOGIN_MESSAGE + generateNonceResponse.data.data.nonce}\nLogin...`
    // );
    console.log(`Login...`);

    const signedMessage = await account.signMessage(LOGIN_MESSAGE + generateNonceResponse.data.data.nonce);

    const walletResponse: AxiosResponse<UserResponsePayload> = await axios.post(
        InteractApiUrls.Wallet,
        getWalletRequestPayload(signedMessage, account.address, referralCode),
        {
            headers: {
                "User-Agent": MOCK_USER_AGENT,
            },
        }
    );
    // console.log(walletResponse);

    var setCookies: string | undefined = walletResponse.headers["set-cookie"]?.[0];
    // console.log(setCookies);

    var expDate: Date = new Date();
    if (setCookies) {
        var startIndex = setCookies.search("Expires=");
        var endIndex = setCookies.search("; HttpOnly");

        expDate = new Date(setCookies.substring(startIndex, endIndex));
    } else {
        expDate.setDate(expDate.getDate() + 6);
    }

    // console.log("\nwalletResponse");
    // console.log(walletResponse);
    const userId = walletResponse.data._id;
    const authToken = walletResponse.headers["authorization"];

    authInfo = { address: account.address, userId: userId, token: authToken, expires: expDate.toISOString() };

    // update cache
    AuthCache = AuthCache.filter((it) => it.address != account.address);

    AuthCache.push(authInfo);

    fs.writeFileSync(filePath, JSON.stringify(AuthCache));

    return authInfo;
}

function getWalletRequestPayload(
    signature: string,
    address: string,
    referralCode: string | null
): WalletRequestPayload {
    return {
        signature: signature,
        userAddress: address,
        chain: {
            id: 59144,
            name: "Linea",
            network: "Linea",
            nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
            rpcUrls: {
                public: { http: ["https://linea.drpc.org"] },
                default: { http: ["https://linea-mainnet.infura.io/v3/bfc263a4f3cf49998641d16c24fd0b46"] },
            },
            blockExplorers: {
                etherscan: { name: "Lineascan", url: "https://lineascan.build/" },
                default: { name: "Lineascan", url: "https://lineascan.build/" },
            },
            unsupported: false,
        },
        isTaskLogin: false,
        width: "590px",
        reAuth: false,
        connector: "metamask",
        referralCode: referralCode,
        referralLink: referralCode ? REFERRAL_INFO.referralLink : null,
        referralSource: referralCode ? REFERRAL_INFO.referralSource : null,
    };
}

async function getLineaCampaingUserInfo(token: string): Promise<UserCampaingInfo> {
    var getLineaCampaingUserResponse: AxiosResponse<UserCampaingInfo>;
    try {
        getLineaCampaingUserResponse = await axios.get(InteractApiUrls.GetLineaUserCampaing, {
            headers: {
                "User-Agent": MOCK_USER_AGENT,
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (e: any) {
        if (e instanceof AxiosError) {
            throw new Error(e.response?.data.message);
        } else {
            throw e;
        }
    }
    return getLineaCampaingUserResponse.data;
}

async function getCampaignInfo(token: string, campaignId: string): Promise<LineaCampaingInfo> {
    var getCampaignInfoResponse: AxiosResponse<LineaCampaingInfo>;
    try {
        var getLineaCampaingUserResponse: UserCampaingInfo = await getLineaCampaingUserInfo(token);

        getCampaignInfoResponse = await axios.get(InteractApiUrls.LineaCampaignInfo, {
            params: { campaignId: campaignId, channelCode: "DEFAULT", referralCode: null },
            headers: {
                "User-Agent": MOCK_USER_AGENT,
                Authorization: `Bearer ${token}`,
                Questuserid: getLineaCampaingUserResponse._id,
            },
        });
    } catch (e: any) {
        if (e instanceof AxiosError) {
            throw new Error(e.response?.data.message);
        } else {
            throw e;
        }
    }
    return getCampaignInfoResponse.data;
}

export async function claimTask(token: string, campaignId: string, taskId: string): Promise<void> {
    try {
        var campaignInfo = await getCampaignInfo(token, campaignId);
        const completedTask = campaignInfo.events.find((e) => e.taskId == taskId);
        if (!completedTask) {
            throw new Error("Task not completed. Verify end try again.");
        }
        if (completedTask.isXpClaimed) {
            throw new Error("Task already claimed");
        } else {
            var getLineaCampaingUserResponse: UserCampaingInfo = await getLineaCampaingUserInfo(token);
            const claimResponse = await axios.post(
                InteractApiUrls.ClaimTask.replace("{campaignId}", campaignId),
                { taskId: taskId },
                {
                    headers: {
                        "User-Agent": MOCK_USER_AGENT,
                        Authorization: `Bearer ${token}`,
                        Questuserid: getLineaCampaingUserResponse._id,
                    },
                }
            );
            console.log(`Task claimed +${claimResponse.data.claimDetails[0].xp} XP earned!`);
        }
    } catch (e: any) {
        if (e instanceof AxiosError) {
            console.log(e.response?.data.message);
        } else {
            throw e;
        }
    }
}
