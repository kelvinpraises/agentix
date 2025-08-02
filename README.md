### **Architectural Blueprint: An Event-Driven, Composable Trading Agent**

This document outlines a high-performance, resilient, and scalable trading system architecture. The design leverages a central message bus (BullMQ) to create a fully event-driven workflow, ensuring fault tolerance and clear separation of concerns between discovering opportunities and managing active trades.

#### **Core Philosophy: Decoupled Risk and Strategy**

The system's architecture is founded on a sophisticated principle: **the complete separation of universal risk management from dynamic, alpha-seeking strategy logic.**

*   **Risk Layer (The Foundation):** Every trade initiated by the AI Agent is fundamentally governed by a non-negotiable risk layer, consisting of Stop Loss (SL) and Take Profit (TP) parameters. This is the default safety net that ensures capital is always protected.
*   **Strategy Layer (The Overlay):** The AI Agent can then compose and attach one or more advanced, alpha-seeking strategies to an open trade (e.g., RSI-based exit, moving average cross). These strategies provide more nuanced exit conditions that can optimize profits or preempt losses before the foundational SL/TP levels are hit.

A trade is closed by whichever condition is met first, be it the foundational risk layer or an overlayed strategy. This composable, layered approach provides ultimate flexibility, allowing a trade to operate with simple risk brackets or a complex, multi-condition exit plan.

---

### **System Workflow and Service Responsibilities**

The system operates as a continuous, cyclical flow orchestrated by two distinct, purpose-driven queues.

#### **1. Cron Service (System Initiator & Heartbeat)**
This service acts as the system's bootstrap and integrity check.
*   **On Startup:** It purges and resets the queues to ensure a clean state.
*   **Continuous Operation:** It periodically scans the system to ensure every active user has a corresponding, repeatable job in the `User Policy Queue`. This guarantees that no user is ever missed and that trading analysis occurs precisely at the frequency defined by their policy.

**↓↓↓**

#### **2. User Policy Queue (Opportunity Discovery)**
This queue's sole purpose is to trigger the **discovery of new trading opportunities.**
*   **Job:** A repeatable job for each user, containing their full trading context (`userId`, `policy`, `positions`, `balances`).
*   **Action:** When a job runs, it invokes the `AI Agent` to perform a holistic market analysis for that specific user.

**↓↓↓**

#### **3. AI Agent (The Central Brain & Orchestrator)**
This service is the core decision-making engine. It does not manage trades directly but orchestrates their creation and defines their rules.
*   **Analysis:** Upon receiving a user's context, the agent utilizes its suite of tools (`insight-tools`, `execution-tools`) to analyze market data, sentiment, and other factors.
*   **Trade Initiation:** If an opportunity is identified:
    1.  The agent defines the foundational **Risk Layer** (TP and SL).
    2.  It then selects and attaches any optional **Strategy Layer** rules.
    3.  All rules (risk and strategy) are recorded in a `TradeActionsTable` linked to the new trade.
    4.  Finally, it places the trade and creates a **new, unique, repeatable job** in the `Strategy & Risk Queue` to manage this specific open position.
*   **Interrupt Handling:** The agent serves as the single entry point for high-priority user commands (e.g., "force close trade," "update strategy"). This allows a user to override automated logic cleanly and instantly.

**↓↓↓**

#### **4. Strategy & Risk Queue (In-Flight Trade Management)**
This queue's sole purpose is to manage **open, active trades** by executing their predefined exit rules.
*   **Job:** A repeatable job for each open trade, running at a high frequency (e.g., every 20 seconds). The job's payload is simply the `tradeId`.
*   **Execution Cycle:** On each run, the worker performs a lightweight, data-driven check:
    1.  Fetch the `tradeId` from the job.
    2.  Fetch the live market price for the trade's asset.
    3.  Retrieve all active exit rules for the `tradeId` from the database.
    4.  Execute each rule against the live price.
    5.  If **any rule's condition is met**, the worker initiates a "close trade" action and terminates the repeatable job, ending the monitoring cycle.
    6.  If no conditions are met, the job completes and waits for its next scheduled run.


Complete separation of opportunity discovery from active trade management through message queues. Two-queue architecture for user policy execution and strategy monitoring.
