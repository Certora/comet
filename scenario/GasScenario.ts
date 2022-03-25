import { CometProperties, scenario } from './context/CometContext';
import { expect } from 'chai';
import { exp, wait } from '../test/helpers';
import { opCodesForTransaction } from "../test/trace";

/** SUPPLY */

// COLD SUPPLY BASE (USDC)
// https://etherscan.io/tx/0x2336172d3ceda04c9f9d7bdc836ed3bd11c51f780fe8c3cdea6569ee007ef92b
// Comet: 126,251 gas
// Compound v2: 200,032 gas
scenario(
  'gas# cold supply base (USDC)',
  { },
  async ({ comet, assets, actors }, world, context) => {
    let {betty} = actors;
    let tokenAmounts = {
      'USDC': exp(200, 6),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.approve(betty, comet);

      await asset.token.connect(minter).transfer(
        primary.address,
        amount / 2n
      );
      await asset.token.connect(minter).transfer(
        betty.address,
        amount / 2n
      );
    }

    let tx1 = await wait(comet.connect(betty.signer).supply(await comet.baseToken(), exp(100, 6)));
    let tx2 = await wait(comet.connect(primary.signer).supply(await comet.baseToken(), exp(100, 6)));
    // console.log({tx})

    const { totalGasCost: totalGasCost1, orderedOpcodeCounts: orderedOpcodeCounts1, opcodeGasTotal: opcodeGasTotal1 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx1
    );
    const { totalGasCost: totalGasCost2, orderedOpcodeCounts: orderedOpcodeCounts2, opcodeGasTotal: opcodeGasTotal2 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx2
    );
    console.log(`totalGasCost1: ${totalGasCost1}`);
    console.log(`totalGasCost2: ${totalGasCost2}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

// WARM SUPPLY BASE (USDC)
// https://etherscan.io/tx/0xc3545bb7f9eb503389aa52188e3e2b66dfa024beac2fd19c5c06675e9e98461c
// Comet: 92,943 gas
// Compound v2: 173,462 gas
scenario(
  'gas# warm supply base (USDC)',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'USDC': exp(300, 6),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    // Supply twice so the second time is warm
    await wait(comet.connect(primary.signer).supply(await comet.baseToken(), exp(100, 6)));
    let tx = await wait(comet.connect(primary.signer).supply(await comet.baseToken(), exp(200, 6)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

// COLD SUPPLY WETH
// https://etherscan.io/tx/0x1e72b191e9679918a72becf35b2ca398b2419339bd5f7d292a3a21444d8888aa
// Comet: 143,293 gas
// Compound v2: 142,751 gas
scenario(
  'gas# cold supply WETH',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let {betty} = actors;

    let tokenAmounts = {
      'WETH': exp(0.01, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      console.log(await asset.balanceOf(minter.address))
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount / 2n
      );
      await asset.approve(betty, comet);
      await asset.token.connect(minter).transfer(
        betty.address,
        amount / 2n
      );
    }

    let tx1 = await wait(comet.connect(betty.signer).supply(assets['WETH'].address, exp(0.005, 18)));
    let tx2 = await wait(comet.connect(primary.signer).supply(assets['WETH'].address, exp(0.005, 18)));
    // console.log({tx})

    const { totalGasCost: totalGasCost1, orderedOpcodeCounts: orderedOpcodeCounts1, opcodeGasTotal: opcodeGasTotal1 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx1
    );
    const { totalGasCost: totalGasCost2, orderedOpcodeCounts: orderedOpcodeCounts2, opcodeGasTotal: opcodeGasTotal2 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx2
    );
    console.log(`totalGasCost1: ${totalGasCost1}`);
    console.log(`totalGasCost2: ${totalGasCost2}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`WETH balance of user is: ${await comet.collateralBalanceOf(primary.signer.address, assets['WETH'].address)}`)
  }
);

// WARM SUPPLY WETH
// https://etherscan.io/tx/0x803544cab1b5f53a1d5d1ceaf22208d264f4bf87b82c7022ee7b2a3fade456b6
// Comet: 69,759 gas
// Compound v2: 128,277 gas
scenario(
  'gas# warm supply WETH',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WETH': exp(0.01, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      console.log(await asset.balanceOf(minter.address))
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    // Supply twice so the second time is warm
    await wait(comet.connect(primary.signer).supply(assets['WETH'].address, exp(0.005, 18)));
    let tx = await wait(comet.connect(primary.signer).supply(assets['WETH'].address, exp(0.005, 18)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`WETH balance of user is: ${await comet.collateralBalanceOf(primary.signer.address, assets['WETH'].address)}`)
  }
);

