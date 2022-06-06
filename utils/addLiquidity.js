import { Contract, utils } from 'ethers';
import {
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/*
addLiquidity helps add liquidity to the exchange. If the user is adding initial
liquidity, user decides the ether and CD (Crypto Devs) tokens he wants to add to
the exchange. If she is adding the liquidity after the initial liquidity has already
been added then we calculate the CD tokens she can add, given the Eth she wants to 
add by keeping the ratios constant.
*/
export const addLiquidity  = async (
    signer,
    addCDAmountWei,
    addEtherAmountWei
) => {
    try {
        //create a new instance of the token contract
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            signer
        );
        //create a new instance of the exchange contract
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            signer
        );
        //because CD tokens are an ERC20, user would need to give the contract
        //allowance to take the required number of CD tokens out of her contract
        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addCDAmountWei.toString()
        );
        await tx.wait();
        //after the contract has the approval, add the ether and CD tokens in the liquidity
        tx = await exchangeContract.addLiquidity(addCDAmountWei, {
            value: addEtherAmountWei,
        });
        await tx.wait();
    } catch (err) {
        console.error(err);
    }
};

//calculateCD calculates the CD tokens that need to be added to the liquidity
//given '_addEtherAmountWei' amount of ether
export const calculateCD = async (
    _addEther = "0",
    etherBalanceContract,
    cdTokenReserve
) => {
    /*
    _addEther is a string, we need to convert it to a Bignumber before we can do our calculations,
    we do that using the 'parseEther' function from 'ethers.js'
    */
    const _addEtherAmountWei = utils.parseEther(_addEther);
    /*
    Ratio needs to be maintained when we add liquidity. We need to let the user know for a specific
    amount of ether how many 'CD' tokens. Sha can add so that the price impact is not large.
    The ratio we follow is (amount of Crypto Dev tokens to be added) / (Crypto Dev tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
    So by maths we get (amount of Crypto Dev tokens to be added) = (Eth that would be added * Crypto Dev tokens balance) / (Eth reserve in the contract)
    */
    const cryptoDevTokenAmount = _addEtherAmountWei.mul(cdTokenReserve).div(etherBalanceContract);
    return cryptoDevTokenAmount;
};