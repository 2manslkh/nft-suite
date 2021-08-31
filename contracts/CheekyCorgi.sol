//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/IYieldToken.sol";

contract CheekyCorgi is
    Context,
    AccessControlEnumerable,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable,
    Ownable
{
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // Public Constants
    address public constant DEAD =
        address(0x000000000000000000000000000000000000dEaD);
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant PRIVATE_SALE = 8;
    uint256 public constant MAX_QUANTITY = 10; // Maximum mint per transaction
    uint256 public constant LAUNCH_PRICE = 0.048 ether;
    uint256 public constant PRIVATE_SALE_PRICE = 0.03 ether;
    uint256 public constant PUBLIC_SALE_OPEN = 1631232000; // 10 Sept
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    string public PROVENANCE_HASH = "";

    IYieldToken public YIELD_TOKEN;

    // Public Variables
    uint256 public NAME_CHANGE_PRICE = 300 ether; // 300 Candy Tokens
    uint256 public BIO_CHANGE_PRICE = 100 ether; // 100 Candy Tokens

    address public ADMIN;
    address payable public TREASURY;
    mapping(uint256 => uint256) public birthTimes;
    mapping(uint256 => string) public bio;

    // Private Variables
    Counters.Counter private _tokenIds;
    string public baseTokenURI;
    uint256[] private _allTokens; // Array with all token ids, used for enumeration
    mapping(uint256 => string) private _tokenURIs; // Maps token index to URI
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens; // Mapping from owner to list of owned token IDs
    mapping(uint256 => uint256) private _ownedTokensIndex; // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _allTokensIndex; // Mapping from token id to position in the allTokens array
    mapping(uint256 => string) private _tokenName;
    mapping(string => bool) private _nameReserved;

    mapping(address => bool) private _privateSaleWhitelist;

    // Modifiers
    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "CheekyCorgi: OnlyAdmin"
        );
        _;
    }

    // Modifiers
    modifier onlyTreasury() {
        require(
            hasRole(TREASURY_ROLE, _msgSender()),
            "CheekyCorgi: OnlyTreasury"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        string memory _baseTokenURI,
        address admin,
        address payable treasury,
        address owner
    ) ERC721(name, symbol) {
        baseTokenURI = _baseTokenURI;
        ADMIN = admin;
        TREASURY = treasury;
        transferOwnership(owner);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        grantRole(DEFAULT_ADMIN_ROLE, ADMIN);
        _setupRole(TREASURY_ROLE, TREASURY);
    }

    // Events
    event Minted(address indexed minter, uint256 indexed tokenId);
    event Sacrifice(address indexed minter, uint256 indexed tokenId);
    event NameChange(uint256 indexed tokenId, string newName);
    event BioChange(uint256 indexed tokenId, string bio);

    function mint(uint256 _quantity) public payable whenNotPaused {
        require(
            totalSupply().add(_quantity) <= MAX_SUPPLY,
            "CheekyCorgi: Quantity must be lesser than MAX_SUPPLY = 6900"
        );
        require(
            _quantity > 0,
            "CheekyCorgi: Quantity must be greater then zero"
        );
        require(
            _quantity <= MAX_QUANTITY,
            "CheekyCorgi: Quantity must be less than MAX_QUANTITY = 10"
        );
        require(
            getPrice(_quantity) == msg.value,
            "CheekyCorgi: ETH Value incorrect (Quantity * LAUNCH_PRICE)"
        );
        require(
            block.timestamp >= PUBLIC_SALE_OPEN,
            "CheekyCorgi: Public Sale opens on 1st Sept 2021 00:00 UTC"
        );

        for (uint256 i = 0; i < _quantity; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _mint(_msgSender(), newItemId);
            emit Minted(_msgSender(), newItemId);
        }
        YIELD_TOKEN.updateRewardOnMint(_msgSender(), _quantity);
    }

    function privateMint() public payable whenNotPaused {
        require(
            totalSupply().add(1) <= MAX_SUPPLY,
            "CheekyCorgi: Quantity must be lesser than MAX_SUPPLY = 6900"
        );
        require(
            msg.value == PRIVATE_SALE_PRICE,
            "CheekyCorgi: ETH Value incorrect"
        );
        require(
            isWhitelisted(_msgSender()) == true,
            "CheekyCorgi: Not Whitelisted for private sale"
        );

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(_msgSender(), newItemId);
        _privateSaleWhitelist[_msgSender()] = false;
        emit Minted(_msgSender(), newItemId);

        YIELD_TOKEN.updateRewardOnMint(_msgSender(), 1);
    }

    // ------------------------- USER FUNCTION ---------------------------
    function getReward() external {
        YIELD_TOKEN.updateReward(msg.sender, address(0));
        YIELD_TOKEN.getReward(msg.sender);
    }

    /// @dev Allow user to change the unicorn bio
    function changeBio(uint256 _tokenId, string memory _bio) public virtual {
        address owner = ownerOf(_tokenId);
        require(_msgSender() == owner, "ERC721: caller is not the owner");
        YIELD_TOKEN.burn(msg.sender, BIO_CHANGE_PRICE);

        bio[_tokenId] = _bio;
        emit BioChange(_tokenId, _bio);
    }

    /// @dev Allow user to change the unicorn name
    function changeName(uint256 tokenId, string memory newName) public virtual {
        address owner = ownerOf(tokenId);
        require(_msgSender() == owner, "ERC721: caller is not the owner");
        require(validateName(newName) == true, "Not a valid new name");
        require(
            sha256(bytes(newName)) != sha256(bytes(_tokenName[tokenId])),
            "New name is same as the current one"
        );
        require(isNameReserved(newName) == false, "Name already reserved");

        YIELD_TOKEN.burn(msg.sender, NAME_CHANGE_PRICE);

        // If already named, dereserve old name
        if (bytes(_tokenName[tokenId]).length > 0) {
            toggleReserveName(_tokenName[tokenId], false);
        }
        toggleReserveName(newName, true);
        _tokenName[tokenId] = newName;
        emit NameChange(tokenId, newName);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        YIELD_TOKEN.updateReward(from, to);
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public override {
        YIELD_TOKEN.updateReward(from, to);
        super.safeTransferFrom(from, to, tokenId, _data);
    }

    /**
     * @dev Get Token URI Concatenated with Base URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI query for nonexistent token"
        );

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, tokenId));
        }

        return super.tokenURI(tokenId);
    }

    // ----------------------- CALCULATION FUNCTIONS -----------------------
    ///  @dev Calculates the total price of all the mints
    function getPrice(uint256 _quantity) public pure returns (uint256) {
        return _quantity * LAUNCH_PRICE;
    }

    /// @dev Convert String to lower
    function toLower(string memory str) public pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint256 i = 0; i < bStr.length; i++) {
            // Uppercase character
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    /// @dev Check if name is reserved
    function validateName(string memory str) public pure returns (bool) {
        bytes memory b = bytes(str);
        if (b.length < 1) return false;
        if (b.length > 25) return false; // Cannot be longer than 25 characters
        if (b[0] == 0x20) return false; // Leading space
        if (b[b.length - 1] == 0x20) return false; // Trailing space

        bytes1 lastChar = b[0];

        for (uint256 i; i < b.length; i++) {
            bytes1 char = b[i];

            if (char == 0x20 && lastChar == 0x20) return false; // Cannot contain continous spaces

            if (
                !(char >= 0x30 && char <= 0x39) && //9-0
                !(char >= 0x41 && char <= 0x5A) && //A-Z
                !(char >= 0x61 && char <= 0x7A) && //a-z
                !(char == 0x20) //space
            ) return false;

            lastChar = char;
        }

        return true;
    }

    function isWhitelisted(address _from) public view returns (bool) {
        return _privateSaleWhitelist[_from];
    }

    function isNameReserved(string memory nameString)
        public
        view
        returns (bool)
    {
        return _nameReserved[toLower(nameString)];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Set some NFTs aside
    function reserve(uint256 _count) public onlyAdmin {
        for (uint256 i = 0; i < _count; i++) {
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _mint(_msgSender(), newItemId);
        }
    }

    function tokenNameByIndex(uint256 index)
        public
        view
        returns (string memory)
    {
        return _tokenName[index];
    }

    function toggleReserveName(string memory str, bool isReserve) internal {
        _nameReserved[toLower(str)] = isReserve;
    }

    // ---------------------- ADMIN FUNCTIONS -----------------------

    function setYieldToken(address _YieldToken) external onlyAdmin {
        YIELD_TOKEN = IYieldToken(_YieldToken);
    }

    function setProvenanceHash(string memory provenanceHash) public onlyAdmin {
        PROVENANCE_HASH = provenanceHash;
    }

    function updateBaseURI(string memory newURI) public onlyAdmin {
        _setBaseURI(newURI);
    }

    ///  @dev Pauses all token transfers.
    function pause() public virtual onlyAdmin {
        _pause();
    }

    /// @dev Unpauses all token transfers.
    function unpause() public virtual onlyAdmin {
        _unpause();
    }

    function updateWhitelist(address[] calldata whitelist) public onlyAdmin {
        for (uint256 i = 0; i < whitelist.length; i++) {
            _privateSaleWhitelist[whitelist[i]] = true;
        }
    }

    function withdrawToTreasury() public onlyTreasury {
        uint256 withdrawAmount = address(this).balance;
        TREASURY.call{value: withdrawAmount}("");
    }

    // --------------------- INTERNAL FUNCTIONS ---------------------
    function _toggleReserveName(string memory str, bool isReserve) internal {
        _nameReserved[toLower(str)] = isReserve;
    }

    function _setBaseURI(string memory _baseTokenURI) internal virtual {
        baseTokenURI = _baseTokenURI;
    }

    /// @dev Gets baseToken URI
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            _exists(tokenId),
            "ERC721URIStorage: URI set of nonexistent token"
        );
        _tokenURIs[tokenId] = _tokenURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);

        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }
    }
}