// COLD SUPPLY WBTC
// https://etherscan.io/tx/0xca37abcd08f7a47fc47f26a2e5b83a760464c4d7eaa0f32293fbab1bf288db04
// Comet: 150,489 gas
// Compound v2: 190,736 gas
scenario(
  'gas# cold supply WBTC',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let {betty} = actors;
    let tokenAmounts = {
      'WBTC': exp(2, 8),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      console.log(await asset.balanceOf(minter.address))
      await asset.approve(primary, comet);
      await asset.approve(betty, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount / 2n
      );
      await asset.token.connect(minter).transfer(
        betty.address,
        amount / 2n
      );
    }

    let tx1 = await wait(comet.connect(betty.signer).supply(assets['WBTC'].address, exp(0.5, 8)));
    let tx2 = await wait(comet.connect(primary.signer).supply(assets['WBTC'].address, exp(0.5, 8)));
    // console.log({tx})

    const { totalGasCost: totalGasCost1, orderedOpcodeCounts: orderedOpcodeCounts1, opcodeGasTotal: opcodeGasTotal1 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx1
    );
    const { totalGasCost: totalGasCost2, orderedOpcodeCounts: orderedOpcodeCounts2, opcodeGasTotal: opcodeGasTotal2 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx2
    );
    console.log(`totalGasCost1: ${totalGasCost1}`);
    console.log(`totalGasCost2: ${totalGasCost2}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`WETH balance of user is: ${await comet.collateralBalanceOf(primary.signer.address, assets['WETH'].address)}`)
  }
);
// WARM SUPPLY WBTC
// https://etherscan.io/tx/0xccf24f250543375df8ee8f8c4b9088432d46cf6b2fcc6bb7012c576a6ff4bcdf
// Comet: 76,955 gas
// Compound v2: 176,466 gas
scenario(
  'gas# warm supply WBTC',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WBTC': exp(1, 8),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      console.log(await asset.balanceOf(minter.address))
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    // Supply twice so the second time is warm
    await wait(comet.connect(primary.signer).supply(assets['WBTC'].address, exp(0.5, 8)));
    let tx = await wait(comet.connect(primary.signer).supply(assets['WBTC'].address, exp(0.5, 8)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`WETH balance of user is: ${await comet.collateralBalanceOf(primary.signer.address, assets['WETH'].address)}`)
  }
);

/** WITHDRAW */
/** Hard to compare because withdraw in v2 actually checks if position is collateralized */

// WITHDRAW BASE (USDC)
// https://etherscan.io/tx/0x988a690ccf5b5922a6c80f918e77c1a6b4bca7d4429d95246d8bc7ce4c311fb4
// https://etherscan.io/tx/0x7b8edf01a4372121f1c377b33eb47cdcbe2f807a2020de02b6b8672e6e61a271
// Comet: 77,583 gas if withdraw all, 87,183 gas for partial withdraw
// Compound v2: 165,748 - 194,578 gas
scenario(
  'gas# withdraw base (USDC) all',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'USDC': exp(200, 6),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    await comet.connect(primary.signer).supply(await comet.baseToken(), exp(200, 6));
    let tx = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(200, 6)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

scenario(
  'gas# withdraw base (USDC) partial',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'USDC': exp(200, 6),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    await comet.connect(primary.signer).supply(await comet.baseToken(), exp(200, 6));
    let tx = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(100, 6)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

// WITHDRAW WETH
// https://etherscan.io/tx/0xb8afd3e6735abc76c01854b55bda01d41ad8eee60ed4db0efed2a839b5baf8e7 (0 collateral)
// https://etherscan.io/tx/0x2e655149527983360ab49aaedd2ae6caf65598841a2ebe85b5241163850089a2 (11 collateral)
// Comet: 96,774 gas if withdraw all, 112,210 gas for partial withdraw
// Compound v2: 130,626 - 578,100
scenario(
  'gas# withdraw WETH all',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WETH': exp(0.01, 18),    
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    await comet.connect(primary.signer).supply(assets['WETH'].address, exp(0.01, 18));
    let tx = await wait(comet.connect(primary.signer).withdraw(assets['WETH'].address, exp(0.01, 18)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

scenario(
  'gas# withdraw WETH partial',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WETH': exp(0.01, 18),    
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    await comet.connect(primary.signer).supply(assets['WETH'].address, exp(0.01, 18));
    let tx = await wait(comet.connect(primary.signer).withdraw(assets['WETH'].address, exp(0.005, 18)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

// WITHDRAW WBTC
// https://etherscan.io/tx/0x732d068bb4f5284e1894409266181d1b7d4904edf16b13fc1c2b97c68c787d26
// Comet: 80,531 gas if withdraw all, 95,738 gas for partial withdraw
// Compound v2: 187,992 (0 collateral)
scenario(
  'gas# withdraw WBTC all',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WBTC': exp(1, 8),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    await comet.connect(primary.signer).supply(assets['WBTC'].address, exp(1, 8));
    let tx = await wait(comet.connect(primary.signer).withdraw(assets['WBTC'].address, exp(1, 8)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

scenario(
  'gas# withdraw WBTC partial',
  {},
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WBTC': exp(1, 8),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      await asset.approve(primary, comet);
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
    }

    await comet.connect(primary.signer).supply(assets['WBTC'].address, exp(1, 8));
    let tx = await wait(comet.connect(primary.signer).withdraw(assets['WBTC'].address, exp(0.5, 8)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
    // console.log(`base balance of user is: ${await comet.baseBalanceOf(primary.signer.address)}`)
  }
);

/** BORROW */

// BORROW WITH 1 COLLATERAL
// https://etherscan.io/tx/0x7715fd81aeb13f09ad9eb28b6eeff13b59e6582b65897061c81df236d997711b
// Comet: 140,846 gas warm, 140,549 gas cold
// Compound v2: 244,866 gas
scenario(
  'gas# warm borrow with 1 collateral asset',
  { utilization: 0.5, defaultBaseAmount: 5000 },
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'LINK': exp(10, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      // await context.sourceTokens(world, amount, asset, primary);
      await asset.approve(primary, comet);
      console.log('minter has ')
      console.log(await asset.balanceOf(minter.address))
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
      console.log('transferred')
      await comet.connect(primary.signer).supply(asset.address, amount);
      console.log('supplied')
      // console.log("gas", token, asset, await primary.getCollateralBalance(asset));
    }

    // Borrow twice so the second time is warm
    await comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(1, 6));
    let tx = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(10, 6)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
  }
);

scenario(
  'gas# cold borrow with 1 collateral asset',
  { utilization: 0.5, defaultBaseAmount: 5000 },
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'LINK': exp(10, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      // await context.sourceTokens(world, amount, asset, primary);
      await asset.approve(primary, comet); //
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
      await comet.connect(primary.signer).supply(asset.address, amount);
      // console.log("gas", token, asset, await primary.getCollateralBalance(asset));
    }

    let tx = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(10, 6)));    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
  }
);

// BORROW WITH 2 COLLATERAL
// https://etherscan.io/tx/0x5b827a10462496328f320125d0e8819d07ad7fd8bcba872d2c99f45167ed3261
// Comet: 145,228 gas warm, 144,920 gas cold
// Compound v2: 289,588 gas
scenario(
  'gas# warm borrow with 2 collateral assets',
  { remote_token: { mainnet: ['WBTC'] }, utilization: 0.5, defaultBaseAmount: 5000 },
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WBTC': exp(0.0001, 8),
      'WETH': exp(0.01, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      // await context.sourceTokens(world, amount, asset, primary);
      await asset.approve(primary, comet); //
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
      await comet.connect(primary.signer).supply(asset.address, amount);
      // console.log("gas", token, asset, await primary.getCollateralBalance(asset));
    }

    // Borrow twice so the second time is warm
    await comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(1, 6));
    let tx = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(10, 6)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
  }
);

scenario(
  'gas# cold borrow with 2 collateral assets',
  { remote_token: { mainnet: ['WBTC'] }, utilization: 0.5, defaultBaseAmount: 5000 },
  async ({ comet, assets, actors }, world, context) => {
    let tokenAmounts = {
      'WBTC': exp(0.0001, 8),
      'WETH': exp(0.01, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      // await context.sourceTokens(world, amount, asset, primary);
      await asset.approve(primary, comet); //
      await asset.token.connect(minter).transfer(
        primary.address,
        amount
      );
      await comet.connect(primary.signer).supply(asset.address, amount);
      // console.log("gas", token, asset, await primary.getCollateralBalance(asset));
    }

    let tx = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(10, 6)));
    // console.log({tx})

    const { totalGasCost, orderedOpcodeCounts, opcodeGasTotal } = await opCodesForTransaction(
      world.hre.network.provider,
      tx
    );
    console.log(`totalGasCost: ${totalGasCost}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
  }
);

