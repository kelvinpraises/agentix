# 🎯 Agentix Comprehensive Test Plan

**Current Status**: 105 tests passing | 9 test files | ~24% service coverage

**Goal**: Achieve 85%+ coverage across all critical components

**Last Updated**: 2025-10-04 - Automated gap analysis completed

---

## 📊 Current Test Status

### ✅ Completed (105 tests across 9 files)

- `tests/utils/orb.test.ts` - 6 tests
- `tests/utils/user.test.ts` - 4 tests
- `tests/utils/permissions.test.ts` - 21 tests
- `tests/utils/threads.test.ts` - 7 tests
- `tests/services/trading/portfolio-service.test.ts` - 8 tests
- `tests/services/user/tradespace-service.test.ts` - 28 tests
- `tests/services/user/auth-service.test.ts` - 7 tests
- `tests/services/system/wallet/wallet-service.test.ts` - 16 tests
- `tests/services/system/threads/thread-service.test.ts` - 8 tests ✅ **NEW**

---

## 🔍 Gap Analysis Summary

**Service Coverage**: 8/33 service files tested (~24%)

### ❌ Critical Untested Services (Immediate Priority)

1. **trade-action-service.ts** - 19 methods, core trading execution
2. **market-data-service.ts** - 4 methods, external API integration
3. **strategy-service.ts** - 6 methods, strategy orchestration
4. **evm-wallet.ts** - 6 functions, EVM chain operations
5. **paper-wallet.ts** - 5 functions, paper trading simulation

### ⚠️ Existing Test Quality Issues

- `thread-service.test.ts` - Missing port conflict handling
- `auth-service.test.ts` - Missing password validation tests
- `portfolio-service.test.ts` - Missing P&L calculation tests
- `tradespace-service.test.ts` - Missing cascade deletion tests

---

## 📋 PRIORITY-ORDERED TEST PLAN

### **PHASE 1: Critical Trading Services (🔴 DO FIRST)**

#### 1. Trade Action Service - **HIGHEST PRIORITY**

**File**: `src/services/trading/trade-action-service.ts` (359 lines, 19 methods)
**Test File**: `tests/services/trading/trade-action-service.test.ts`
**Priority**: 🔴 Critical
**Status**: ❌ Missing

**Why Critical**: Core trading execution logic, state machine, journal integration

**Methods to Test**:

- `startNewTradeAction(sectorId)` - Trade initiation in ANALYZING state
- `updateTradeAction(tradeActionId, updates)` - Status transitions
- `setTradingPair(tradeActionId, orbId, tradingPair)` - Pair selection
- `createJournalEntry({type, tradeActionId, content})` - AI decision logging
- `getTradesBySector(sectorId, userId)` - Trade history retrieval
- `interruptTradeAction(tradeActionId)` - Emergency stop mechanism
- `addUserFeedback(tradeActionId, content)` - User interaction tracking
- `getJournalForTradeAction(tradeActionId)` - Journal retrieval
- `getTradeAction(tradeActionId)` - Single trade lookup
- `getSectorIdFromTradeAction(tradeActionId)` - Sector association
- `getExecutionJournalEntry(tradeActionId)` - Position entry retrieval
- `getTradingPairInfo(tradeActionId)` - Trading pair details
- `getOrbForTrade(tradeActionId)` - Orb association

**Test Scenarios**:

```typescript
describe("Trade Action Service", () => {
  describe("startNewTradeAction", () => {
    test("should create trade in ANALYZING status");
    test("should set is_active to true");
    test("should return trade ID");
  });

  describe("updateTradeAction", () => {
    test("should transition ANALYZING → EXECUTING");
    test("should transition EXECUTING → SUCCEEDED");
    test("should transition EXECUTING → FAILED");
    test("should update summary field");
    test("should update updated_at timestamp");
  });

  describe("setTradingPair", () => {
    test("should set orb_id and trading_pair");
    test("should validate orb belongs to same sector");
    test("should throw error for invalid orb");
  });

  describe("createJournalEntry", () => {
    test("should create AI_THOUGHT entry type");
    test("should create POSITION_ENTERED entry type");
    test("should link to correct trade_action_id");
    test("should validate content schema");
  });

  describe("interruptTradeAction", () => {
    test("should set is_active to false");
    test("should create interruption journal entry");
    test("should throw error if already completed");
  });

  describe("addUserFeedback", () => {
    test("should create USER_FEEDBACK journal entry");
    test("should validate UserFeedbackContent schema");
  });
});
```

