# 🧭 Implementation Plan: OGC API Connected Systems Client

This document outlines the step-by-step plan for integrating support for the OGC API - Connected Systems standard into the [`camptocamp/ogc-client`](https://github.com/camptocamp/ogc-client) TypeScript library. Development is performed in [Sam-Bolling/ogc-client](https://github.com/Sam-Bolling/ogc-client) and tracked in [OS4CSAPI](https://github.com/users/Sam-Bolling/projects/1) with the intent to contribute upstream via [Issue #118](https://github.com/camptocamp/ogc-client/issues/118).

This implementation follows a Test-Driven Development (TDD) workflow: each method will be defined by its expected behavior through failing tests before implementation begins. This ensures clarity, coverage, and contributor confidence.

---

## ✅ Goals

- Modular client using composition  
- Flexible query interface using `Record<string, string>`  
- Support for Systems, Observations, System History, Commands  
- Full test coverage and documentation  
- Capability detection for conditional exposure  
- Compliance with CSAPI spec via modular implementation  
- Contribution to upstream repo with maintainable design  
- Test-Driven Development (TDD) as a foundational workflow  

---

## 🧠 Architectural Rationale (TypeScript)

This implementation follows the modular design patterns used in the upstream `camptocamp/ogc-client` TypeScript library. Rather than extending the main client via inheritance, CSAPI functionality will be encapsulated in a dedicated `ConnectedSystemsClient` class and composed into the main client instance.

This approach mirrors how EDR support is integrated — using capability detection and conditional exposure — and ensures that CSAPI logic remains isolated, testable, and maintainable.

### Key Design Principles

- **Composition over inheritance**: CSAPI logic is injected as a property (`connectedSystems`) only if the server advertises support.  
- **Modular client structure**: Each API (Features, EDR, CSAPI) lives in its own file and namespace, promoting separation of concerns.  
- **Capability detection**: The main client will expose `.connectedSystems` only if CSAPI-specific links or metadata are present.  
- **Type safety**: All query parameters and responses will use TypeScript interfaces and `Record<string, string>` for flexible filtering.  
- **Testability**: Each method will be covered by unit tests using `vitest` or `jest`, with mock responses for isolated validation.  
- **TDD-first workflow**: All behavior will be defined via failing tests before implementation begins, following the Red → Green → Refactor cycle.  

This design ensures that CSAPI support can be added without disrupting existing functionality, and can be cleanly merged back into the upstream repo via a pull request referencing [Issue #118](https://github.com/camptocamp/ogc-client/issues/118).

---

## 📁 Recommended File Structure

Before coding begins, set up the following folders and files to support modular development and test-first workflows:

```plaintext
src/
├── client/
│   ├── connectedSystemsClient.ts       ← CSAPI method implementations
│   ├── index.ts                        ← Main client entry point
├── types/
│   └── csapi.ts                        ← Shared CSAPI types/interfaces
├── utils/
│   └── fetch.ts                        ← Reusable fetch wrapper (optional)
tests/
└── connectedSystemsClient.test.ts      ← Unit tests for CSAPI methods
```

This structure ensures separation of concerns, supports reusable patterns, and keeps tests close to the implementation.

---

## 📋 Phase Checklist

<details>
<summary>🟨 Phase 0: Planning & Setup</summary>

- [x] Fork `camptocamp/ogc-client` and clone locally  
- [x] Create feature branch `feature/ogc-connected-systems`  
- [x] Enable Issues tab in fork  
- [x] Create GitHub Project board  
- [x] Document implementation plan (`docs/connected-systems-plan.md`)  
- [x] Add issues to repo and update project board  

</details>

<details>
<summary>🟦 Phase 1: Scaffolding & Test Setup</summary>

- [ ] Create file structure for CSAPI module and tests (see 📁 Recommended File Structure)  
- [ ] Scaffold CSAPI module (`src/client/connectedSystemsClient.ts`)  
- [ ] Create shared types (`src/types/csapi.ts`)  
- [ ] Set up test framework (`vitest` or `jest`)  
- [ ] Create initial test file (`tests/connectedSystemsClient.test.ts`)  
- [ ] Write failing tests for placeholder methods  
- [ ] Add capability detection stub (`hasConnectedSystemsSupport()`)  

</details>

<details>
<summary>🟩 Phase 2: Capability Detection </summary>

- [ ] Write test: `.connectedSystems` is undefined when CSAPI is not supported  
- [ ] Write test: `.connectedSystems` is defined when CSAPI endpoints are present  
- [ ] Implement detection logic to pass tests  
- [ ] Integrate CSAPI into main client using composition  

</details>

<details>
<summary>🟦 Phase 3: Method Implementation </summary>

For each method:

1. Write a failing test that defines expected behavior  
2. Implement minimal code to pass the test  
3. Refactor for clarity and reuse  
4. Add JSDoc comments and upstream spec references  

Methods to implement:

- [ ] `getSystems(params: Record<string, string>)`  
- [ ] `getObservations(params: Record<string, string>)`  
- [ ] `getSystemHistory(params: Record<string, string>)`  
- [ ] `getCommands(params: Record<string, string>)`  

</details>

<details>
<summary>🟧 Phase 4: Shared Patterns & Fixtures</summary>

- [ ] Extract reusable fetch logic  
- [ ] Add utility functions for query param encoding  
- [ ] Create mock data fixtures for CSAPI responses  
- [ ] Ensure consistent mocking and assertions across tests  

</details>

<details>
<summary>🟨 Phase 5: Documentation & Contributor Experience</summary>

- [ ] Add usage examples to README  
- [ ] Document TDD workflow in CONTRIBUTING.md  
- [ ] Tag “Good First Issues” for scoped tasks  
- [ ] Create GitHub milestone and label for CSAPI implementation  

</details>

<details>
<summary>🟥 Phase 6: Finalization</summary>

- [ ] Open pull request to upstream repo  
- [ ] Respond to maintainer feedback  

</details>

<details>
<summary>🆕 Phase 7: Extended CSAPI Support (Post-MVP)</summary>

These methods will be considered after MVP completion:

- [ ] `getProcedures()`  
- [ ] `getDeployments()`  
- [ ] `getProperties()`  
- [ ] `getSamplingFeatures()`  
- [ ] `getDatastreams()`  
- [ ] `getControlChannels()`  
- [ ] `getSystemEvents()`  

</details>

---

## 📜 Compliance Note

This implementation is compliant with the OGC API - Connected Systems specification based on modular support for core entities. Additional entities will be added incrementally. Capability detection ensures that unsupported endpoints are not exposed, preserving interoperability and graceful degradation.
