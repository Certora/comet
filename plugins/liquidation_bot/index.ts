import { ethers, BigNumber } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { CometInterface } from '../../build/types';
import { DeploymentManager } from '../../plugins/deployment_manager/DeploymentManager';

type Config = {
  hre: HardhatRuntimeEnvironment;
  loopDelay?: number;
};

type Borrower = {
  address: string;
  liquidationMargin: BigNumber | undefined;
  lastUpdated: number | undefined;
};

type BorrowerMap = {
  [address: string]: Borrower;
};

function newBorrower(address: string): Borrower {
  return {
    address,
    liquidationMargin: undefined,
    lastUpdated: undefined
  }
}

async function uniqueAddresses(comet: CometInterface): Promise<Set<string>> {
  const withdrawEvents = await comet.queryFilter(comet.filters.Withdraw());
  return new Set(withdrawEvents.map(event => event.args.src));
}

async function buildInitialBorrowerMap(comet: CometInterface): Promise<BorrowerMap> {
  const borrowerMap: BorrowerMap = {};
  const addresses = await uniqueAddresses(comet);

  for (const address of addresses) {
    if (address !== ethers.constants.AddressZero) {
      borrowerMap[address] = newBorrower(address);
    }
  }

  return borrowerMap;
}

// XXX generate more complex portfolio of candidates
function generateCandidates(borrowerMap: BorrowerMap, blockNumber: number): Borrower[] {
  return Object.values(borrowerMap).filter(borrower => {
    return borrower.lastUpdated == undefined || blockNumber - borrower.lastUpdated > 3;
  });
}

async function updateCandidate(hre: HardhatRuntimeEnvironment, comet: CometInterface, borrower: Borrower): Promise<Borrower> {
  const liquidationMargin = await comet.getLiquidationMargin(borrower.address);
  const blockNumber = await hre.ethers.provider.getBlockNumber();

  return {
    address: borrower.address,
    liquidationMargin,
    lastUpdated: blockNumber
  };
}

async function attemptAbsorb(comet: CometInterface, absorberAddress: string, targetAddresses: string[]) {
  if (targetAddresses.length === 0) {
    return [];
  }
  try {
    await comet.absorb(absorberAddress, targetAddresses);
    console.log(`successfully absorbed ${targetAddresses}`);
    return targetAddresses;
  } catch (e) {
    console.log(`absorb failed`);
    return [];
  }
}

function isAbsorbable(borrower: Borrower): boolean {
  return borrower.liquidationMargin.lt(0);
}

async function main({ hre, loopDelay = 5000}: Config) {
  const network = hre.network.name;
  const [signer] = await hre.ethers.getSigners();

  const dm = new DeploymentManager(network, hre, {
    writeCacheToDisk: false,
    debug: true,
    verifyContracts: true,
  });
  await dm.spider();

  const contracts = await dm.contracts();
  const comet = contracts.get('comet') as CometInterface;

  const borrowerMap = await buildInitialBorrowerMap(comet);
  let lastBlock = 0;

  while (true) {
    const startingBlockNumber = await hre.ethers.provider.getBlockNumber();
    if (startingBlockNumber === lastBlock) {
      console.log(`already run for block ${startingBlockNumber}; waiting ${loopDelay / 1000} seconds`);
      await new Promise(resolve => setTimeout(resolve, loopDelay));
      continue;
    }

    console.log(`running for block ${startingBlockNumber}`);

    // generate candidates
    const candidates = generateCandidates(borrowerMap, startingBlockNumber);

    console.log(`updating ${candidates.length} candidates`);

    // update candidates
    for (const candidate of candidates) {
      const updatedCandidate = await updateCandidate(hre, comet, candidate);
      borrowerMap[candidate.address] = updatedCandidate;
      console.log({address: updatedCandidate.address, liquidationMargin: updatedCandidate.liquidationMargin});
    }

    // attempt absorb
    const absorbableBorrowers = Object.values(borrowerMap).filter(borrower => isAbsorbable(borrower));

    console.log(`${absorbableBorrowers.length} absorbable borrowers`);

    const absorbedAddresses = await attemptAbsorb(comet, signer.address, absorbableBorrowers.map(borrower => borrower.address));

    console.log(`${absorbedAddresses.length} borrowers absorbed`);

    for (const address of absorbedAddresses) {
      // clear info for absorbed addresses
      borrowerMap[address] = newBorrower(address);
    }

    lastBlock = startingBlockNumber;
  }

  // async function loop() {
  //   const startingBlockNumber = await hre.ethers.provider.getBlockNumber();
  //   console.log(`Generating candidates for blockNumber: ${startingBlockNumber}`);
  //   const candidates = generateCandidates(borrowerMap, startingBlockNumber);
  //   if (candidates.length == 0) {
  //     console.log(`0 candidates found for blockNumber: ${startingBlockNumber}; waiting ${loopDelay / 1000} seconds \n`);
  //     await new Promise(resolve => setTimeout(resolve, loopDelay));
  //   } else {
  //     console.log(`${candidates.length} candidates found`);
  //     for (const candidate of candidates) {
  //       console.log(`Updating candidate.address: ${candidate.address}`);
  //       const updatedCandidate = await updateCandidate(hre, comet, candidate);
  //       borrowerMap[candidate.address] = updatedCandidate;
  //       console.log(`liquidationMargin: ${updatedCandidate.liquidationMargin}`);
  //       if (isLiquidatable(updatedCandidate)) {
  //         console.log(`${updatedCandidate.address} liquidatable`);
  //         await absorbAddress(comet, signer.address, updatedCandidate.address);
  //       } else {
  //         console.log(`${updatedCandidate.address} not liquidatable`);
  //       }
  //       console.log("\n");
  //     }
  //   }
  //   await loop();
  // }
  // await loop();

}

export default main;