
certoraRun certora/harness/CometHarness.sol certora/harness/SymbolicBaseToken.sol certora/harness/SymbolicAssetTokenA.sol certora/harness/SymbolicAssetTokenB.sol certora/harness/SymbolicPriceOracleA.sol certora/harness/SymbolicPriceOracleB.sol \
    --verify CometHarness:certora/specs/comet.spec  \
    --link CometHarness:baseToken=SymbolicBaseToken \
    --solc solc8.11 \
    --staging shelly/divideConstantsOverJohnsBranch \
    --optimistic_loop \
    --settings -divideByConstants=1,-enableEqualitySaturation=false,-solver=z3,-smt_usePz3=true,-smt_z3PreprocessorTimeout=2 \
    --rule $1 \
    --loop_iter 2 \
    --msg "CometHarness:comet.spec $1 integratedJohnsBranches"
