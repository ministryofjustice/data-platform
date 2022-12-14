# ADR-001 Use the Modernisation Platform

## Status

✅ Accepted

## Context

Historically the projects and products in the data space,
leading up to the data platform,
have been managed in the team's own AWS accounts.
This has caused issues from misalignment with security baselines,
and meant that some of their AWS accounts were managed independently of our internal best practice.

The available options are:

* The [Cloud Platform](https://user-guide.cloud-platform.service.justice.gov.uk/)
* The [Modernisation Platform](https://user-guide.modernisation-platform.service.justice.gov.uk/)
* Self-management

## Decision

We will use the Modernisation Platform for hosting.

We have had 5 years experience of self-managing a collection of AWS accounts on the Analytical Platform,
and it has not been a positive experience.

While the Cloud Platform is a great environment for us to encourage our customers to host their services,
the data platform itself falls outside the type of system that the [Cloud Platform is best at hosting](https://user-guide.cloud-platform.service.justice.gov.uk/documentation/concepts/what-is-the-cloud-platform.html).

## Consequences

As a result of this decision we will benefit from all of the features documented in the [Modernisation User Guide](https://user-guide.modernisation-platform.service.justice.gov.uk/user-guide/our-offer-to-you.html).

In addition to the drawing on wider Platforms & Architecture expertise,
we will be able to take advantage of

* A defined security baseline out of the box
* Minimisation of clickops with restricted console access
* Github Actions bots already in place to maintain IaC quality (TFSEC / Checkov / CTFLint)
* PR approval workflows for infrastructure
* Cost effectiveness of re-use rather than build from scratch

We may have to deal with automatic tear-down of experimental environments,
but all other dev, staging or production environments will be stable.
