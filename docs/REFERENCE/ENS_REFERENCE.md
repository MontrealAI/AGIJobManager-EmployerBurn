# ENS Reference (Generated)

Generated at (UTC): 1970-01-01T00:00:00Z
Source fingerprint: eef307648904dc53

Source files used:
- `contracts/AGIJobManager.sol`
- `contracts/utils/ENSOwnership.sol`
- `contracts/ens/ENSJobPages.sol`
- `contracts/ens/IENSJobPages.sol`

## ENS surface area

- `bytes32 public clubRootNode;` ([contracts/AGIJobManager.sol#L403](../../contracts/AGIJobManager.sol#L403))
- `bytes32 public alphaClubRootNode;` ([contracts/AGIJobManager.sol#L404](../../contracts/AGIJobManager.sol#L404))
- `bytes32 public agentRootNode;` ([contracts/AGIJobManager.sol#L405](../../contracts/AGIJobManager.sol#L405))
- `bytes32 public alphaAgentRootNode;` ([contracts/AGIJobManager.sol#L406](../../contracts/AGIJobManager.sol#L406))
- `bytes32 public validatorMerkleRoot;` ([contracts/AGIJobManager.sol#L407](../../contracts/AGIJobManager.sol#L407))
- `bytes32 public agentMerkleRoot;` ([contracts/AGIJobManager.sol#L408](../../contracts/AGIJobManager.sol#L408))
- `ENS public ens;` ([contracts/AGIJobManager.sol#L409](../../contracts/AGIJobManager.sol#L409))
- `NameWrapper public nameWrapper;` ([contracts/AGIJobManager.sol#L410](../../contracts/AGIJobManager.sol#L410))
- `address public ensJobPages;` ([contracts/AGIJobManager.sol#L411](../../contracts/AGIJobManager.sol#L411))
- `bool public lockIdentityConfig;` ([contracts/AGIJobManager.sol#L414](../../contracts/AGIJobManager.sol#L414))
- `IENSRegistry public ens;` ([contracts/ens/ENSJobPages.sol#L112](../../contracts/ens/ENSJobPages.sol#L112))
- `INameWrapper public nameWrapper;` ([contracts/ens/ENSJobPages.sol#L113](../../contracts/ens/ENSJobPages.sol#L113))
- `IPublicResolver public publicResolver;` ([contracts/ens/ENSJobPages.sol#L114](../../contracts/ens/ENSJobPages.sol#L114))
- `bytes32 public jobsRootNode;` ([contracts/ens/ENSJobPages.sol#L115](../../contracts/ens/ENSJobPages.sol#L115))
- `string public jobsRootName;` ([contracts/ens/ENSJobPages.sol#L116](../../contracts/ens/ENSJobPages.sol#L116))
- `address public jobManager;` ([contracts/ens/ENSJobPages.sol#L117](../../contracts/ens/ENSJobPages.sol#L117))
- `bool public useEnsJobTokenURI;` ([contracts/ens/ENSJobPages.sol#L118](../../contracts/ens/ENSJobPages.sol#L118))
- `bool public configLocked;` ([contracts/ens/ENSJobPages.sol#L119](../../contracts/ens/ENSJobPages.sol#L119))
- `string public jobLabelPrefix;` ([contracts/ens/ENSJobPages.sol#L121](../../contracts/ens/ENSJobPages.sol#L121))

## Config and locks

- `function _initRoots(bytes32[4] memory rootNodes, bytes32[2] memory merkleRoots) internal` ([contracts/AGIJobManager.sol#L598](../../contracts/AGIJobManager.sol#L598))
- `function lockIdentityConfiguration() external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L759](../../contracts/AGIJobManager.sol#L759))
- `function applyForJob(uint256 _jobId, string memory subdomain, bytes32[] calldata proof)` ([contracts/AGIJobManager.sol#L803](../../contracts/AGIJobManager.sol#L803))
- `function validateJob(uint256 _jobId, string memory subdomain, bytes32[] calldata proof)` ([contracts/AGIJobManager.sol#L865](../../contracts/AGIJobManager.sol#L865))
- `function disapproveJob(uint256 _jobId, string memory subdomain, bytes32[] calldata proof)` ([contracts/AGIJobManager.sol#L873](../../contracts/AGIJobManager.sol#L873))
- `function updateAGITokenAddress(address _newTokenAddress) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1066](../../contracts/AGIJobManager.sol#L1066))
- `function updateEnsRegistry(address _newEnsRegistry) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1073](../../contracts/AGIJobManager.sol#L1073))
- `function updateNameWrapper(address _newNameWrapper) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1079](../../contracts/AGIJobManager.sol#L1079))
- `function setEnsJobPages(address _ensJobPages) external onlyOwner whenIdentityConfigurable` ([contracts/AGIJobManager.sol#L1085](../../contracts/AGIJobManager.sol#L1085))
- `function updateRootNodes(` ([contracts/AGIJobManager.sol#L1094](../../contracts/AGIJobManager.sol#L1094))
- `function updateMerkleRoots(bytes32 _validatorMerkleRoot, bytes32 _agentMerkleRoot)` ([contracts/AGIJobManager.sol#L1107](../../contracts/AGIJobManager.sol#L1107))
- `function lockJobENS(uint256 jobId, bool burnFuses) external` ([contracts/AGIJobManager.sol#L1342](../../contracts/AGIJobManager.sol#L1342))
- `function tokenURI(uint256 tokenId) public view override returns (string memory)` ([contracts/AGIJobManager.sol#L1596](../../contracts/AGIJobManager.sol#L1596))
- `function _callEnsJobPagesHook(uint8 hook, uint256 jobId) internal` ([contracts/AGIJobManager.sol#L1601](../../contracts/AGIJobManager.sol#L1601))
- `function setENSRegistry(address ensAddress) external onlyOwner` ([contracts/ens/ENSJobPages.sol#L163](../../contracts/ens/ENSJobPages.sol#L163))
- `function setNameWrapper(address nameWrapperAddress) external onlyOwner` ([contracts/ens/ENSJobPages.sol#L171](../../contracts/ens/ENSJobPages.sol#L171))
- `function setJobsRoot(bytes32 rootNode, string calldata rootName) external onlyOwner` ([contracts/ens/ENSJobPages.sol#L187](../../contracts/ens/ENSJobPages.sol#L187))
- `function lockConfiguration() external onlyOwner` ([contracts/ens/ENSJobPages.sol#L213](../../contracts/ens/ENSJobPages.sol#L213))
- `function handleHook(uint8 hook, uint256 jobId) external onlyJobManager` ([contracts/ens/ENSJobPages.sol#L360](../../contracts/ens/ENSJobPages.sol#L360))
- `function lockJobENS(uint256 jobId, address employer, address agent, bool burnFuses) public onlyOwner` ([contracts/ens/ENSJobPages.sol#L510](../../contracts/ens/ENSJobPages.sol#L510))
- `function _lockJobENS(uint256 jobId, address employer, address agent, bool burnFuses) internal` ([contracts/ens/ENSJobPages.sol#L515](../../contracts/ens/ENSJobPages.sol#L515))
- `function _isValidRootConfig(bytes32 rootNode, string memory rootName) internal pure returns (bool)` ([contracts/ens/ENSJobPages.sol#L736](../../contracts/ens/ENSJobPages.sol#L736))
- `function verifyENSOwnership(` ([contracts/utils/ENSOwnership.sol#L32](../../contracts/utils/ENSOwnership.sol#L32))
- `function verifyENSOwnership(` ([contracts/utils/ENSOwnership.sol#L48](../../contracts/utils/ENSOwnership.sol#L48))
- `function verifyMerkleOwnership(address claimant, bytes32[] calldata proof, bytes32 merkleRoot)` ([contracts/utils/ENSOwnership.sol#L61](../../contracts/utils/ENSOwnership.sol#L61))

## Events and errors

- `error NotAuthorized();` ([contracts/AGIJobManager.sol#L337](../../contracts/AGIJobManager.sol#L337))
- `error InvalidParameters();` ([contracts/AGIJobManager.sol#L339](../../contracts/AGIJobManager.sol#L339))
- `error ConfigLocked();` ([contracts/AGIJobManager.sol#L348](../../contracts/AGIJobManager.sol#L348))
- `event EnsRegistryUpdated(address newEnsRegistry);` ([contracts/AGIJobManager.sol#L487](../../contracts/AGIJobManager.sol#L487))
- `event RootNodesUpdated(` ([contracts/AGIJobManager.sol#L489](../../contracts/AGIJobManager.sol#L489))
- `event MerkleRootsUpdated(bytes32 validatorMerkleRoot, bytes32 agentMerkleRoot);` ([contracts/AGIJobManager.sol#L495](../../contracts/AGIJobManager.sol#L495))
- `event IdentityConfigurationLocked(address indexed locker, uint256 indexed atTimestamp);` ([contracts/AGIJobManager.sol#L502](../../contracts/AGIJobManager.sol#L502))
- `event EnsJobPagesUpdated(address indexed oldEnsJobPages, address indexed newEnsJobPages);` ([contracts/AGIJobManager.sol#L509](../../contracts/AGIJobManager.sol#L509))
- `event EnsHookAttempted(uint8 indexed hook, uint256 indexed jobId, address indexed target, bool success);` ([contracts/AGIJobManager.sol#L525](../../contracts/AGIJobManager.sol#L525))
- `error ENSNotConfigured();` ([contracts/ens/ENSJobPages.sol#L49](../../contracts/ens/ENSJobPages.sol#L49))
- `error ENSNotAuthorized();` ([contracts/ens/ENSJobPages.sol#L50](../../contracts/ens/ENSJobPages.sol#L50))
- `error InvalidParameters();` ([contracts/ens/ENSJobPages.sol#L51](../../contracts/ens/ENSJobPages.sol#L51))
- `event JobENSPageCreated(uint256 indexed jobId, bytes32 indexed node);` ([contracts/ens/ENSJobPages.sol#L85](../../contracts/ens/ENSJobPages.sol#L85))
- `event JobENSPermissionsUpdated(uint256 indexed jobId, address indexed account, bool isAuthorised);` ([contracts/ens/ENSJobPages.sol#L86](../../contracts/ens/ENSJobPages.sol#L86))
- `event JobENSLocked(uint256 indexed jobId, bytes32 indexed node, bool fusesBurned);` ([contracts/ens/ENSJobPages.sol#L87](../../contracts/ens/ENSJobPages.sol#L87))
- `event ENSRegistryUpdated(address indexed oldEns, address indexed newEns);` ([contracts/ens/ENSJobPages.sol#L88](../../contracts/ens/ENSJobPages.sol#L88))
- `event UseEnsJobTokenURIUpdated(bool oldValue, bool newValue);` ([contracts/ens/ENSJobPages.sol#L98](../../contracts/ens/ENSJobPages.sol#L98))
- `event ENSHookProcessed(uint8 indexed hook, uint256 indexed jobId, bool configured, bool success);` ([contracts/ens/ENSJobPages.sol#L99](../../contracts/ens/ENSJobPages.sol#L99))
- `event ENSHookSkipped(uint8 indexed hook, uint256 indexed jobId, bytes32 indexed reason);` ([contracts/ens/ENSJobPages.sol#L100](../../contracts/ens/ENSJobPages.sol#L100))
- `event ENSHookBestEffortFailure(uint8 indexed hook, uint256 indexed jobId, bytes32 indexed operation);` ([contracts/ens/ENSJobPages.sol#L101](../../contracts/ens/ENSJobPages.sol#L101))

## Notes / caveats from code comments

- @notice Total AGI locked as agent performance bonds for unsettled jobs. ([contracts/AGIJobManager.sol#L390](../../contracts/AGIJobManager.sol#L390))
- @notice Total AGI locked as validator bonds for unsettled votes. ([contracts/AGIJobManager.sol#L392](../../contracts/AGIJobManager.sol#L392))
- @notice Total AGI locked as dispute bonds for unsettled disputes. ([contracts/AGIJobManager.sol#L394](../../contracts/AGIJobManager.sol#L394))
- @notice Freezes token/ENS/namewrapper/root nodes. Not a governance lock; ops remain owner-controlled. ([contracts/AGIJobManager.sol#L413](../../contracts/AGIJobManager.sol#L413))
- @notice Anyone may lock ENS records after a job reaches a terminal state; only the owner may burn fuses. ([contracts/AGIJobManager.sol#L1340](../../contracts/AGIJobManager.sol#L1340))
- @dev Fuse burning is irreversible and remains owner-only; ENS hook execution is best-effort. ([contracts/AGIJobManager.sol#L1341](../../contracts/AGIJobManager.sol#L1341))
- @dev as long as lockedEscrow/locked*Bonds are fully covered. ([contracts/AGIJobManager.sol#L1388](../../contracts/AGIJobManager.sol#L1388))
- @dev Owner withdrawals are limited to balances not backing lockedEscrow/locked*Bonds. ([contracts/AGIJobManager.sol#L1631](../../contracts/AGIJobManager.sol#L1631))
- @notice Prefix used when constructing ENS job labels as prefix + decimal(jobId). ([contracts/ens/ENSJobPages.sol#L120](../../contracts/ens/ENSJobPages.sol#L120))
- @notice Updates the default prefix used for unsnapshotted/future job ENS labels. ([contracts/ens/ENSJobPages.sol#L151](../../contracts/ens/ENSJobPages.sol#L151))
-      Legacy jobs that predate this contract must be migrated before hooks can mutate ENS records. ([contracts/ens/ENSJobPages.sol#L870](../../contracts/ens/ENSJobPages.sol#L870))

