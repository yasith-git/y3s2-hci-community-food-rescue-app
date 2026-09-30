# Git Branching Strategy & Workflow

## Branch Hierarchy

```
main
│
└── dev
    │
    ├── feature/leader-smart-donation
    ├── feature/smart-routing
    ├── feature/rescue-notifications
    └── feature/coordinator-trust
```

---

## Branch Rules

### `main`
- Stable, production-ready, fully integrated versions only.
- Direct commits or feature development on `main` are strictly forbidden.
- Releases and production deployments originate solely from `dev` merges.

### `dev`
- Central integration and staging branch.
- All completed feature branches merge into `dev`.
- Integration and regression testing are conducted on this branch before merging to `main`.

### Feature Branches
- `feature/leader-smart-donation` (Member 1 - Group Leader)
- `feature/smart-routing` (Member 2)
- `feature/rescue-notifications` (Member 3)
- `feature/coordinator-trust` (Member 4)
- Each member develops exclusively on their designated feature branch.
- Regularly pull the latest changes from `dev` into your feature branch before starting major work.
- Merge completed features into `dev` via Pull Requests with code reviews.

---

## Standard Workflow

```
feature branch
    ↓
Pull Request (Review & Approval)
    ↓
dev
    ↓
Integration & Regression Testing
    ↓
Pull Request
    ↓
main
```

> [!CAUTION]
> Never merge directly from a `feature/*` branch into `main`. All features must flow through `dev` first.
