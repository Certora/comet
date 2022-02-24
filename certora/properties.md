# Properties for Comet protocol

solidity flag `viaIR: true` ()

## Properties regarding accrue computation:

1. `SupplyIndex_BorrowIndex_GE_baseIndexScale` - Min value of baseSupplyIndex and baseBorrowIndex( ✅ ) - Gadi

2. `SupplyIndex_BorrowIndex_monotonic` - Monotonicity of baseSupplyIndex and baseBorrowIndex on accrue ( ✅ ) - Gadi

3. `SupplyIndex_BorrowIndex_rise_with_time` - Increase of baseSupplyIndex and baseBorrowIndex over time ( ✅ ) - Gadi



## Properties regarding interest computation: 

1. `borrowBase_vs_utilization` When no base is borrowed utilization should equal zero ( ✅ ) - Gadi

2. `utilization_zero` - Zero utilization is only on initial baseIntresetRate  ( ✅/❌ ) - Gadi * one implication out of iff

3. `isLiquiditable_false_should_not_change` - computation of isLiquidatable on the same state changes from false to true only due to price change or accrue ( 👷 ) - Gadi 

4. `isLiquiditable_true_should_not_change` - computation of isLiquidatable on the same state changes from true to false only due to price change, supplying more collateral, or supply more base ( 👷 ) - Gadi 

## Properties regarding variable evolution

1. `presentValue_greater_principle` - presentValue should always be greater or equal to principle. ( ✅ ) - Gadi

2. `presentValue_G_zero` - presentValue and principle value are initialized/not initialized together. ( ✅ ) - Gadi
    ```CVL
        presentValue > 0 <=> principleValue > 0
    ```

3. `presentValue_EQ_principle` - If presentValue and principle are equal, the totalBaseSupplyIndex is equal to baseIndexScale. ( ✅ ) - Gadi
    ```CVL
        present == principle => totalBaseSupplyIndex == baseIndexScale
    ``

## High level properties

1. `additivity_of_withdraw` - withdrawing x and then y in 2 distinct calls is equivalent to withdrawing x+y in a single call ( 🕝 ) - Gadi


## integrity of `pause()`:

1. `check_flag_updates` - pause revert only due to sender not being manager or guardian ( ✅ ) - Michael

2. `check_flag_getters` - getters return correct values according to pause input. ( ✅ ) - Michael

3. `check_pauseSupply_functionallity`, `check_pauseTransfer_functionallity`, `check_pauseWithdraw_functionallity`, `check_pauseAbsorb_functionallity`, `check_pauseBuy_functionallity` - relevant functions revert if pause guardian is on ( ✅ ) - Michael

## integrity of user collateral asset:

1. invariant `assetIn_Initialized_With_Balance` - iff user's balance of collateral asset is non-zero, the respective bit in assetIn is non-zero (👷) - Michael
    ```CVL
        User_Collateral_Balance_of_specific_asset == 0 <=> IsInAsset(Assetin_Of_User, Asset_Offset)
    ```

2. `check_update_UserCollater` - When `updateAssetIn` is being called with `initial_balance > 0 && final_balance == 0` the respective bit in assetIn should be 0 regardless of previous value, and when `initial_balance == 0 && final_balance > 0` the respective bit in assetIn should be 1 regardless of previous value. (👷) - Michael
    ```CVL
        initial_balance > 0 && final_balance == 0 => !IsInAsset(assetIn, assetOffset);
        initial_balance == 0 && final_balance > 0 => IsInAsset(assetIn, assetOffset);
    ```

3. `update_changes_single_bit` - update assetIn changes a single bit - it's impossible that 2 distinct asset bits will be change at the same call to update (🕝) - Michael

4. `update_changes_single_user_assetIn` - update assetIn changes the assetIn of a single user - no other users are affected by update. ( ✅ ) - Michael 







## work in progress/ questions 
 1. utilization <= factorScale()

 fails on total borrow (presentValue) can be greater then totalSupply (presentValue) hence utilization not bounded


  2. assumptions that are used but not checked in constructor:
 
     getTotalBaseSupplyIndex() >= baseIndexScale()       
     getTotalBaseBorrowIndex() >= baseIndexScale()
     getTotalBaseBorrowIndex() >= getTotalBaseSupplyIndex() -- not safe --
    getBorrowRate() > getSupplyRate()
    perSecondInterestRateSlopeLow() > 0 &&  perSecondInterestRateSlopeLow() < perSecondInterestRateSlopeHigh() -- check when needed --
    reserveRate() > 0

 
 
## Properties regarding comet*: 
starting to prove with some simplifications:

- baseSupplyIndex and baseBorrowIndex at baseIndexScale


1. The sum of collateral per asset over all users is equal to total collateral of asset ( ✔️ )
```CVL 
    sum(userCollateral[u][asset].balance) == totalsCollateral[asset].totalSupplyAsset
```

## work in progress 

1. Can always withdraw all collateral (assuming no debt) - low priority:
```CVL
    withdrawCollateral(userCollateral[user][asset].balance) will work
