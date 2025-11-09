# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added

- Initial release of Smartemailing Contact Importer node
- Import contacts to Smartemailing contact lists
- Support for importing from input items or JSON parameter
- Dynamic contact list selection via dropdown
- Support for all import settings:
  - Update existing contacts
  - Add genders, namedays, and salutations
  - Preserve unsubscribed status
  - Skip invalid emails
- Double opt-in email campaign configuration:
  - Email ID selection
  - Sender credentials (from, reply-to, name)
  - Confirmation thank you page URL
  - Send to mode (all contacts or new only)
  - Silence period configuration
- Comprehensive README with usage examples and documentation
