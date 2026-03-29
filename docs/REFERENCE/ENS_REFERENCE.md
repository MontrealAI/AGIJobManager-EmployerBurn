# ENS Reference (Generated)

Generated at (UTC): 1970-01-01T00:00:00Z
Source fingerprint: d91a2d20febf7e93

Source files used:
- `contracts/AGIJobManager.sol`
- `contracts/utils/ENSOwnership.sol`
- `contracts/ens/ENSJobPages.sol`
- `contracts/ens/IENSJobPages.sol`

## ENS surface area

- `bytes32 public clubRootNode;` ([contracts/AGIJobManager.sol#L401](../../contracts/AGIJobManager.sol#L401))
- `bytes32 public alphaClubRootNode;` ([contracts/AGIJobManager.sol#L402](../../contracts/AGIJobManager.sol#L402))
- `bytes32 public agentRootNode;` ([contracts/AGIJobManager.sol#L403](../../contracts/AGIJobManager.sol#L403))
- `bytes32 public alphaAgentRootNode;` ([contracts/AGIJobManager.sol#L404](../../contracts/AGIJobManager.sol#L404))
- `bytes32 public validatorMerkleRoot;` ([contracts/AGIJobManager.sol#L405](../../contracts/AGIJobManager.sol#L405))
- `bytes32 public agentMerkleRoot;` ([contracts/AGIJobManager.sol#L406](../../contracts/AGIJobManager.sol#L406))
- `ENS public ens;` ([contracts/AGIJobManager.sol#L407](../../contracts/AGIJobManager.sol#L407))
- `NameWrapper public nameWrapper;` ([contracts/AGIJobManager.sol#L408](../../contracts/AGIJobManager.sol#L408))
- `address public ensJobPages;` ([contracts/AGIJobManager.sol#L409](../../contracts/AGIJobManager.sol#L409))
- `bool public lockIdentityConfig;` ([contracts/AGIJobManager.sol#L412](../../contracts/AGIJobManager.sol#L412))
- `IENSRegistry public ens;` ([contracts/ens/ENSJobPages.sol#L110](../../contracts/ens/ENSJobPages.sol#L110))
- `INameWrapper public nameWrapper;` ([contracts/ens/ENSJobPages.sol#L111](../../contracts/ens/ENSJobPages.sol#L111))
- `IPublicResolver public publicResolver;` ([contracts/ens/ENSJobPages.sol#L112](../../contracts/ens/ENSJobPages.sol#L112))
- `bytes32 public jobsRootNode;` ([contracts/ens/ENSJobPages.sol#L113](../../contracts/ens/ENSJobPages.sol#L113))
- `string public jobsRootName;` ([contracts/ens/ENSJobPages.sol#L114](../../contracts/ens/ENSJobPages.sol#L114))
- `address public jobManager;` ([contracts/ens/ENSJobPages.sol#L115](../../contracts/ens/ENSJobPages.sol#L115))
- `bool public useEnsJobTokenURI;` ([contracts/ens/ENSJobPages.sol#L116](../../contracts/ens/ENSJobPages.sol#L116))
- `bool public configLocked;` ([contracts/ens/ENSJobPages.sol#L117](../../contracts/ens/ENSJobPages.sol#L117))
- `string public jobLabelPrefix;` ([contracts/ens/ENSJobPages.sol#L119](../../contracts/ens/ENSJobPages.sol#L119))

## Config and locks

- `function _initRoots(bytes32[4] memory rootNodes, bytes32[2] memory merkleRoots) internal` ([contracts/AGIJobManager.sol#L595](../../contracts/AGIJobManager.sol#L595))
- `function lockIdentityConfiguration() external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L753](../../contracts/AGIJobManager.sol#L753))
- `function applyForJob(uint256 _jobId, string memory subdomain, bytes32[] calldata proof)` ([contracts/AGIJobManager.sol#L785](../../contracts/AGIJobManager.sol#L785))
- `function validateJob(uint256 _jobId, string memory subdomain, bytes32[] calldata proof)` ([contracts/AGIJobManager.sol#L847](../../contracts/AGIJobManager.sol#L847))
- `function disapproveJob(uint256 _jobId, string memory subdomain, bytes32[] calldata proof)` ([contracts/AGIJobManager.sol#L855](../../contracts/AGIJobManager.sol#L855))
- `function updateAGITokenAddress(address _newTokenAddress) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1048](../../contracts/AGIJobManager.sol#L1048))
- `function updateEnsRegistry(address _newEnsRegistry) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1055](../../contracts/AGIJobManager.sol#L1055))
- `function updateNameWrapper(address _newNameWrapper) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1061](../../contracts/AGIJobManager.sol#L1061))
- `function setEnsJobPages(address _ensJobPages) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1067](../../contracts/AGIJobManager.sol#L1067))
- `function updateRootNodes(` ([contracts/AGIJobManager.sol#L1076](../../contracts/AGIJobManager.sol#L1076))
- `function updateMerkleRoots(bytes32 _validatorMerkleRoot, bytes32 _agentMerkleRoot)` ([contracts/AGIJobManager.sol#L1089](../../contracts/AGIJobManager.sol#L1089))
- `function lockJobENS(uint256 jobId, bool burnFuses) external` ([contracts/AGIJobManager.sol#L1323](../../contracts/AGIJobManager.sol#L1323))
- `function tokenURI(uint256 tokenId) public view override returns (string memory)` ([contracts/AGIJobManager.sol#L1573](../../contracts/AGIJobManager.sol#L1573))
- `function _callEnsJobPagesHook(uint8 hook, uint256 jobId) internal` ([contracts/AGIJobManager.sol#L1578](../../contracts/AGIJobManager.sol#L1578))
- `function setENSRegistry(address ensAddress) external onlyOwner` ([contracts/ens/ENSJobPages.sol#L161](../../contracts/ens/ENSJobPages.sol#L161))
- `function setNameWrapper(address nameWrapperAddress) external onlyOwner` ([contracts/ens/ENSJobPages.sol#L169](../../contracts/ens/ENSJobPages.sol#L169))
- `function setJobsRoot(bytes32 rootNode, string calldata rootName) external onlyOwner` ([contracts/ens/ENSJobPages.sol#L185](../../contracts/ens/ENSJobPages.sol#L185))
- `function lockConfiguration() external onlyOwner` ([contracts/ens/ENSJobPages.sol#L211](../../contracts/ens/ENSJobPages.sol#L211))
- `function handleHook(uint8 hook, uint256 jobId) external onlyJobManager` ([contracts/ens/ENSJobPages.sol#L358](../../contracts/ens/ENSJobPages.sol#L358))
- `function lockJobENS(uint256 jobId, address employer, address agent, bool burnFuses) public onlyOwner` ([contracts/ens/ENSJobPages.sol#L508](../../contracts/ens/ENSJobPages.sol#L508))
- `function _lockJobENS(uint256 jobId, address employer, address agent, bool burnFuses) internal` ([contracts/ens/ENSJobPages.sol#L513](../../contracts/ens/ENSJobPages.sol#L513))
- `function _isValidRootConfig(bytes32 rootNode, string memory rootName) internal pure returns (bool)` ([contracts/ens/ENSJobPages.sol#L734](../../contracts/ens/ENSJobPages.sol#L734))
- `function verifyENSOwnership(` ([contracts/utils/ENSOwnership.sol#L32](../../contracts/utils/ENSOwnership.sol#L32))
- `function verifyENSOwnership(` ([contracts/utils/ENSOwnership.sol#L48](../../contracts/utils/ENSOwnership.sol#L48))
- `function verifyMerkleOwnership(address claimant, bytes32[] calldata proof, bytes32 merkleRoot)` ([contracts/utils/ENSOwnership.sol#L61](../../contracts/utils/ENSOwnership.sol#L61))

## Events and errors

- `error NotAuthorized();` ([contracts/AGIJobManager.sol#L337](../../contracts/AGIJobManager.sol#L337))
- `error InvalidParameters();` ([contracts/AGIJobManager.sol#L339](../../contracts/AGIJobManager.sol#L339))
- `error ConfigLocked();` ([contracts/AGIJobManager.sol#L348](../../contracts/AGIJobManager.sol#L348))
- `event EnsRegistryUpdated(address newEnsRegistry);` ([contracts/AGIJobManager.sol#L484](../../contracts/AGIJobManager.sol#L484))
- `event RootNodesUpdated(` ([contracts/AGIJobManager.sol#L486](../../contracts/AGIJobManager.sol#L486))
- `event MerkleRootsUpdated(bytes32 validatorMerkleRoot, bytes32 agentMerkleRoot);` ([contracts/AGIJobManager.sol#L492](../../contracts/AGIJobManager.sol#L492))
- `event IdentityConfigurationLocked(address indexed locker, uint256 indexed atTimestamp);` ([contracts/AGIJobManager.sol#L499](../../contracts/AGIJobManager.sol#L499))
- `event EnsJobPagesUpdated(address indexed oldEnsJobPages, address indexed newEnsJobPages);` ([contracts/AGIJobManager.sol#L506](../../contracts/AGIJobManager.sol#L506))
- `event EnsHookAttempted(uint8 indexed hook, uint256 indexed jobId, address indexed target, bool success);` ([contracts/AGIJobManager.sol#L522](../../contracts/AGIJobManager.sol#L522))
- `error ENSNotConfigured();` ([contracts/ens/ENSJobPages.sol#L49](../../contracts/ens/ENSJobPages.sol#L49))
- `error ENSNotAuthorized();` ([contracts/ens/ENSJobPages.sol#L50](../../contracts/ens/ENSJobPages.sol#L50))
- `error InvalidParameters();` ([contracts/ens/ENSJobPages.sol#L51](../../contracts/ens/ENSJobPages.sol#L51))
- `event JobENSPageCreated(uint256 indexed jobId, bytes32 indexed node);` ([contracts/ens/ENSJobPages.sol#L83](../../contracts/ens/ENSJobPages.sol#L83))
- `event JobENSPermissionsUpdated(uint256 indexed jobId, address indexed account, bool isAuthorised);` ([contracts/ens/ENSJobPages.sol#L84](../../contracts/ens/ENSJobPages.sol#L84))
- `event JobENSLocked(uint256 indexed jobId, bytes32 indexed node, bool fusesBurned);` ([contracts/ens/ENSJobPages.sol#L85](../../contracts/ens/ENSJobPages.sol#L85))
- `event ENSRegistryUpdated(address indexed oldEns, address indexed newEns);` ([contracts/ens/ENSJobPages.sol#L86](../../contracts/ens/ENSJobPages.sol#L86))
- `event UseEnsJobTokenURIUpdated(bool oldValue, bool newValue);` ([contracts/ens/ENSJobPages.sol#L96](../../contracts/ens/ENSJobPages.sol#L96))
- `event ENSHookProcessed(uint8 indexed hook, uint256 indexed jobId, bool configured, bool success);` ([contracts/ens/ENSJobPages.sol#L97](../../contracts/ens/ENSJobPages.sol#L97))
- `event ENSHookSkipped(uint8 indexed hook, uint256 indexed jobId, bytes32 indexed reason);` ([contracts/ens/ENSJobPages.sol#L98](../../contracts/ens/ENSJobPages.sol#L98))
- `event ENSHookBestEffortFailure(uint8 indexed hook, uint256 indexed jobId, bytes32 indexed operation);` ([contracts/ens/ENSJobPages.sol#L99](../../contracts/ens/ENSJobPages.sol#L99))

## Notes / caveats from code comments

- @notice Total AGI locked as agent performance bonds for unsettled jobs. ([contracts/AGIJobManager.sol#L390](../../contracts/AGIJobManager.sol#L390))
- @notice Total AGI locked as validator bonds for unsettled votes. ([contracts/AGIJobManager.sol#L392](../../contracts/AGIJobManager.sol#L392))
- @notice Total AGI locked as dispute bonds for unsettled disputes. ([contracts/AGIJobManager.sol#L394](../../contracts/AGIJobManager.sol#L394))
- @notice Freezes token/ENS/namewrapper/root nodes. Not a governance lock; ops remain owner-controlled. ([contracts/AGIJobManager.sol#L411](../../contracts/AGIJobManager.sol#L411))
- @notice Anyone may lock ENS records after a job reaches a terminal state; only the owner may burn fuses. ([contracts/AGIJobManager.sol#L1321](../../contracts/AGIJobManager.sol#L1321))
- @dev Fuse burning is irreversible and remains owner-only; ENS hook execution is best-effort. ([contracts/AGIJobManager.sol#L1322](../../contracts/AGIJobManager.sol#L1322))
- @dev as long as lockedEscrow/locked*Bonds are fully covered. ([contracts/AGIJobManager.sol#L1369](../../contracts/AGIJobManager.sol#L1369))
- @dev Owner withdrawals are limited to balances not backing lockedEscrow/locked*Bonds. ([contracts/AGIJobManager.sol#L1608](../../contracts/AGIJobManager.sol#L1608))
- @notice Prefix used when constructing ENS job labels as prefix + decimal(jobId). ([contracts/ens/ENSJobPages.sol#L118](../../contracts/ens/ENSJobPages.sol#L118))
- @notice Updates the default prefix used for unsnapshotted/future job ENS labels. ([contracts/ens/ENSJobPages.sol#L149](../../contracts/ens/ENSJobPages.sol#L149))
-      Legacy jobs that predate this contract must be migrated before hooks can mutate ENS records. ([contracts/ens/ENSJobPages.sol#L868](../../contracts/ens/ENSJobPages.sol#L868))

