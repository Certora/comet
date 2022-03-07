import "B_cometSummarization.spec"
import "erc20.spec"


using SymbolicBaseToken as _baseToken 



methods {
    //temporary under approximations
    // isInAsset(uint16 assetsIn, uint8 assetOffset) => CONSTANT;
    latestRoundData() returns uint256 => DISPATCHER(true);

    //todo - move to setup?
    isBorrowCollateralized(address) returns bool envfree
    getUserCollateralBalance(address,address) returns uint128 envfree

    baseToken() returns address envfree
    getTotalSupplyBase() returns (uint104) envfree
    getTotalBorrowBase() returns (uint104) envfree 
    getTotalsSupplyAsset(address asset) returns (uint128) envfree  
    getReserves() returns (int) envfree
    targetReserves() returns (uint256) envfree

    _baseToken.balanceOf(address account) returns (uint256) envfree

    getUserCollateralBalanceByAsset(address, address) returns uint128 envfree
    call_Summarized_IsInAsset(uint16, uint8) returns (bool) envfree
    getAssetinOfUser(address) returns (uint16) envfree
    asset_index(address) returns (uint8) envfree
    tokenBalanceOf(address, address) returns uint256 envfree 
}

definition similarFunctions(method f) returns bool =    
            f.selector == withdraw(address,uint256).selector ||
            f.selector == withdrawTo(address,address,uint).selector ||
            f.selector == transferAsset(address,address,uint).selector ||
            f.selector == supplyTo(address,address,uint).selector ||
            f.selector == supply(address,uint).selector ;




ghost mathint sumUserBasicPrinciple  {
	init_state axiom sumUserBasicPrinciple==0; 
}

ghost mapping( address => mathint) sumBalancePerAssert {
    init_state axiom forall address t. sumBalancePerAssert[t]==0;
}


hook Sstore userBasic[KEY address a].principal int104 balance
    (int104 old_balance) STORAGE {
  sumUserBasicPrinciple  = sumUserBasicPrinciple +
      to_mathint(balance) - to_mathint(old_balance);
}

hook Sstore userCollateral[KEY address account][KEY address t].balance  uint128 balance (uint128 old_balance) STORAGE {
    sumBalancePerAssert[t] = sumBalancePerAssert[t] - old_balance + balance;
}

////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////   Michael   /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//

/* move to comet an use summarization */

// B@B - assetIn of a specific asset is initialized (!0) or uninitialized (0) along with the collateral balance
rule assetIn_Initialized_With_Balance(method f, address user, address asset) filtered { f -> f.selector != call_updateAssetsIn(address, address, uint128, uint128).selector } {
    env e; calldataarg args;
    require getUserCollateralBalanceByAsset(user, asset) == 0 <=> call_Summarized_IsInAsset(getAssetinOfUser(user), asset_index(asset));
    f(e, args);
    assert getUserCollateralBalanceByAsset(user, asset) == 0 <=> call_Summarized_IsInAsset(getAssetinOfUser(user), asset_index(asset));
}
// balance change => update asset



function simplifiedAssumptions() {
    env e;
    require getTotalBaseSupplyIndex(e) == baseIndexScale(e);
    require getTotalBaseBorrowIndex(e) == baseIndexScale(e);
    require _baseToken.balanceOf(currentContract) == getTotalSupplyBase() - getTotalBorrowBase();
}



rule sanity(method f) {
	env e;
	calldataarg arg;
	baseBalanceOf(e, arg);
	assert false, "this method should have a non reverting path";
}

// rule withdraw_min(){
//     env e;
//     withdraw(e,e.msg.sender,)
// }

rule usage_registered_assets_only(address asset, method f) {
    // check that every function call that has an asset arguments reverts on a non-registered asset 
    assert false, "todo";
}







rule verify_isBorrowCollateralized(address account, method f){
    env e;
    calldataarg args;

    bool collateralized1 = isBorrowCollateralized(account);
    f(e,args) ;
    bool collateralized2 = isBorrowCollateralized(account);

    assert collateralized1 == collateralized2;
}



