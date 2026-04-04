// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ZenAgentRegistry {
    event UserRegistered(address indexed user, string username, uint256 timestamp);
    event CheckInLogged(
        address indexed user,
        uint8 mood,
        uint8 stress,
        uint8 sleep,
        uint256 timestamp,
        uint256 streak
    );
    event WorldIDVerified(address indexed user, bytes32 nullifierHash);
    event ENSNameSet(address indexed user, string ensName);
    event ReferralRecorded(address indexed referrer, address indexed referred);

    uint256 private constant STREAK_WINDOW = 36 hours;

    mapping(address => string) private _usernameOf;
    mapping(address => uint256) private _registeredAt;
    mapping(bytes32 => address) private _usernameHashToUser;

    mapping(address => bytes32) private _worldIdNullifierOf;
    mapping(bytes32 => bool) private _worldIdNullifierUsed;

    mapping(address => string) private _ensNameOf;

    mapping(address => uint256) private _lastCheckInAt;
    mapping(address => uint256) private _totalCheckIns;
    mapping(address => uint256) private _streak;

    mapping(address => address) private _referrerOf;
    mapping(address => uint256) private _referralCount;

    function registerUser(string memory username) external {
        require(_registeredAt[msg.sender] == 0, 'Already registered');
        bytes32 usernameHash = _hashUsername(username);
        require(usernameHash != bytes32(0), 'Invalid username');
        require(_usernameHashToUser[usernameHash] == address(0), 'Username taken');

        _usernameOf[msg.sender] = username;
        _registeredAt[msg.sender] = block.timestamp;
        _usernameHashToUser[usernameHash] = msg.sender;

        emit UserRegistered(msg.sender, username, block.timestamp);
    }

    function logCheckIn(uint8 mood, uint8 stress, uint8 sleep, string memory) external {
        require(_registeredAt[msg.sender] != 0, 'Not registered');
        require(_worldIdNullifierOf[msg.sender] != bytes32(0), 'World ID not verified');
        require(mood >= 1 && mood <= 10, 'Mood out of range');
        require(stress >= 1 && stress <= 10, 'Stress out of range');
        require(sleep >= 1 && sleep <= 10, 'Sleep out of range');

        uint256 last = _lastCheckInAt[msg.sender];
        if (last == 0) {
            _streak[msg.sender] = 1;
        } else if (block.timestamp - last > STREAK_WINDOW) {
            _streak[msg.sender] = 1;
        } else {
            _streak[msg.sender] = _streak[msg.sender] + 1;
        }

        _lastCheckInAt[msg.sender] = block.timestamp;
        _totalCheckIns[msg.sender] = _totalCheckIns[msg.sender] + 1;

        emit CheckInLogged(msg.sender, mood, stress, sleep, block.timestamp, _streak[msg.sender]);
    }

    function getBadges(address user) external view returns (bool sevenDay, bool thirtyDay, bool ninetyDay) {
        uint256 s = _streak[user];
        sevenDay = s >= 7;
        thirtyDay = s >= 30;
        ninetyDay = s >= 90;
    }

    function getStreak(address user) external view returns (uint256) {
        return _streak[user];
    }

    function getTotalCheckIns(address user) external view returns (uint256) {
        return _totalCheckIns[user];
    }

    function setWorldIDVerified(address user, bytes32 nullifierHash) external {
        require(_registeredAt[user] != 0, 'Not registered');
        require(nullifierHash != bytes32(0), 'Invalid nullifier');
        require(_worldIdNullifierOf[user] == bytes32(0), 'World ID already set');
        require(!_worldIdNullifierUsed[nullifierHash], 'Nullifier already used');

        _worldIdNullifierUsed[nullifierHash] = true;
        _worldIdNullifierOf[user] = nullifierHash;

        emit WorldIDVerified(user, nullifierHash);
    }

    function setENSName(string memory ensName) external {
        require(_registeredAt[msg.sender] != 0, 'Not registered');
        _ensNameOf[msg.sender] = ensName;
        emit ENSNameSet(msg.sender, ensName);
    }

    function setReferrer(address referrer) external {
        require(_registeredAt[msg.sender] != 0, 'Not registered');
        require(_referrerOf[msg.sender] == address(0), 'Referrer already set');
        require(_totalCheckIns[msg.sender] == 0, 'Too late to set referrer');
        require(referrer != address(0), 'Invalid referrer');
        require(referrer != msg.sender, 'Self referral');

        _referrerOf[msg.sender] = referrer;
        _referralCount[referrer] = _referralCount[referrer] + 1;

        emit ReferralRecorded(referrer, msg.sender);
    }

    function getReferralCount(address user) external view returns (uint256) {
        return _referralCount[user];
    }

    function getUserProfile(address user)
        external
        view
        returns (
            string memory username,
            uint256 streak,
            uint256 totalCheckIns,
            uint256 registeredAt,
            bool worldIDVerified,
            string memory ensName
        )
    {
        username = _usernameOf[user];
        streak = _streak[user];
        totalCheckIns = _totalCheckIns[user];
        registeredAt = _registeredAt[user];
        worldIDVerified = _worldIdNullifierOf[user] != bytes32(0);
        ensName = _ensNameOf[user];
    }

    function isUsernameAvailable(string memory username) external view returns (bool) {
        bytes32 usernameHash = _hashUsername(username);
        if (usernameHash == bytes32(0)) return false;
        return _usernameHashToUser[usernameHash] == address(0);
    }

    function _hashUsername(string memory username) private pure returns (bytes32) {
        bytes memory b = bytes(username);
        if (b.length == 0) return bytes32(0);
        return keccak256(b);
    }
}