**Dependencies to Mock**: `turso-connection`, `strategyQueue` (BullMQ)

---

#### 2. Market Data Service

**File**: `src/services/trading/market-data-service.ts` (278 lines, 4 methods)
**Test File**: `tests/services/trading/market-data-service.test.ts`
**Priority**: 🔴 Critical
**Status**: ❌ Missing

**Why Critical**: External API integration, data transformation, fuzzy search

**Methods to Test**:

- `getCoinList(searchTerm?)` - Fuse.js fuzzy search over CoinGecko coins
- `getMarketChart(coinId, vsCurrency, days)` - Chart data with transformations
- `getOHLC(coinId, vsCurrency, days)` - OHLC candlestick data
- `getMarketData(coinId)` - Comprehensive market data with Zod validation

**Test Scenarios**:

```typescript
describe("Market Data Service", () => {
  describe("getCoinList", () => {
    test("should return all coins when no search term");
    test("should fuzzy match 'btc' → 'bitcoin'");
    test("should fuzzy match 'eth' → 'ethereum'");
    test("should handle special characters in search");
    test("should return empty array for no matches");
  });

  describe("getMarketChart", () => {
    test("should fetch and transform price data");
    test("should handle API errors gracefully");
    test("should validate response schema");
  });

  describe("getOHLC", () => {
    test("should transform OHLC array to candlestick objects");
    test("should handle missing data points");
  });

  describe("getMarketData", () => {
    test("should validate response with Zod schema");
    test("should handle network failures");
    test("should handle rate limiting (429)");
  });
});
```

**Dependencies to Mock**: `ky` (HTTP client), CoinGecko API responses

---

#### 3. Strategy Service

**File**: `src/services/trading/strategy-service.ts` (248 lines, 6 methods)
**Test File**: `tests/services/trading/strategy-service.test.ts`
**Priority**: 🔴 Critical
**Status**: ❌ Missing

**Why Critical**: Multi-strategy orchestration, signal aggregation

**Methods to Test**:

- `addStrategy(tradeActionId, strategyType, config)` - Attach strategy to trade
- `updateStrategy(tradeActionId, strategyId, config)` - Update strategy config
- `removeStrategy(tradeActionId, strategyId)` - Remove strategy
- `analyzeStrategies(tradeActionId)` - Evaluate all strategies and aggregate signals
- `closeAllStrategies(tradeActionId)` - Bulk strategy closure
- `getStrategies(tradeActionId)` - Retrieve all strategies for trade

**Test Scenarios**:

```typescript
describe("Strategy Service", () => {
  describe("addStrategy", () => {
    test("should add RSI strategy with config");
    test("should add SMA Cross strategy");
    test("should add Position Monitor strategy");
    test("should add Time Limit strategy");
    test("should validate strategy config with Zod");
    test("should throw error for invalid strategy type");
  });

  describe("analyzeStrategies", () => {
    test("should aggregate multiple BUY signals → BUY");
    test("should aggregate BUY + SELL → NEUTRAL");
    test("should aggregate all NEUTRAL → NEUTRAL");
    test("should handle empty strategies list");
    test("should call correct strategy check function");
  });

  describe("closeAllStrategies", () => {
    test("should set all strategies to inactive");
    test("should update closed_at timestamp");
  });
});
```

**Dependencies to Mock**: `turso-connection`, strategy implementations (RSI, SMA, etc.)

---

#### 4. EVM Wallet Service

**File**: `src/services/system/wallet/chains/evm/evm-wallet.ts` (249 lines, 6 functions)
**Test File**: `tests/services/system/wallet/chains/evm-wallet.test.ts`
**Priority**: 🔴 Critical
**Status**: ❌ Missing

**Why Critical**: Real blockchain interactions, multi-chain support

**Functions to Test**:

- `getEVMChain(chain)` - Map chain name to Viem chain config
- `generateEVMWallet(orbId, chain)` - Create Privy embedded wallet
- `signEVMTransaction(orbData, transaction, privyWalletId)` - Sign TX with Privy
- `sendNativeToken(orbData, to, amount, privyWalletId)` - ETH/native transfers
- `sendERC20Token(orbData, to, amount, tokenAddress, privyWalletId)` - ERC20 transfers
- `createTransferRequest(orbData, from, to, amount, asset)` - Build transfer payload

**Test Scenarios**:

