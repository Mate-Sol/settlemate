# Defa-PSP-v2 End-to-End Project Flow

This document outlines the high-level end-to-end workflow of the platform, covering the journey from the initial onboarding of a Payment Service Provider (PSP) to the approval processes, credit line initiation, and repayment cycles.

## 1. PSP Onboarding & Registration
**Goal:** Allow a new PSP to register, integrate, and submit the required documentation for compliance and operational setup.

- **Account Creation:** The PSP creates an account on the client portal, providing basic corporate details.
- **Document Submission (KYB/KYC):** The PSP uploads necessary compliance documents, legal registration, and financial information (e.g., via the `FinancialInfo` and onboarding flows).
- **API Keys Generation:** The PSP receives or generates API keys to begin integrating their systems (`external_psp`) with the main Defa backend (`server`), allowing test transactions to initially flow in sandbox mode.

## 2. Profile Approval Workflow
**Goal:** Multi-tier verification of the PSP's profile before full production privileges and credit lines are granted.

### A. Compliance & Admin Review
- **Initial Verification:** The platform's admin team reviews the submitted documents and API test logs for validity and completeness.

### B. CAD (Credit Approval Department) Side
- **Risk Assessment:** The CAD team evaluates the PSP's business model, operational risk, and financial stability.
- **Recommendation:** CAD provides the primary authorization and recommends a safe credit limit for the PSP based on their health metrics.

### C. CFO (Chief Financial Officer) Side
- **Final Sign-off:** The CFO reviews the CAD's assessment and makes the ultimate financial decision.
- **Profile Activation:** Once approved by the CFO, the PSP's profile is fully activated for production use.

## 3. Credit Line Request & Allocation
**Goal:** Enable the PSP to request funds to facilitate their daily disbursement operations.

- **Request Initiation:** The approved PSP uses their portal to initiate a formal Credit Line Request, specifying the required amount.
- **Review & Allocation:** The finance team (or automated system, if within CFO limits) reviews the request. Upon approval, the requested amount is credited to the PSP's functional ledger/wallet.
- **Availability:** The PSP can now process transactions against this available credit line.

## 4. Transaction Processing & Disbursment
**Goal:** Utilizing the allocated credit line for actual end-user operations.

- **API Execution:** The PSP's systems trigger disbursement API calls to the main platform.
- **Disbursement Workers:** Backend background processes (e.g., `disbursementAgent`) execute the transfer of funds or value.
- **Balance Update:** The system dynamically decrements the PSP's available credit balance as disbursements succeed.

## 5. Repayment & Settlement Cycle
**Goal:** Settling the utilized credit line to restore limits and maintain platform health.

- **Statement Generation:** The platform periodically (e.g., daily, weekly, or at the end of the term) generates a comprehensive settlement report of all utilized credit.
- **Repayment Event:** The PSP executes a repayment, sending fiat or equivalent funds back to the platform's treasury.
- **Reconciliation:** The platform's finance team verifies the receipt of the repayment.
- **Ledger Reset:** Upon verification, the PSP's available credit line is replenished by the repaid amount, completing the cycle.
