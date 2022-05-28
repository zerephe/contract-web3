import env from "../env.json" assert {type: 'json'};
import contractAbi from "../ContractAbi.json" assert {type: 'json'};


let instance;
let provider;
let signer;
let signerAddress;
let network;

const connectBtn = document.getElementById("connectWallet");
connectBtn.innerText = "Connect Wallet";

connectBtn.addEventListener("click", () => {
  connectWallet();
});

const getThePassBtn = document.getElementById("mint");

getThePassBtn.addEventListener("click", () => {
  // mint(65646);
  displayContractDetails();
});

const providerOptions = {
  injected: {
    display: {
      name: "Metamask",
      description: "Connect with the provider in your Browser",
    },
    package: null,
  },
  walletconnect: {
    display: {
      name: "WalletConnect",
      description: "Scan qrcode with your mobile wallet",
    },
    package: WalletConnectProvider.default,
    options: {
      rpc: {
        1: env.mainnetRpc, // https://ethereumnodes.com/
        4: env.rinkebyRpc, // https://eth-rinkeby.alchemyapi.io
      },
    },
  },
};

const web3Modal = new Web3Modal.default({
  theme: "light",
  network: "rinkeby",
  cacheProvider: true,
  providerOptions,
});

if (web3Modal.cachedProvider) {
  connectWallet(true);
}

async function connectWallet(cached) {
  try {
    if (cached) {
      instance = await web3Modal.connectTo(web3Modal.cachedProvider);
      console.log("Opening a dialog", web3Modal);
    } else {
      instance = await web3Modal.connect();
      console.log("Opening a dialog", web3Modal);
    }
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  provider = new ethers.providers.Web3Provider(instance);

  instance.on("accountsChanged", () => {
    fetchAccountData();
  });

  instance.on("chainChanged", () => {
    fetchAccountData();
  });

  instance.on("disconnect", () => {
    disconnect();
  });

  await fetchAccountData();
}

async function fetchAccountData() {
  // Get a Web3 instance for the wallet
  provider = new ethers.providers.Web3Provider(instance, "any");
  console.log(provider);
  // Get connected chain id from Ethereum node
  network = await provider.getNetwork();
  signer = await provider.getSigner();
  signerAddress = await signer.getAddress();
  console.log(network);
  console.log(signer);
  console.log(signerAddress);

  // Checking if wallet on the right chain
  // Applying wallet address to the page
  if (network.chainId !== 4 && network.chainId !== 1) {
    connectBtn.innerText = "Wrong network";
    getThePassBtn.disabled = true;
  } else {
    connectBtn.innerText = "".concat(signerAddress.slice(0, 12), "...");
    getThePassBtn.disabled = false;
  }
}

async function mint(amount) {
  if (instance) {
    const contractAddress = env.contractAddress;
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      await contract.mint(signerAddress, amount);
    } catch (e) {
      console.log(e);
      return;
    }
  } else {
    console.log("Please install Metamask extention.");
  }
}

async function displayContractDetails() {
  if (instance) {
    const contractAddress = env.contractAddress;
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    let balance;

    try {
      balance = await contract.balanceOf(signerAddress);
    } catch (e) {
      console.log(e);
      return;
    }

    console.log(balance.toNumber().toString());
  } else {
    console.log("Please install Metamask extention.");
  }
}

async function sign(msg) {
  if (instance) {
    try {
      const signer = await provider.getSigner();
      const messageBytes = ethers.utils.arrayify(ethers.utils.hashMessage(msg));
      const signature = await signer.signMessage(messageBytes);
      return signature;
    } catch (e) {
      console.log(e);
      return;
    }
  } else {
    return false;
  }
}

function refreshState() {
  // Reset state
  instance = null;
  provider = null;
  signer = null;
  signerAddress = null;
  network = null;

  // Reset UI
  connectBtn.innerText = "Connect Wallet";
  getThePassBtn.disabled = true;
}

async function disconnect() {
  // Close provider session
  await web3Modal.clearCachedProvider();
  refreshState();
}