```typescript
describe("EVM Wallet", () => {
  describe("getEVMChain", () => {
    test("should map 'ethereum' → mainnet");
    test("should map 'sei' → seiMainnet");
    test("should map 'hyperliquid' → hyperliquidMainnet");
    test("should throw for unsupported chain");
  });

  describe("generateEVMWallet", () => {
    test("should call Privy createWallet API");
    test("should handle Privy API errors");
    test("should validate chain parameter");
  });

  describe("signEVMTransaction", () => {
    test("should sign transaction with Privy wallet");
    test("should validate transaction structure");
    test("should throw for missing privyWalletId");
  });

  describe("sendNativeToken", () => {
    test("should build native token transfer TX");
    test("should validate recipient address");
  });

  describe("sendERC20Token", () => {
    test("should build ERC20 transfer calldata");
    test("should validate token contract address");
  });
});
```

**Dependencies to Mock**: `@privy-io/server-auth`, `viem`, `ethers`

---

#### 5. Paper Wallet Service

**File**: `src/services/system/wallet/chains/paper/paper-wallet.ts` (245 lines, 5 functions)
**Test File**: `tests/services/system/wallet/chains/paper-wallet.test.ts`
**Priority**: 🔴 Critical
**Status**: ❌ Missing

**Why Critical**: Paper trading simulation, deterministic wallet generation

**Functions to Test**:

- `generatePaperWallet(orbId)` - Deterministic address generation
- `getPaperWalletAddress(orbId)` - Retrieve generated address
- `signPaperTransaction(orbData, transaction)` - Mock TX signing
- `executePaperTransfer(orbData, from, to, amount, asset)` - Simulated transfer
- `queryPaperBalance(orbData, address, asset)` - Balance queries

**Test Scenarios**:

```typescript
describe("Paper Wallet", () => {
  describe("generatePaperWallet", () => {
    test("should generate deterministic address from orbId");
    test("should generate same address for same orbId");
    test("should generate different addresses for different orbIds");
  });

  describe("signPaperTransaction", () => {
    test("should return mock signature");
    test("should validate transaction structure");
  });

  describe("executePaperTransfer", () => {
    test("should simulate transfer without blockchain");
    test("should validate sender has sufficient balance");
  });

  describe("queryPaperBalance", () => {
    test("should return balance for address and asset");
    test("should return 0 for unknown addresses");
  });
});
```

**Dependencies to Mock**: `turso-connection`

---

### **PHASE 2: Supporting Services (🟡)**

#### 6. Sentiment Service

**File**: `src/services/trading/sentiment-service.ts`
**Priority**: 🟡 High
**Status**: ❌ Missing

#### 7. Token Service

**File**: `src/services/system/token-service.ts`
**Priority**: 🟡 High
**Status**: ❌ Missing

#### 8. Profile Service

**File**: `src/services/user/profile-service.ts`
**Priority**: 🟡 High
**Status**: ❌ Missing

#### 9. Notification Service

**File**: `src/services/system/notification-service.ts`
**Priority**: 🟡 High
**Status**: ❌ Missing

---

### **PHASE 3: Strategy Implementations (🟢)**

#### 10-13. Strategy Implementations

**Files**:

- `strategies/rsi.ts` - RSI indicator strategy
- `strategies/sma-cross.ts` - SMA crossover strategy
- `strategies/position-monitor.ts` - Position monitoring
- `strategies/time-limit.ts` - Time-based exit

**Priority**: 🟢 Medium
**Status**: ❌ All Missing

**Common Test Pattern**:

```typescript
describe("RSI Strategy", () => {
  test("should return BUY when RSI < oversold threshold");
  test("should return SELL when RSI > overbought threshold");
  test("should return NEUTRAL when RSI in middle range");
  test("should handle insufficient data gracefully");
});
```

---

### **PHASE 4: Improve Existing Tests (⚠️)**

#### Thread Service Tests - Add Missing Scenarios

**File**: `tests/services/system/threads/thread-service.test.ts`
**Current**: 8 tests
**Missing**:

- Port conflict handling (random port already in use)
- Workerd process crash scenarios
- Cap'n Proto generation errors
- Extension bundling failures (esbuild errors)

#### Auth Service Tests - Add Security Tests

**File**: `tests/services/user/auth-service.test.ts`
**Current**: 7 tests
**Missing**:

- Password hashing validation (if applicable)
- JWT token generation/validation
- Email format edge cases
- Concurrent user creation race conditions

#### Portfolio Service Tests - Add Calculations

**File**: `tests/services/trading/portfolio-service.test.ts`
**Current**: 8 tests
**Missing**:

