# 🧭 Implementation Plan: OGC API Connected Systems Client

This document outlines the step-by-step plan for integrating support for the OGC API - Connected Systems standard into the `camptocamp/ogc-client` repository. Development is tracked in [Sam-Bolling/ogc-client](https://github.com/Sam-Bolling/ogc-client) with the intent to contribute upstream via [Issue #118](https://github.com/camptocamp/ogc-client/issues/118).

---

## ✅ Goals
- Modular client using composition
- Dictionary-based query interface
- Support for Systems, Observations, System History, Commands
- Full test coverage and documentation
- Capability detection for conditional exposure
- Compliance with CSAPI spec via modular implementation
- Contribution to upstream repo with maintainable design

---

## 🧠 Architectural Notes

> CSAPI logic will be implemented in a dedicated module (`connected_systems.py`) using composition rather than inheritance. This mirrors the design used in the EDR implementation, promoting modularity, capability-based exposure, and separation of concerns.

> Initial implementation will focus on core CSAPI entities. Additional entities will be added modularly to maintain compliance while enabling incremental development.

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

- [ ] Scaffold CSAPI module structure (`ogc_client/connected_systems.py`)
- [ ] Implement `get_systems()` method
- [ ] Implement `get_observations(options: dict)` method
- [ ] Implement `get_system_history(options: dict)` method
- [ ] Implement `get_commands(options: dict)` method
- [ ] Add capability detection (`has_connected_systems_support()`)
- [ ] Integrate CSAPI into main client using composition
</details>

<details>
<summary>🟩 Phase 3: Testing</summary>

- [ ] Set up `pytest` and `requests-mock`
- [ ] Write test cases for each CSAPI method
- [ ] Add fixtures and reusable test data
</details>

<details>
<summary>🟧 Phase 4: Documentation</summary>

- [ ] Add docstrings to CSAPI methods
- [ ] Add usage examples to README
</details>

<details>
<summary>🟫 Phase 5: Packaging</summary>

- [ ] Create `setup.py` with metadata
- [ ] Add `requirements.txt`
- [ ] Add `.gitignore` and `LICENSE`
</details>

<details>
<summary>🟥 Phase 6: Finalization</summary>

- [ ] Open pull request to upstream repo
- [ ] Respond to maintainer feedback
</details>

<details>
<summary>🆕 Phase 7: Extended CSAPI Support</summary>

- [ ] Implement `get_procedures()` method
- [ ] Implement `get_deployments()` method
- [ ] Implement `get_properties()` method
- [ ] Implement `get_sampling_features()` method
- [ ] Implement `get_datastreams()` method
- [ ] Implement `get_control_channels()` method
- [ ] Implement `get_system_events()` method
</details>

---

## 📜 Compliance Note

This implementation is compliant with the OGC API - Connected Systems specification based on modular support for core entities. Additional entities will be added incrementally. Capability detection ensures that unsupported endpoints are not exposed, preserving interoperability and graceful degradation.

