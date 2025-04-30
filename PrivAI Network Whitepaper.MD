PrivAI Network Whitepaper
Introduction
In the AI-driven digital economy, data is the cornerstone of innovation, yet data silos, privacy breaches, and trust deficits hinder large-scale AI adoption. PrivAI Network introduces a decentralized AI collaboration platform that integrates Model Context Protocol (MCP), Privacy-Enhancing Technologies (PETs), and Web3 technologies to achieve “data available but not visible, data stationary while models move.”
MCP, an open-source protocol by Anthropic, standardizes interactions between AI models and external tools (e.g., databases, APIs), optimizing context management and tool invocation for AI Agents. Privacy computing technologies, including Federated Learning (FL), Secure Multi-Party Computation (SMPC), Differential Privacy (DP), and Trusted Execution Environments (TEE), ensure data privacy and computational security. Web3 technologies, encompassing blockchain, Decentralized Identity (DID), Decentralized Autonomous Organization (DAO), and Zero-Knowledge Proofs (ZKP), enable data sovereignty, transparent collaboration, and economic incentives.
PrivAI Network aims to build a privacy-first, AI-driven decentralized ecosystem, empowering industries like healthcare, finance, IoT, and personal data markets to address privacy and collaboration challenges. The PRAI (Privacy AI Token) is fairly launched via pump.fun, incentivizing data sharing, compute contribution, and community governance. This whitepaper outlines the project’s vision, technical architecture, token economics, governance, applications, and roadmap for creating a next-generation AI-Web3 ecosystem.
Slogan: “Your Data, Your AI, Your Privacy.”
Table of Contents
Project Overview
1.1 Project Background
1.2 Core Value Proposition
1.3 Target Markets
Technical Architecture
2.1 MCP: Standardized Protocol for AI-Tool Interaction
2.2 Privacy Computing: Multi-Layered Data Protection
2.3 Web3 Technologies: Decentralization and Incentives
2.4 Technology Stack and Protocol Integration
2.5 Technical Performance Analysis
Token Economics
3.1 Token Overview: PRAI
3.2 Total Supply and Fair Launch
3.3 Deflationary Mechanism
3.4 Reward Mechanism
Decentralized Governance
4.1 DAO Governance Modelo
4.2 Proposal and Voting Mechanism
4.3 Governance Incentives
Application Scenarios
5.1 Healthcare Data Collaboration
5.2 Financial Risk Assessment
5.3 IoT Privacy Analysis
5.4 Decentralized Social Recommendation
Ecosystem Incentive Program
6.1 Developer Incentives
6.2 Data Provider Incentives
6.3 Compute Contributor Incentives
Implementation Roadmap
7.1 Milestones
7.2 Technical Development Plan
7.3 Community Building and Marketing Strategy
Regulatory Compliance Strategy
8.1 Privacy Regulation Compliance
8.2 Token Issuance Compliance
8.3 Security Audits
Competitive Analysis and Advantages
9.1 Comparison with Existing Solutions
9.2 PrivAI Network’s Unique Advantages
Risks and Challenges
10.1 Technical Challenges
10.2 Regulatory Risks
10.3 Market Competition
Team and Partnerships
11.1 Core Team
11.2 Potential Partners
Conclusion
References
1. Project Overview
1.1 Project Background
The rise of Large Language Models (LLMs) and AI Agents has increased reliance on data and external tools. However, privacy regulations (e.g., GDPR, CCPA), data silos, and trust issues limit cross-organizational collaboration. MCP, an open-source protocol launched by Anthropic in 2024, provides a standardized interface for AI-tool interactions, enhancing context management and tool invocation but introducing privacy risks due to its distributed nature. Privacy computing technologies, including FL, SMPC, DP, and TEE, address these risks by ensuring data privacy and computational security. Web3 technologies, such as blockchain, DID, DAO, and ZKP, enable decentralized trust, data sovereignty, and incentivization.
PrivAI Network integrates MCP, privacy computing, and Web3 to create a decentralized AI collaboration ecosystem. Users (individuals, enterprises, institutions) can share data and compute resources privately, participate in AI model training, and earn PRAI tokens. Launched fairly via pump.fun, the project drives privacy-first AI-Web3 convergence.
1.2 Core Value Proposition
Privacy Protection: Multi-layered privacy through FL, SMPC, DP, and TEE.
AI Standardization: MCP simplifies AI-tool integration, reducing developer barriers.
Data Sovereignty: DID and blockchain-based authorization ensure user control over data.
Decentralized Incentives: PRAI tokens incentivize data sharing, compute contribution, and DAO governance.
1.3 Target Markets
Healthcare: Hospitals and research institutions share encrypted data to train AI models (e.g., disease prediction).
Finance: Banks and insurers collaborate on risk assessments while protecting client privacy.
IoT: Smart devices upload encrypted data for AI-driven analysis (e.g., smart homes).
Personal Data Markets: Users monetize anonymized data for AI recommendation systems.
2. Technical Architecture
2.1 MCP: Standardized Protocol for AI-Tool Interaction
MCP (Model Context Protocol) is an open-source communication protocol standardizing AI model interactions with external tools, supporting dynamic context management and tool invocation. Key components include:
MCP Server: Handles AI requests, invoking external APIs, databases, or decentralized compute nodes.
Context Manager: Maintains conversation context using vector embeddings for semantic coherence.
Tool Invocation Protocol: Defines request-response formats, supporting asynchronous calls, batch processing, and error recovery.
Security Interface: Employs TLS 1.3 encryption, zk-SNARKs/zk-STARKs, and verifiable computation to protect data transmission and integrity.
In PrivAI Network, MCP acts as the “neural hub” for AI Agents, connecting decentralized data sources, compute nodes, and tools to optimize privacy computing tasks.
2.2 Privacy Computing: Multi-Layered Data Protection
PrivAI Network integrates the following Privacy-Enhancing Technologies (PETs) for robust data protection:
Federated Learning (FL):
Principle: Parties train models locally, sharing only encrypted model updates (e.g., gradients) via Federated Averaging (FedAvg) or Secure Aggregation to build a global model.
Details: Supports differential privacy gradient clipping, Paillier homomorphic encryption, and noise injection for privacy-accuracy trade-offs.
Application: Hospitals share encrypted model updates via MCP to train disease prediction models without exposing patient data.
Secure Multi-Party Computation (SMPC):
Principle: Uses Shamir’s Secret Sharing, additive homomorphic encryption, or fully homomorphic encryption (FHE) for joint computation with encrypted data.
Details: Implements SPDZ protocol (efficient matrix operations) or ABY framework (hybrid protocol optimization) for low-latency computation.
Application: Banks use MCP to perform SMPC-based credit assessments, safeguarding client privacy.
Differential Privacy (DP):
Principle: Adds noise via Laplace or Gaussian mechanisms to protect individual data while preserving statistical properties.
Details: Supports local and global DP, dynamic ε-budget management, and Rényi differential privacy for multi-query scenarios.
Application: MCP processes user behavior data to generate anonymized statistical reports.
Trusted Execution Environment (TEE):
Principle: Leverages hardware isolation (e.g., Intel SGX, ARM TrustZone) to execute computations in secure enclaves.
Details: Supports remote attestation and sealed storage to ensure node integrity and data confidentiality.
Application: MCP servers run on TEE nodes to process sensitive data (e.g., biometric information).
2.3 Web3 Technologies: Decentralization and Incentives
PrivAI Network leverages Web3 technologies to enhance trust, data sovereignty, and incentives:
Blockchain:
Records data access authorizations, model training contributions, and PRAI transactions for transparency and immutability.
Smart contracts (Solidity/Rust) manage privacy computing tasks, rewards, and data permissions.
Supports cross-chain interoperability (e.g., Polkadot bridge, LayerZero) for Ethereum, Solana, and other ecosystems.
Decentralized Identity (DID):
Users manage data access via W3C-standard DIDs, with MCP servers verifying DID-signed authorizations.
Supports Verifiable Credentials (VC) for privacy-preserving identity authentication.
Example: Patients control medical data access via DIDs without centralized providers.
Decentralized Storage:
IPFS stores encrypted model parameters and data indices, reducing centralization risks.
Arweave ensures permanent storage for data availability and traceability.
Storage nodes are incentivized with PRAI, using erasure coding for data redundancy.
Decentralized Autonomous Organization (DAO):
PRAI holders vote on protocol upgrades, privacy policies, and incentive allocations.
Uses on-chain governance (Aragon) or off-chain snapshots (Snapshot) with quadratic voting.
Example: Community votes on new SMPC protocols or FL aggregation algorithms.
Zero-Knowledge Proofs (ZKP):
Integrates zk-SNARKs (efficient proofs) and zk-STARKs (quantum-resistant) to verify data contributions, computations, or model training without exposing data.
Example: Users prove data quality (e.g., medical data rarity) via ZKP without revealing raw data.
2.4 Technology Stack and Protocol Integration
Blockchain: Polygon (high throughput), Solana (low latency), or custom Layer-1, supporting EVM-compatible smart contracts and EIP-1559 fee model.
Privacy Computing Frameworks:
PySyft: FL and SMPC with secure aggregation and DP.
TF Encrypted: Homomorphic encryption for matrix operations.
Opacus: DP for PyTorch/TensorFlow models.
OpenEnclave: Cross-platform TEE development for Intel SGX and ARM TrustZone.
MCP Implementation: Customized Anthropic MCP protocol with TEE, ZKP, and decentralized node support.
Storage: IPFS (distributed storage), Arweave (permanent storage).
Identity Management: W3C DID standard, integrated with uPort, SelfKey, or Sovrin.
Frontend: React.js + Web3.js for user-friendly data authorization, task management, and DAO voting.
2.5 Technical Performance Analysis
To ensure efficiency and scalability, PrivAI Network benchmarks MCP and privacy computing performance (based on simulations and literature):
MCP Latency:
Context Management: <50ms per request (vector embedding indexing).
Tool Invocation: <200ms for asynchronous API calls, >1000 QPS for batch processing.
Federated Learning:
Aggregation Latency: FedAvg, 100 nodes, <5s for 10MB gradient data.
Privacy Overhead: DP noise (ε=1.0) reduces model accuracy by <2%.
SMPC:
Compute Overhead: SPDZ protocol, 1000x1000 matrix multiplication, <1s (4-party).
Communication Overhead: <10MB/s per party (optimized).
Differential Privacy:
Noise Impact: Gaussian mechanism (ε=0.5, δ=10^-5), statistical error <1%.
Query Efficiency: Rényi DP for multi-query, budget consumption <0.1ε/round.
TEE:
Execution Latency: SGX enclave, 1MB data processing, <100ms.
Remote Attestation: Verification time <500ms, throughput >500 proofs/s.
Blockchain:
Transaction Throughput: Polygon >5000 TPS, Solana >50,000 TPS.
Smart Contract Execution: Gas cost <0.01 MATIC/transaction (EIP-1559).
Optimization Strategies:
Batch processing and parallel computing to reduce SMPC latency.
Sharding and state channels for blockchain scalability.
GPU acceleration (NVIDIA CUDA) for FL and SMPC.
3. Token Economics
3.1 Token Overview: PRAI
Full Name: Privacy AI Token
Uses:
Payment: For privacy computing services (SMPC compute, TEE node rental), MCP server invocation, or decentralized storage.
Incentives: Reward data providers, compute contributors, and model trainers.
Governance: Vote on protocol upgrades, privacy policies, or incentive allocations via DAO.
Staking: Stake PRAI to run MCP nodes or access high-priority tasks for yields.
3.2 Total Supply and Fair Launch
Total Supply: 1 billion PRAI.
Fair Launch:
100% via pump.fun: No presale, no team allocation, ensuring full decentralization.
Transparency: Issuance records on-chain, smart contracts audited (e.g., CertiK).
Process:
Pre-Launch (Q3 2025): Promote on X to engage Web3 and AI communities.
Launch (Q4 2025): 1 billion PRAI fully available on pump.fun.
Airdrop: 2% PRAI (20 million) distributed to testnet users and MCP developers.
3.3 Deflationary Mechanism
No Transaction Fees: pump.fun launch ensures fee-free trading, reducing user costs.
Burn Mechanism:
5%-10% of privacy computing task fees (SMPC, FL) burned.
3% of decentralized storage node rental fees burned.
Unused ecosystem incentives (if any) burned quarterly.
Estimated annual burn: 2%-5% of circulating supply, enhancing token scarcity.
3.4 Reward Mechanism
Dynamic Rewards:
Early Incentives (First 2 Years): High rewards, e.g., 10 PRAI per 1GB encrypted data, 5 PRAI per 1 TFLOPS compute.
Long-Term Holding: Staked PRAI yields 5%-10% annualized, dynamically adjusted via smart contracts.
Task Rewards:
Data Contribution: Based on data quality (e.g., medical data rarity), verified via zk-SNARKs.
Compute Contribution: Proportional to FLOPS, with 1.5x bonus for TEE nodes.
Model Training: Based on model performance improvements (e.g., accuracy), tied to FL aggregation.
Decay Mechanism: Rewards halve annually as network scales, ensuring token sustainability.
4. Decentralized Governance
4.1 DAO Governance Model
PrivAI Network employs a Decentralized Autonomous Organization (DAO) for community governance. PRAI holders vote on protocol upgrades, privacy policies, and incentive allocations. Governance objectives include:
Ensuring protocol privacy and security.
Optimizing incentives for ecosystem growth.
Supporting cross-industry applications (e.g., healthcare, finance).
4.2 Proposal and Voting Mechanism
Proposal Process:
Users holding >0.1% PRAI (1 million tokens) can submit proposals (e.g., MCP upgrades, SMPC algorithm changes).
Proposals include problem description, solution, and technical impact analysis.
Submitted to on-chain governance contracts or Snapshot, open for 7-day discussion.
Voting Mechanism:
Quadratic voting balances influence between large and small holders.
Voting weight scales with PRAI holdings and staking duration (e.g., 1-year stake = 1.5x weight).
Voting period: 14 days, requiring >50% approval and >10% participation.
Execution:
Approved proposals are implemented by core developers or community contributors, deployed on-chain.
Governance contracts support automated execution (e.g., reward parameter adjustments) or manual upgrades.
4.3 Governance Incentives
Voting Rewards: Voters receive 0.5%-1% annualized yield based on staked PRAI.
Proposal Rewards: Successful proposers earn one-time rewards (e.g., 1000 PRAI).
Oversight: Community audits proposal execution via on-chain records for transparency.
5. Application Scenarios
5.1 Healthcare Data Collaboration
Scenario: Hospitals share encrypted patient data via MCP to train cancer diagnosis models using FL.
Process:
Hospitals run MCP servers, uploading encrypted model updates (PySyft + FedAvg).
DID verifies hospital identity; patients authorize data use via DID signatures.
TEE nodes perform secure aggregation to build a global model.
zk-SNARKs verify data contribution quality.
Rewards: Hospitals and patients earn PRAI based on data volume and model performance.
Privacy: SMPC ensures encrypted computation; DP protects individual patient data.
5.2 Financial Risk Assessment
Scenario: Banks collaborate on credit risk assessments while protecting client privacy.
Process:
Banks use MCP to invoke SPDZ protocol for SMPC-based joint computation.
DP (Gaussian mechanism) generates anonymized credit scores; ZKP verifies computation integrity.
Blockchain logs contributions; smart contracts distribute PRAI rewards.
Advantages: Enhances assessment accuracy, complies with privacy regulations (e.g., CCPA).
5.3 IoT Privacy Analysis
Scenario: Smart home devices (e.g., cameras) upload encrypted data via MCP to train behavior analysis models.
Process:
Devices preprocess data in TEE, with MCP transmitting encrypted results (Paillier encryption).
DID verifies device identity to prevent tampering.
Users stake PRAI to share data, earning rewards.
Advantages: Protects user privacy, enables IoT-driven AI applications.
5.4 Decentralized Social Recommendation
Scenario: Users share anonymized behavior data to train personalized recommendation models.
Process:
MCP processes user inputs, with Rényi DP generating anonymized datasets.
DID authorizes data access; blockchain records permissions.
Recommendation models run on decentralized nodes, rewarding data contributors.
Advantages: Breaks centralized data monopolies, enhances user privacy.
6. Ecosystem Incentive Program
6.1 Developer Incentives
Goal: Attract developers to build privacy-first DApps (e.g., healthcare AI, financial risk tools).
Mechanisms:
Provide MCP SDK and APIs for seamless FL, SMPC, and TEE integration.
Host hackathons, rewarding top DApps (e.g., 5000-10,000 PRAI for top three).
Establish a developer fund, allocated via DAO, to support open-source projects.
Support:
Comprehensive documentation (MCP protocol, PySyft integration guides).
Free testnet access to MCP servers and TEE nodes.
6.2 Data Provider Incentives
Goal: Encourage high-quality data sharing (e.g., medical records, IoT data).
Mechanisms:
Data quality verified via zk-SNARKs (e.g., rarity, completeness), with PRAI rewards.
Dynamic pricing: Scarce data (e.g., cancer patient data) earns 2x reward multiplier.
DID ensures user control over data use; blockchain logs authorization history.
Transparency: Data contributions and rewards recorded on-chain, auditable by the community.
6.3 Compute Contributor Incentives
Goal: Incentivize compute power and TEE node contributions for privacy computing.
Mechanisms:
Rewards based on FLOPS, with 1.5x bonus for TEE nodes.
Staking PRAI to run MCP nodes yields 5%-10% annualized returns.
Dynamic rewards prioritize high-demand tasks (e.g., SMPC matrix operations).
Verification: Remote attestation and ZKP ensure node integrity and contribution accuracy.
7. Implementation Roadmap
7.1 Milestones
Q3 2025: Publish whitepaper, complete MCP-privacy computing prototype, launch testnet.
Q4 2025: Fairly launch PRAI via pump.fun, release MCP SDK, support FL tasks.
Q1 2026: Integrate SPDZ and TEE, initiate healthcare and finance pilots, deploy DID authorization.
Q2 2026: Expand to IoT, enable cross-chain interoperability, launch DAO governance.
Q3 2026: Optimize SMPC performance, attract DApp developers, roll out ecosystem incentives.
7.2 Technical Development Plan
MCP Customization: Enhance Anthropic MCP with TEE, ZKP, and decentralized node management.
Privacy Computing:
FL: PySyft + FedAvg with DP gradient clipping and Paillier encryption.
SMPC: TF Encrypted + SPDZ for matrix optimization, reduced communication overhead.
DP: Opacus with dynamic ε-budget and Rényi DP.
TEE: OpenEnclave for remote attestation and sealed storage.
Blockchain: Deploy smart contracts on Polygon, explore custom Layer-1 with EIP-1559 and sharding.
Storage: IPFS + Arweave with erasure coding and decentralized node integration.
Testing and Audits: Engage SlowMist and CertiK for MCP servers, privacy protocols, and smart contract audits.
7.3 Community Building and Marketing Strategy
X Platform Promotion:
Publish technical blogs (MCP context management, SMPC optimization), use cases, and developer tutorials.
Host AMAs with privacy computing experts (e.g., PySyft community).
Share daily project updates to engage Web3 and AI communities.
Airdrop Campaign: Distribute 20 million PRAI to testnet users and MCP developers.
Developer Ecosystem:
Host global hackathons, rewarding MCP-based DApps (5000-10,000 PRAI).
Release MCP SDK documentation, API references, and testnet guides.
Create Discord/Telegram channels for real-time technical support.
Industry Partnerships: Collaborate with healthcare (IBM Watson Health), finance (Chainlink), and privacy computing (PySyft) entities for pilots.
8. Regulatory Compliance Strategy
8.1 Privacy Regulation Compliance
Regulations: GDPR (EU), CCPA (California), HIPAA (healthcare).
Strategies:
DID authorization ensures user control, aligning with GDPR’s “right to be forgotten.”
Blockchain logs data usage for CCPA transparency.
SMPC and DP meet HIPAA privacy standards.
Regular third-party audits (e.g., Deloitte) with public compliance reports.
8.2 Token Issuance Compliance
Regulations: SEC (US), FCA (UK), MAS (Singapore).
Strategies:
pump.fun fair launch without presale mitigates securities risks.
Engage legal counsel (e.g., Perkins Coie) to classify PRAI as a utility token.
Publish transparent token economics reports to avoid ICO-related scrutiny.
8.3 Security Audits
Objective: Ensure security of MCP servers, privacy protocols, and smart contracts.
Partners: SlowMist, CertiK, Trail of Bits.
Process:
Static analysis for Solidity contract vulnerabilities (e.g., reentrancy).
Dynamic testing for MCP prompt injection and SMPC data leaks.
Penetration testing for TEE nodes and DID authorization.
Frequency: Quarterly audits, with additional checks before major upgrades.
9. Competitive Analysis and Advantages
9.1 Comparison with Existing Solutions
Ocean Protocol: Decentralized data marketplace, lacks MCP standardization and SMPC support.
Phala Network: Privacy computing with TEE focus, no FL or MCP integration.
Secret Network: Privacy-focused smart contracts, limited AI applications.
Grok (xAI): Centralized AI assistant, no Web3 incentives or decentralization.
9.2 PrivAI Network’s Unique Advantages
MCP Standardization: Simplifies AI-tool integration, lowering developer barriers.
Multi-Layered Privacy: Combines FL, SMPC, DP, and TEE for comprehensive protection.
Web3 Incentives: PRAI and DAO drive user engagement and ecosystem vitality.
Cross-Industry Applications: Spans healthcare, finance, IoT with vast market potential.
10. Risks and Challenges
10.1 Technical Challenges
Performance Bottlenecks: SMPC and TEE increase compute overhead. Mitigation: Optimize SPDZ, leverage GPU acceleration, and use advanced TEE hardware.
Protocol Compatibility: MCP must integrate diverse privacy frameworks. Mitigation: Develop unified APIs for PySyft, TF Encrypted.
Scalability: Decentralized nodes need high concurrency. Mitigation: Implement sharding, state channels, and Optimistic Rollups.
10.2 Regulatory Risks
Privacy Regulations: GDPR, CCPA demand transparency. Mitigation: Enable user control via DID and blockchain, conduct third-party audits.
Token Regulation: SEC may scrutinize issuance. Mitigation: Ensure pump.fun compliance, engage legal counsel.
10.3 Market Competition
Pressure: Ocean Protocol, Phala Network have established markets. Mitigation: Highlight MCP standardization and multi-layered privacy, target healthcare and finance niches.
11. Team and Partnerships
11.1 Core Team
Technical Lead: Privacy computing expert, proficient in PySyft, SPDZ, and DP.
Blockchain Developer: Web3 specialist, skilled in Solidity, Rust, and W3C DID standards.
AI Specialist: MCP protocol developer, optimizing context management and tool invocation.
Operations Lead: Web3 project veteran, experienced in community management and X platform marketing.
Legal Advisor: Expert in GDPR, SEC regulations, ensuring compliance.
(Team to be assembled, recruiting from MCP and PySyft communities)
11.2 Potential Partners
Technical: Anthropic (MCP support), PySyft (FL), Polygon (blockchain), Arweave (storage).
Industry: IBM Watson Health (healthcare AI), Chainlink (financial oracles).
Security: SlowMist, CertiK, Trail of Bits (contract and protocol audits).
12. Conclusion
PrivAI Network integrates MCP, privacy computing, and Web3 to create a privacy-first, AI-driven decentralized ecosystem, addressing data privacy, trust, and collaboration challenges. PRAI, fairly launched via pump.fun, incentivizes users, developers, and compute contributors, unlocking significant market potential. Success hinges on technical innovation, community engagement, industry partnerships, and regulatory compliance, positioning PrivAI Network as a leader in AI-Web3 convergence by 2026, delivering privacy-preserving AI solutions for healthcare, finance, IoT, and beyond.
13. References
Anthropic. (2024). Model Context Protocol (MCP): A Standardized Interface for AI-Tool Integration. GitHub Repository. https://github.com/anthropic/mcp
Kairouz, P., et al. (2021). Advances and Open Problems in Federated Learning. Foundations and Trends in Machine Learning, 14(1-2), 1-210. https://arxiv.org/abs/1912.04977
Goldreich, O. (2004). Foundations of Cryptography: Volume 2, Basic Applications. Cambridge University Press.
Dwork, C., & Roth, A. (2014). The Algorithmic Foundations of Differential Privacy. Foundations and Trends in Theoretical Computer Science, 9(3-4), 211-407. https://www.nowpublishers.com/article/Details/TCS-042
Intel. (2023). Intel SGX: Trusted Execution Environment for Secure Computing. https://www.intel.com/content/www/us/en/developer/tools/software-guard-extensions/overview.html
World Wide Web Consortium (W3C). (2022). Decentralized Identifiers (DIDs) v1.0. https://www.w3.org/TR/did-core/
Bonawitz, K., et al. (2017). Practical Secure Aggregation for Privacy-Preserving Machine Learning. Proceedings of the 2017 ACM SIGSAC Conference on Computer and Communications Security. https://dl.acm.org/doi/10.1145/3133956.3133982
Damgård, I., et al. (2012). Multiparty Computation from Somewhat Homomorphic Encryption. CRYPTO 2012. https://link.springer.com/chapter/10.1007/978-3-642-32009-5_38
Groth, J. (2016). On the Size of Pairing-Based Non-Interactive Arguments. EUROCRYPT 2016. https://link.springer.com/chapter/10.1007/978-3-662-49896-5_11
Ocean Protocol. (2023). Decentralized Data Marketplace Whitepaper. https://oceanprotocol.com/
SlowMist. (2025). Security Risks in MCP-Based AI Systems. X Post Analysis. 
https://x.com/slowmist