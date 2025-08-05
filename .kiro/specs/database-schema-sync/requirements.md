# Requirements Document

## Introduction

データベーススキーマとコードの不整合により、`analysis_tag_id` カラムが見つからないエラーが発生している。テンプレートインポート時に「Could not find the 'analysis_tag_id' column of 'products' in the schema cache」エラーが出力される問題を解決する必要がある。

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the database schema to be synchronized with the code definitions, so that template imports and other database operations work without column-related errors.

#### Acceptance Criteria

1. WHEN the system accesses the products table THEN all columns defined in the TypeScript types SHALL exist in the actual database schema
2. WHEN a template is imported THEN the system SHALL NOT throw "Could not find column" errors
3. WHEN the database schema is updated THEN the schema cache SHALL be properly refreshed
4. IF the analysis_tag_id column is missing THEN the system SHALL either add the column or remove references to it from the code

### Requirement 2

**User Story:** As a developer, I want a reliable database migration process, so that schema changes can be applied consistently across environments.

#### Acceptance Criteria

1. WHEN schema changes are needed THEN a migration script SHALL be created to apply the changes safely
2. WHEN the migration runs THEN existing data SHALL be preserved
3. WHEN the migration completes THEN the schema SHALL match the code definitions exactly
4. IF the migration fails THEN the system SHALL provide clear error messages and rollback instructions

### Requirement 3

**User Story:** As a system user, I want the application to work without database errors, so that I can use all features including template imports.

#### Acceptance Criteria

1. WHEN I import a template THEN the operation SHALL complete successfully without column errors
2. WHEN the system queries the products table THEN all expected columns SHALL be available
3. WHEN database operations are performed THEN they SHALL not fail due to schema mismatches
4. IF optional columns are missing THEN the system SHALL handle them gracefully without errors