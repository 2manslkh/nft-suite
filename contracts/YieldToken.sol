//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract YieldToken is ERC20Capped {
    using SafeMath for uint256;

    uint256 public constant BASE_RATE = 10 ether; // 10 Candy
    uint256 public constant INITIAL_ISSUANCE = 300 ether; // 300 Candy
    IERC721 public CHEEKY_CORGI;

    // Tue Mar 18 2031 17:46:47 GMT+0000
    uint256 public constant END = 1931622407;
    // uint256 public constant END = 1629043200;

    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lastUpdate;

    // Events
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _uninterestedUnicorns, uint256 maxSupply)
        ERC20("Yield Token", "Token")
        ERC20Capped(maxSupply)
    {
        CHEEKY_CORGI = IERC721(_uninterestedUnicorns);
    }

    /// @dev get smaller value of a and b
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /// @dev called when minting many NFTs
    /// @dev NOT REQUIRED
    /// updated_amount = (balanceOG(user) * base_rate * delta / 86400) + amount * initial rate
    function updateRewardOnMint(address _user, uint256 _amount) external {
        require(
            msg.sender == address(CHEEKY_CORGI),
            "YieldToken: Only UU can call this"
        );
        uint256 time = min(block.timestamp, END);
        uint256 timerUser = lastUpdate[_user];
        if (timerUser > 0) {
            rewards[_user] = rewards[_user].add(
                CHEEKY_CORGI
                    .balanceOf(_user)
                    .mul(BASE_RATE.mul((time.sub(timerUser))))
                    .div(86400)
                    .add(_amount.mul(INITIAL_ISSUANCE))
            );
        } else {
            rewards[_user] = rewards[_user].add(_amount.mul(INITIAL_ISSUANCE));
        }
        lastUpdate[_user] = time;
    }

    // called on transfers
    function updateReward(address _from, address _to) external {
        require(
            msg.sender == address(CHEEKY_CORGI),
            "YieldToken: Only UU can call this"
        );
        uint256 time = min(block.timestamp, END);
        uint256 timerFrom = lastUpdate[_from];
        if (timerFrom > 0) {
            rewards[_from] += CHEEKY_CORGI
                .balanceOf(_from)
                .mul(BASE_RATE.mul((time.sub(timerFrom))))
                .div(86400);
        }
        if (timerFrom != END) {
            lastUpdate[_from] = time;
        }
        if (_to != address(0)) {
            uint256 timerTo = lastUpdate[_to];
            if (timerTo > 0) {
                rewards[_to] += CHEEKY_CORGI
                    .balanceOf(_to)
                    .mul(BASE_RATE.mul((time.sub(timerTo))))
                    .div(86400);
            }
            if (timerTo != END) {
                lastUpdate[_to] = time;
            }
        }
    }

    function getReward(address _to) external {
        require(msg.sender == address(CHEEKY_CORGI));
        uint256 reward = rewards[_to];
        if (reward > 0) {
            rewards[_to] = 0;
            _mint(_to, reward);
            emit RewardPaid(_to, reward);
        }
    }

    function burn(address _from, uint256 _amount) external {
        require(msg.sender == address(CHEEKY_CORGI));
        _burn(_from, _amount);
    }

    function getTotalClaimable(address _user) external view returns (uint256) {
        uint256 time = min(block.timestamp, END);
        uint256 pending = CHEEKY_CORGI
            .balanceOf(_user)
            .mul(BASE_RATE.mul((time.sub(lastUpdate[_user]))))
            .div(86400);
        return rewards[_user] + pending;
    }
}