- P&L calculation tests
- Position value calculations
- Snapshot aggregation across orbs
- Complex trading pair parsing

#### Tradespace Service Tests - Add Edge Cases

**File**: `tests/services/user/tradespace-service.test.ts`
**Current**: 28 tests
**Missing**:

- Cascade deletions (sector → orbs → threads)
- Concurrent orb creation
- Wallet generation failure handling
- Policy version rollback scenarios

---

## 📈 Updated Coverage Target Breakdown

| Category             | Files | Tested | Coverage | Target  | Priority |
| -------------------- | ----- | ------ | -------- | ------- | -------- |
| **Utils**            | 4     | 4      | 100%     | 90%     | ✅ Done  |
| **Services/User**    | 3     | 2      | 67%      | 85%     | 🟡       |
| **Services/Trading** | 9     | 1      | 11%      | 85%     | 🔴       |
| **Services/System**  | 15    | 2      | 13%      | 85%     | 🔴       |
| **Neural/AI**        | 22    | 0      | 0%       | 80%     | 🔴       |
| **API Controllers**  | 8     | 0      | 0%       | 75%     | 🟡       |
| **RPC Targets**      | 2     | 0      | 0%       | 85%     | 🔴       |
| **Infrastructure**   | 6     | 0      | 0%       | 70%     | 🟢       |
| **Total**            | 69    | 9      | **24%**  | **82%** | -        |

---

## 🚀 Execution Plan

### Week 1: Critical Services

- **Day 1-2**: `trade-action-service.test.ts` (highest value)
- **Day 3**: `market-data-service.test.ts`
- **Day 4**: `strategy-service.test.ts`
- **Day 5**: `evm-wallet.test.ts` + `paper-wallet.test.ts`

**Target**: 5 new test files, ~40-50 tests

### Week 2: Supporting Services + Improvements

- **Day 1-2**: 4 supporting services (sentiment, token, profile, notification)
- **Day 3**: 4 strategy implementations
- **Day 4**: Improve existing test suites (add missing scenarios)
- **Day 5**: Integration tests (RPC targets)

**Target**: +6 test files, improve 4 existing, ~30 tests

---

## ✅ Updated Test Checklist

### Critical Path (Phase 1)

- [x] Thread service tests ✅ **COMPLETED**
- [x] Wallet service tests (main service) ✅ **COMPLETED**
- [ ] 🔴 Trade action service tests **← START HERE**
- [ ] 🔴 Market data service tests
- [ ] 🔴 Strategy service tests
- [ ] 🔴 EVM wallet tests
- [ ] 🔴 Paper wallet tests

### Supporting Services (Phase 2)

- [ ] Sentiment service
- [ ] Token service
- [ ] Profile service
- [ ] Notification service

### Strategy Implementations (Phase 3)

- [ ] RSI strategy tests
- [ ] SMA Cross strategy tests
- [ ] Position Monitor strategy tests
- [ ] Time Limit strategy tests

### Test Quality Improvements (Phase 4)

- [ ] Thread service - Add port conflict test
- [ ] Auth service - Add password validation
- [ ] Portfolio service - Add P&L calculations
- [ ] Tradespace service - Add cascade deletions

---

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test trade-action-service.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage (requires @vitest/coverage-v8)
npm run test:coverage

# Run tests matching pattern
npm test -- --grep="trade"
```

---

## 📚 Testing Best Practices

1. **Arrange-Act-Assert** - Structure all tests this way
2. **Mock external dependencies** - Database, APIs, file system
3. **Test isolation** - Each test should be independent
4. **Cleanup** - Use `afterEach` to reset state
5. **Descriptive names** - Test names should explain what/why
6. **Edge cases** - Test error paths, not just happy paths
7. **Integration tests** - Test real I/O where critical (threads, RPC)

---

## 🎯 Success Criteria

- ✅ All existing test files passing (105 tests)
- [ ] 85%+ coverage on critical services (trading, wallet, thread)
- [ ] 80%+ coverage on supporting services
- [ ] 75%+ coverage on controllers
- [ ] All critical integration tests passing
- [ ] CI/CD pipeline green

---

**Analysis Methodology**: Automated extraction using Haiku agent for data gathering, Sonnet orchestration for analysis and prioritization

**Files Analyzed**: 33 service files across 3 domains (user, trading, system)
**Current Coverage**: 24% (9/33 service files tested)
**Target Coverage**: 85% on critical paths
