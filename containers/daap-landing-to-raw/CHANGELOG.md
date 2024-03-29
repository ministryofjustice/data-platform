<!-- markdownlint-disable MD003 -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.1] 2023-11-23

- Added s3_copy_and_remove_source function to patch bug where
  files weren't being deleted

## [1.5.0] 2023-11-15

- Updated base image to 7.0.0

## [1.4.0] 2023-11-13

### Changed

- Updated base image to 6.2.0

## [1.3.3] 2023-11-10

### Changed

- Updated base image
- Updated pyarrow

## [1.3.2] 2023-11-08

### Changed

- Updated base image
- Updated pip
- Updated urllib3

## [1.3.1]

- Bugfix for embedded newline check.

## [1.3.0]

### Changes

- Reject CSVs with embedded newlines. We are currently unable to process these
  CSVs, so the ingestion fails in the athena load step. This changes ensures
  that we handle the failure gracefully until we implement a solution (e.g.
  preprocessing the data).

## [1.2.0]

- Delete file from landing after copying it to raw

## [1.1.1]

- Dependency update

## [1.1.0]

- Add schema validation.
  If validation fails, data is moved to a "fail" location instead of "raw".

## [1.0.2]

- Bump patch to trigger image reupload

## [1.0.1]

- Bump patch to trigger image reupload

## [1.0.0]

### Added

- Initial container definition
