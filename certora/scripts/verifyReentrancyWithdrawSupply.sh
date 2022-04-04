if [[ "$1" ]]
then
    RULE="--rule $1"
fi

certoraRun contracts/CometExt.sol certora/harness/CometHarness.sol certora/harness/SymbolicBaseToken.sol certora/harness/ERC20WithCallBack.sol certora/harness/SymbolicAssetTokenB.sol certora/harness/SymbolicPriceOracleA.sol certora/harness/SymbolicPriceOracleB.sol \
    --verify CometHarness:certora/specs/cometWithdrawSupply.spec  \
    --link CometHarness:baseToken=SymbolicBaseToken CometHarness:extensionDelegate=CometExt ERC20WithCallBack:comet=CometHarness \
    --solc solc8.11 \
    $RULE \
    --send_only \
    --optimistic_loop \
    --staging jtoman/comet-recursion \
    --settings -enableEqualitySaturation=false,-smt_usePz3=true,-contractRecursionLimit=1,-smt_z3PreprocessorTimeout=2 \
    --loop_iter 2 \
    --solc_args '["--experimental-via-ir"]' \
    --msg "CometHarness:cometWithdrawSupply.spec Reentrency $RULE"