import "A_setupNoSummarization.spec"
import "erc20.spec"

using SymbolicBaseToken as _baseToken 

methods{

    call_presentValue(int104) returns (int104) envfree;
    call_principalValue(int104) returns (int104) envfree;
    getAssetScaleByAsset(address) returns (uint64) envfree;
    getBaseSupplyIndex() returns (uint64) envfree;
    getBaseBorrowIndex() returns (uint64) envfree;
    getlastAccrualTime() returns (uint40) envfree;
    perSecondInterestRateBase() returns (uint256) envfree;
    perSecondInterestRateSlopeLow() returns (uint256) envfree;
    perSecondInterestRateSlopeHigh() returns (uint256) envfree;
    kink() returns (uint256) envfree;
    getBaseIndexScale() returns (uint64) envfree;
    targetReserves() returns (uint256) envfree;
    latestRoundData() returns (uint256) => DISPATCHER(true);
    get_FACTOR_SCALE() returns (uint64) envfree
}

////////////////////////////////////////////////////////////////////////////////
//////////////////////////   Interest Computations   ////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//


// BaseSupplyIndex and BaseBorrowIndex are monotonically increasing variables
// proved in supplyIndex_borrowIndex_GE_getBaseIndexScale.
function setup(env e){
    require getBaseSupplyIndex() >= getBaseIndexScale() &&
        getBaseBorrowIndex() >= getBaseIndexScale();
}

// The supply index and borrow index are set to the initial value - simplify computation
function simplifiedAssumptions() {
    require getBaseSupplyIndex() == getBaseIndexScale();
    require getBaseBorrowIndex() == getBaseIndexScale();
}



/*
    @Rule
        supplyIndex_borrowIndex_rise_with_time

    @Description: indices are increasing after accrue (when time elapse)
        baseSupplyIndex increase with time
        baseBorrowIndex increase with time

    @Formula:
        NowInternal(e) > lastAccrualTime() => baseSupplyIndex_2 > baseSupplyIndex_1 &&
                                              baseBorrowIndex_2 > baseBorrowIndex_1
    @Notes:

    @Link:
        
*/
rule supplyIndex_borrowIndex_rise_with_time(){
    env e;
    uint64 base_supply_index_1 = getBaseSupplyIndex();
    uint64 base_borrow_index_1 = getBaseBorrowIndex();
    call_accrueInternal(e);
    uint64 base_supply_index_2 = getBaseSupplyIndex();
    uint64 base_borrow_index_2 = getBaseBorrowIndex();

    assert call_getNowInternal(e) > getlastAccrualTime() => 
                   (base_supply_index_2 > base_supply_index_1 &&
                    base_borrow_index_2 > base_borrow_index_1);
}

/*
    @Rule
        supplyIndex_borrowIndex_monotonic

    @Description: supplyIndex_borrowIndex_monotonic
        baseSupplyIndex monotonic
        baseBorrowIndex monotonic

    @Formula:
        baseSupplyIndex_2 >= baseSupplyIndex_1 &&
        baseBorrowIndex_2 >= baseBorrowIndex_1

    @Notes:

    @Link:
        
*/
rule supplyIndex_borrowIndex_monotonic(){
    env e;
    uint64 base_supply_index_1 = getBaseSupplyIndex();
    uint64 base_borrow_index_1 = getBaseBorrowIndex();
    call_accrueInternal(e);
    uint64 base_supply_index_2 = getBaseSupplyIndex();
    uint64 base_borrow_index_2 = getBaseBorrowIndex();

    assert  base_supply_index_2 >= base_supply_index_1;
    assert  base_borrow_index_2 >= base_borrow_index_1;
}

/*
    @Rule
        supplyRate_vs_utilization

    @Description: utilization increase implies supplyRate increase
        If the utilization is increased the supplyRate cannot decrease

    @Formula:
        utilization_2 > utilization_1 => supplyRate_2 >= supplyRate_1

    @Notes:

    @Link:
        
*/
rule supplyRate_vs_utilization(){
    env e1; env e2;
    setup(e1);

    uint   utilization_1 = getUtilization(e1);
    uint64 supplyRate_1 = getSupplyRate(e1);

    uint utilization_2 = getUtilization(e2);
    uint64 supplyRate_2 = getSupplyRate(e2);

    assert utilization_2 > utilization_1 => supplyRate_2 >= supplyRate_1;
}