// BORROW WITH 3 COLLATERAL
// https://etherscan.io/tx/0x0dd1c7ad810584e1a125f21a8ff4077826e63e31d13743a4886606e3b5eca88e
// Comet: 198,906 gas warm, 198,598 cold
// Compound v2: 332,696 gas
scenario.only(
  'gas# warm borrow with 3 collateral assets',
  { remote_token: { mainnet: ['WBTC'] }, utilization: 0.5, defaultBaseAmount: 5000 },
  async ({ comet, assets, actors }, world, context) => {
    let {betty} = actors;
    let tokenAmounts = {
      'WBTC': exp(.07, 8),
      'WETH': exp(0.01, 18),
      'UNI': exp(100, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      // await context.sourceTokens(world, amount, asset, primary);
      await asset.approve(primary, comet); //
      await asset.token.connect(minter).transfer(
        primary.address,
        amount / 2n
      );
      await comet.connect(primary.signer).supply(asset.address, amount / 2n);
      await asset.approve(betty, comet); //
      await asset.token.connect(minter).transfer(
        betty.address,
        amount / 2n
      );
      await comet.connect(betty.signer).supply(asset.address, amount / 2n);
      // console.log("gas", token, asset, await primary.getCollateralBalance(asset));
    }

    let tx1 = await wait(comet.connect(betty.signer).withdraw(await comet.baseToken(), exp(750, 6)));

    // Borrow twice so the second time is warm
    await comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(10, 6));
    let tx2 = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(750, 6)));
    // console.log({tx})

    const { totalGasCost: totalGasCost1, orderedOpcodeCounts: orderedOpcodeCounts1, opcodeGasTotal: opcodeGasTotal1 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx1
    );
    const { totalGasCost: totalGasCost2, orderedOpcodeCounts: orderedOpcodeCounts2, opcodeGasTotal: opcodeGasTotal2 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx2
    );
    console.log(`totalGasCost1: ${totalGasCost1}`);
    console.log(`totalGasCost2: ${totalGasCost2}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
  }
);

scenario.only(
  'gas# cold borrow with 3 collateral assets',
  { remote_token: { mainnet: ['WBTC'] }, utilization: 0.5, defaultBaseAmount: 5000 },
  async ({ comet, assets, actors }, world, context) => {
    let {betty} = actors;
    let tokenAmounts = {
      'WBTC': exp(.07, 8),
      'WETH': exp(0.01, 18),
      'UNI': exp(100, 18),
    };
    const minterAddress = "0xdd940fc821853799eaf27e9eb0a420ed3bcdc3ef";
    const minter = await world.impersonateAddress(minterAddress);

    let primary = context.primaryActor();
    for (let [token, amount] of Object.entries(tokenAmounts)) {
      let asset = assets[token]!;
      // await context.sourceTokens(world, amount, asset, primary);
      await asset.approve(primary, comet); //
      await asset.token.connect(minter).transfer(
        primary.address,
        amount / 2n
      );
      await comet.connect(primary.signer).supply(asset.address, amount / 2n);
      await asset.approve(betty, comet); //
      await asset.token.connect(minter).transfer(
        betty.address,
        amount / 2n
      );
      await comet.connect(betty.signer).supply(asset.address, amount / 2n);
      // console.log("gas", token, asset, await primary.getCollateralBalance(asset));
    }

    let tx1 = await wait(comet.connect(betty.signer).withdraw(await comet.baseToken(), exp(750, 6)));
    let tx2 = await wait(comet.connect(primary.signer).withdraw(await comet.baseToken(), exp(750, 6)));
    // console.log({tx})

    const { totalGasCost: totalGasCost1, orderedOpcodeCounts: orderedOpcodeCounts1, opcodeGasTotal: opcodeGasTotal1 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx1
    );
    const { totalGasCost: totalGasCost2, orderedOpcodeCounts: orderedOpcodeCounts2, opcodeGasTotal: opcodeGasTotal2 } = await opCodesForTransaction(
      world.hre.network.provider,
      tx2
    );
    console.log(`totalGasCost1: ${totalGasCost1}`);
    console.log(`totalGasCost2: ${totalGasCost2}`);
    // console.log(`opcodeGasTotal: ${opcodeGasTotal}`);
    // console.log(orderedOpcodeCounts);
  }
);