# 🧭 Implementation Plan: OGC API Connected Systems Client

This document outlines the step-by-step plan for integrating support for the OGC API - Connected Systems standard into the [`camptocamp/ogc-client`](https://github.com/camptocamp/ogc-client) TypeScript library. Development is tracked in [Sam-Bolling/ogc-client](https://github.com/Sam-Bolling/ogc-client) with the intent to contribute upstream via [Issue #118](https://github.com/camptocamp/ogc-client/issues/118).

---

## ✅ Goals

- Modular client using composition
- Flexible query interface using `Record<string, string>`
- Support for Systems, Observations, System History, Commands
- Full test coverage and documentation
- Capability detection for conditional exposure
- Compliance with CSAPI spec via modular implementation
- Contribution to upstream repo with maintainable design

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

This design ensures that CSAPI support can be added without disrupting existing functionality, and can be cleanly merged back into the upstream repo via a pull request referencing [Issue #118](https://github.com/camptocamp/ogc-client/issues/118).

---

## 📋 Phase Checklist

<details>
<summary>🟨 Phase 1: Planning & Setup</summary>

- [x] Fork `camptocamp/ogc-client` and clone locally
- [x] Create feature branch `feature/ogc-connected-systems`
- [x] Enable Issues tab in fork
- [x] Create GitHub Project board
- [x] Document implementation plan (`docs/connected-systems-plan.md`)
- [x] Add issues to repo and update project board

</details>

<details>
<summary>🟦 Phase 2: Core Client Development</summary>

- [ ] Scaffold CSAPI module structure (`src/client/connectedSystemsClient.ts`)
- [ ] Implement `getSystems(params: Record<string, string>)` method
- [ ] Implement `getObservations(params: Record<string, string>)` method
- [ ] Implement `getSystemHistory(params: Record<string, string>)` method
- [ ] Implement `getCommands(params: Record<string, string>)` method
- [ ] Add capability detection (`hasConnectedSystemsSupport()`)
- [ ] Integrate CSAPI into main client using composition

</details>

<details>
<summary>🟩 Phase 3: Testing</summary>

- [ ] Set up `vitest` or `jest`
- [ ] Write test cases for each CSAPI method
- [ ] Add fixtures and reusable test data

</details>

<details>
<summary>🟧 Phase 4: Documentation</summary>

- [ ] Add JSDoc comments to CSAPI methods
- [ ] Add usage examples to README

</details>

<details>
<summary>🟥 Phase 5: Finalization</summary>

- [ ] Open pull request to upstream repo
- [ ] Respond to maintainer feedback

</details>

<details>
<summary>🆕 Phase 6: Extended CSAPI Support</summary>

- [ ] Implement `getProcedures()` method
- [ ] Implement `getDeployments()` method
- [ ] Implement `getProperties()` method
- [ ] Implement `getSamplingFeatures()` method
- [ ] Implement `getDatastreams()` method
- [ ] Implement `getControlChannels()` method
- [ ] Implement `getSystemEvents()` method

</details>

---

## 📜 Compliance Note

This implementation is compliant with the OGC API - Connected Systems specification based on modular support for core entities. Additional entities will be added incrementally. Capability detection ensures that unsupported endpoints are not exposed, preserving interoperability and graceful degradation.