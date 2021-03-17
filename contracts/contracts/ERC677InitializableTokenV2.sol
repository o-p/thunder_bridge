pragma solidity 0.4.24;

import "./ERC677InitializableToken.sol";

contract ERC677InitializableTokenV2 is ERC677InitializableToken {
    mapping(address => bool) allowTransferCallback;

    function transfer(address _to, uint256 _value) public returns (bool)
    {
        require(superTransfer(_to, _value), "failed superTransfer");
        fundReceiver(_to);

        if (isContract(_to)) {
            if (_to == bridgeContract || allowTransferCallback[_to]) {
                if (!triggerTransferCallback(_to, _value, new bytes(0))) {
                    revert("Invoke transfer callback failed");
                }
            }
        }
        return true;
    }

    function enableTransferCallback(address _token) public onlyOwner {
        allowTransferCallback[_token] = true;
    }

    function disableTransferCallback(address _token) public onlyOwner {
        delete allowTransferCallback[_token];
    }

    function triggerTransferCallback(address _to, uint _value, bytes _data) internal returns (bool) {
        return _to.call(
            abi.encodeWithSignature(
                "onTokenTransfer(address,uint256,bytes)",
                msg.sender,
                _value,
                _data
            )
        );
    }

    function isContract(address _addr) private view returns (bool) {
        uint length;
        assembly { length := extcodesize(_addr) }
        return length > 0;
    }
}