```

2. Each collateral asset should be unique (and probably distinct from the base asset).

3. The sum of collateral per asset over all users is equal to total collateral of asset:
```CVL 
sum(userCollateral[u][asset].balance) == totalsCollateral[asset].totalSupplyAsset
```

4. Summary of balances (base):
```CVL
sum(userBasic[u].principal) == totalsBasic.totalSupplyBase - totalsBasic.totalBorrowBase
```

5. Max totalSupplyAsset (collateral)*:
    1. ```CVL 
        totalsCollateral[asset].totalSupplyAsset <= getAssetInfo().supplyCap
        ```
    *This property can break in reality since a governor is able to change the config. In this case a governor can determine a supplycap smaller than current supply in the system. In this case the following property should hold:

    2. ```CVL
        totalsCollateral[asset].totalSupplyAsset > getAssetInfo().supplyCap => no deposit of assets are possible
        ```

6. TotalSupplyAsset vs. external balance (collateral)*:
```CVL
totalsCollateral[asset].totalSupplyAsset == asset.balanceOf(this)
```
*In reality it can break in case of external transfer directly to the contract.

7. TotalSupplyBase vs. external balance (base):
```CVL
totalsBasic.totalSupplyBase - totalsBasic.totalBorrowBase == base.balanceOf(this)
```
*It will be fine by the Compound team if we switch `==` with `<=`. can break with external transfer to the contract.

8. User’s collateral bigger than debt*:
```CVL
sum(userCollateral[user][asset].balance) >= presentValue(userBasic[user].principal)
```
*Assuming no price changes occur and `accrue` haven’t invoked. (`accrue` can pile debt on borrower and get him under water)

9. Maximum amount of debt:
```CVL
maxAmountToRepay <= amountBorrowed*((1+maxRate)**deltaT)

maxRate = baseRate + slopeLow*kink+slopeHigh*(1-kink)
```

10. Can always withdraw all liquidity:
```CVL
withdrawBase(getBorrowLiquidity()/priceFeed) will work always
```

11. If someone borrowed then his collateral more than zero:
    1. ```CVL
        borrow[user] != 0 => collateral[user] != 0
        ```
    
    2. On the borrowing block the collateral must be greater or equal to the borrow value.
    ```CVL
    collateral >= borrow
    ```

12. `liquidateCollateralFactor > borrowCollateralFactor` - Michael

13. A user should get more rewards (interest) if he keeps its liquidity for longer.

14. Accrual time not in the future - `LastAccrualTime <= now` - Michael

15. If a liquidity provider and a borrower are entering and exiting the system at the same time the LP should be eligible for the whole asset(no amount stays locked in the system)* - Gadi. </br> 
*This is a special case of summary of balances (base). It should be checked if the wholesome property is too heavy on the tool. </br>
**It also happen only when the percentage goes to reserve is 0.

17. A user cannot borrow amount smaller than minimum borrow.

18. If a user borrowed then their balance is greater than the minimum amount.
```CVL
user.borrow != 0 => user.borrow >= min_borrow_amount
```

19. Anti-Monotonicty of liquidation (absorb):
    1. ```CVL
        totalSupply increases <=> totalBorrow decreases
        ```
    2. After buyCollateral() base increase, collateral decrease.

20. Additivity of multi liquidation:
```CVL
absorb(user A);absorb(user B) ~ absorb([A,B])
```

22. Preserved total assets of users: </br>
assuming 1:1 price between all tokens on the same timestamp*:
```CVL
sumExternalTokens() := sum(for all token: token.balanceOf(User) ) //including 

basesumAllInternal() := sum(for all assets: userCollateral[u][asset].balance) +userBasic[user].principal

{ before = sumExternalTokens() + sumAllInternal()}

op

{ sumExternalTokens() + sumAllInternal() = before }
```
*maybe on liquidation goes up

23. If the `getBorrowLiquidity` is positive, then the `getLiquidationMargin` is positive:
```CVL
getBorrowLiquidity > 0 => getLiquidationMargin > 0 
```

24. If `isLiquidatable` then `getLiquidationMargin` is negative and `getBorrowLiquidity` is negative
```CVL
isLiquidatable => getLiquidationMargin < 0 && getBorrowLiquidity < 0
```

25. getSupplyRateInternal monotonic with respect to utilization:
```CVL
SupplyRate rise <=> getUtilizationInternal rise
```

26. borrow rate should always be higher than the supply rate:
```CVL
BorrowRate > SupplyRate
```

</br>

---
## TODO:</br>
1. `getBorrowLiquidity`  - probably can have a few rules

2. re-entrancy checks, especially in `absorb()` & `buyCollateral()`

| Rule | getTotalBaseSupplyIndex() >= baseIndexScale() && getTotalBaseBorrowIndex() >= baseIndexScale() | getTotalBaseBorrowIndex() > getTotalBaseSupplyIndex() | perSecondInterestRateSlopeLow() > 0 && perSecondInterestRateSlopeLow() < perSecondInterestRateSlopeHigh() | reserveRate(e) > 0 |
|----- | --- | -- | -- | -- |
| presentValue_GE_principal | X | V | X | X |
| presentValue_EQ_principal | X | X | V | X |