/*
    @Rule
        utilization_zero

    @Description:
        if borrowRate == base interest rate then utilization == 0
        When utilization is 0, borrow rate equals to the base borrow rate.

    @Formula:
        borrowRate == perSecondInterestRateBase() => Utilization() == 0

    @Notes:

    @Link:
        
*/
rule utilization_zero(){
    env e;
    setup(e);
    uint64 borrowRate = getBorrowRate(e);
    assert getUtilization(e) == 0 => borrowRate == perSecondInterestRateBase() ;
}


/*
    @Rule
        borrowBase_vs_utilization

    @Description:
        if BorrowBase == 0 utilization should equal zero
        If nobody borrows from the system, the utilization must be 0.

    @Formula:
        BorrowBase() == 0 => Utilization() == 0;

    @Notes:

    @Link:
        
*/
rule borrowBase_vs_utilization(){
    env e;
    assert getTotalBorrowBase(e) == 0 => getUtilization(e) == 0;
}

/*
    @Rule
        isLiquiditable_false_should_not_change

    @Description:
        Verifies that isLiquidatable == false can change to true only if getPrice() has changed for base or asset
        A liquiditable user cannot turn unliquiditable unless the price ratio of the collateral changed.

    @Formula:
        BorrowBase() == 0 => Utilization() == 0;

    @Notes: This is without calling any functions, just due to change in time that result a change in price

    @Link:
        
*/
rule isLiquidatable_false_should_not_change(address account){
    env e1; env e2;
    require e2.block.timestamp > e1.block.timestamp;
    setup(e1);

    /* we have two symbolic price feeds */
    address priceFeedBase;
    address priceFeedAsset;
    require priceFeedBase != priceFeedAsset;
    require isLiquidatable(e1,account) == false;
    uint priceBase1 = getPrice(e1,priceFeedBase);
    uint priceBase2 = getPrice(e2,priceFeedBase);

    uint priceAsset1 = getPrice(e1,priceFeedAsset);
    uint priceAsset2 = getPrice(e2,priceFeedAsset);

    assert isLiquidatable(e2,account) => 
                priceAsset1 != priceAsset2 || priceBase1 != priceBase2 ;
}

/* 
 Description :  
     isBorrowCollateralized => account can borrow, hence he's not Liquidatable
*/
// V@V - if a user is collateralized then they are not liquiditable
/*
    @Rule
        isCol_implies_not_isLiq

    @Description:
        isBorrowCollateralized => account can borrow, hence he's not Liquidatable
         if a user is collateralized then they are not liquiditable

    @Formula:
        isBorrowCollateralized(account) => !isLiquidatable(account);

    @Notes:

    @Link:
        
*/
rule isCol_implies_not_isLiq(address account){
    env e;
    address asset;
    // assuming a condition that exist in the constructor
    require getLiquidateCollateralFactor(e,asset) > getBorrowCollateralFactor(e,asset);

    assert isBorrowCollateralized(e,account) => !isLiquidatable(e,account);
}

/*
    @Rule
        supplyIndex_borrowIndex_GE_getBaseIndexScale

    @Description:
        Verifies that TotalBaseSupplyIndex and getBaseBorrowIndex always greater than getBaseIndexScale

    @Formula:
        BaseSupplyIndex() >= BaseIndexScale() &&
        BaseBorrowIndex() >= BaseIndexScale();


    @Notes: proved to be used in other rules.

    @Link:
        
*/
rule supplyIndex_borrowIndex_GE_getBaseIndexScale(){
    env e;
    require getBaseSupplyIndex() >= getBaseIndexScale() &&
        getBaseBorrowIndex() >= getBaseIndexScale();
    
    call_accrueInternal(e);

    assert getBaseSupplyIndex() >= getBaseIndexScale() &&
        getBaseBorrowIndex() >= getBaseIndexScale();
}

/*
    @Rule
        absolute_presentValue_GE_principal

    @Description:
        presentValue always greater than principalValue

    @Formula:
        presentValue >= _principalValue;

    @Notes: the absolute presentValue is GE to the absolut principleValue 

    @Link:
        
*/
rule absolute_presentValue_GE_principal(int104 presentValue){
    env e;
    setup(e);
    int104 principalValue = call_principalValue(presentValue);

    assert presentValue >= 0 => presentValue >= principalValue;
    assert presentValue < 0 => presentValue <= principalValue;
}


