# Open Source and Attribution

FlexShare is released under the MIT License. See `../LICENSE`.

## What Is Covered

The license covers the source code and documentation in this repository unless a file states otherwise.

## Third-Party Dependencies

Third-party dependencies are declared in module package manifests:

- Front end: `web/package.json`
- Backend parent project: `backend/pom.xml`
- Backend member service: `backend/member-service/pom.xml`
- Prototype utilities: `cloud-prototypes/package.json` and Python scripts

Each third-party dependency is governed by its own license. Review dependency licenses before redistribution or production use.

## Assets and Media

Images, QR codes, screenshots, diagrams, and demo videos are included for project review. Before commercial use, confirm ownership and licensing for every visual asset and external media reference.

## Cloud and Service Terms

The project references Google Maps Platform and AWS services. Use of those services is subject to their own terms, billing rules, quotas, and data-processing requirements.

## Production Readiness Notice

This repository is suitable for review, coursework, and portfolio demonstration. A production deployment should include:

- Dependency license report.
- Dependency vulnerability scan.
- Secrets scan.
- Infrastructure security review.
- Privacy and data-retention review.
- Penetration test for authentication, authorization, and route booking flows.