/*
    @Rule
        presentValue_G_zero

    @Description:
        presentValue is positive iff principleValue is positive

    @Formula:
        presentValue > 0 <=> principalValue > 0

    @Notes:

    @Link:
        
*/
rule presentValue_G_zero(int104 presentValue){
    env e;
    setup(e);
    int104 principalValue = call_principalValue(presentValue);
    assert presentValue > 0 <=> principalValue > 0;
}


/*
    @Rule
        presentValue_EQ_principal

    @Description:
        presentValue equal principalValue implies:

    @Formula:
        presentValue == principalValue => BaseSupplyIndex == BaseIndexScale

    @Notes:

    @Link:
        
*/
rule presentValue_EQ_principal(int104 presentValue){
    env e;
   setup(e);
    
    require getBaseBorrowIndex() > getBaseSupplyIndex(); // needed assumption
    // https://vaas-stg.certora.com/output/65782/683fbc8491afe9dab5e0/?anonymousKey=4f9fb2a878f00e7301e64c53ff9e3d55c804aa6b#presentValue_EQ_principalResults
    
    int104 principalValue = call_principalValue(presentValue);
    int104 presentValueInv = call_presentValue(principalValue);

    require presentValue != 0;
    // https://vaas-stg.certora.com/output/65782/a9dfef3acdd36876a26f/?anonymousKey=4649138f310d0a7a36b20d7d146e0f9e23d6215e

    assert presentValue == principalValue => 
            (getBaseSupplyIndex() == getBaseIndexScale() && 
            presentValueInv == presentValue);
}


/*
    @Rule
        utilization_zero_supplyRate_zero

    @Description:
        If utilization is 0, then supplyRate is 0

    @Formula:
        Utilization == 0 => SupplyRate == 0

    @Notes:

    @Link:
        
*/
rule utilization_zero_supplyRate_zero(){
    env e;
    assert getUtilization(e) == 0 => getSupplyRate(e) == 0;
}


/*
    @Rule
        getSupplyRate_revert_characteristic

    @Description:
        getSupplyRate should always revert if reserveRate > FACTOR_SCALE

    @Formula:
        reserveRate > FACTOR_SCALE => isRevert

    @Notes:

    @Link:
        
*/
rule getSupplyRate_revert_characteristic(){
    env e;
    getSupplyRate@withrevert(e);
    bool isRevert = lastReverted;

    assert (reserveRate(e) > get_FACTOR_SCALE()) => isRevert;
}

/*
    @Rule
        withdraw_more_reserves

    @Description:
        withdrawReserves cannot end up with negative reserves

    @Formula:
        reserveRate > FACTOR_SCALE => isRevert

    @Notes: Found bug - Accrue should be called prior to withdrawReserves()

    @Link:
        
*/
rule withdraw_more_reserves(address to , uint amount){
    env e;
    require to != currentContract;

    withdrawReserves(e,to, amount);
    call_accrueInternal(e);
    int reserves = getReserves(e);

    assert reserves >= 0;
}

/*
    @Rule
        verify_transferAsset

    @Description:
        transfer should not change the combine presentValue of src and dst

    @Formula:
        presentValue_src1 + presentValue_dst1 == presentValue_src2 + presentValue_dst2

    @Notes:

    @Link:
        
*/
rule verify_transferAsset(){
    env e;

    address src;
    address dst;
    address asset;
    uint amount;

    simplifiedAssumptions();

    mathint presentValue_src1 = to_mathint(call_presentValue(getPrincipal(e,src)));
    mathint presentValue_dst1 = to_mathint(call_presentValue(getPrincipal(e,dst)));

    transferAssetFrom(e, src, dst, asset, amount);

    mathint presentValue_src2 = to_mathint(call_presentValue(getPrincipal(e,src)));
    mathint presentValue_dst2 = to_mathint(call_presentValue(getPrincipal(e,dst)));

    assert presentValue_src1 + presentValue_dst1 == presentValue_src2 + presentValue_dst2;
}