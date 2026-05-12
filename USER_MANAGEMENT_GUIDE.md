# COMPREHENSIVE USER MANAGEMENT & RBAC SYSTEM

## Nido Platform - Production-Level Implementation

## Overview

This document describes the complete user management and Role-Based Access Control (RBAC) system implemented in Nido Platform v3+. It supports three user types: **Internal Employees**, **Client Users**, and **Vendor Users**, with granular permission management across all platform modules.

---

## Quick Start

### Access Points

- **User Management**: `/users/management` - Create, edit, manage users with bulk import
- **Role Templates**: `/users/roles` - View and understand permission matrix for each role
- **Departments**: `/users/departments` - Organize teams and manage organizational structure
- **User Invitations**: `/users/invitations` - Send invitations and manage onboarding
- **Audit Trail**: `/users/audit-trail` - Track all system activities

### Owner Credentials (Development)

```
Email: owner@nidotech.com
Password: password
```

---

## Architecture & Components

### 1. Permission System (`src/lib/permissions.ts`)

**Core Concepts:**

- **Modules**: 14 system modules (Dashboard, Orders, Shop, Vendors, Clients, etc.)
- **Actions**: 7 permission actions (View, Create, Edit, Delete, Approve, Export, Configure)
- **Role Templates**: 11 predefined role templates with permission matrices

**Available Actions:**

```typescript
"view"      - Can see data in the module
"create"    - Can create new records
"edit"      - Can modify existing records
"delete"    - Can remove records
"approve"   - Can approve workflows
"export"    - Can export data
"configure" - Can change module settings
```

**Data Visibility Levels:**

- **All** - Access to all company data
- **Department Only** - Access to own department only
- **Own Only** - Access only to personal records

---

## Role Templates

### Complete Role Hierarchy

#### 1. **Owner** (System Owner)

- **Access Level**: Complete platform access
- **Data Visibility**: All data
- **Approval Limit**: ₹999,999 (unlimited)
- **Can Approve**: Yes
- **Use Case**: Platform administrator with full control

#### 2. **Admin** (Administrator)

- **Access Level**: Full internal operations access
- **Data Visibility**: All data
- **Approval Limit**: ₹500,000
- **Can Approve**: Yes
- **Use Case**: Help with day-to-day operations

#### 3. **Procurement Manager**

- **Access Level**: Purchase orders and vendor management
- **Data Visibility**: All data
- **Approval Limit**: ₹250,000
- **Can Approve**: Yes
- **Use Case**: Lead procurement team

#### 4. **Procurement Specialist**

- **Access Level**: Create and manage purchase orders
- **Data Visibility**: All data
- **Approval Limit**: ₹50,000
- **Can Approve**: No
- **Use Case**: Day-to-day purchasing

#### 5. **Accounts Payable Officer**

- **Access Level**: Bill and payment management
- **Data Visibility**: All data
- **Approval Limit**: ₹100,000
- **Can Approve**: No
- **Use Case**: Process vendor payments

#### 6. **Finance Manager**

- **Access Level**: Full financial operations
- **Data Visibility**: All data
- **Approval Limit**: ₹300,000
- **Can Approve**: Yes
- **Use Case**: Financial oversight

#### 7. **Employee** (Internal)

- **Access Level**: Basic dashboard and shop access
- **Data Visibility**: Department only
- **Approval Limit**: ₹0
- **Can Approve**: No
- **Use Case**: Standard employee

#### 8. **Client Admin**

- **Access Level**: Full client account management
- **Data Visibility**: All client data
- **Approval Limit**: ₹1,000,000
- **Can Approve**: Yes
- **Use Case**: Corporate client admin

#### 9. **Client User** (Standard)

- **Access Level**: Limited client functionality
- **Data Visibility**: Own records only
- **Approval Limit**: ₹0
- **Can Approve**: No
- **Use Case**: Corporate client staff

#### 10. **Vendor Admin**

- **Access Level**: Vendor account management
- **Data Visibility**: Own records only
- **Approval Limit**: ₹0
- **Can Approve**: No
- **Use Case**: Vendor representative

#### 11. **Vendor User**

- **Access Level**: Basic vendor access
- **Data Visibility**: Own records only
- **Approval Limit**: ₹0
- **Can Approve**: No
- **Use Case**: Vendor staff

---

## User Management Pages

### 1. Enhanced Users Page (`/users/management`)

**Features:**

- User directory with advanced search/filter
- Create new users with role assignment
- Bulk import from CSV
- View permission matrix per user
- Password reset capability
- User status management (Active/Inactive/Suspended)
- Statistics dashboard

**User Types:**

- **Internal User**: Company employees
- **Client User**: Corporate collaborators
- **Vendor User**: Business partners

**Actions:**

```
✓ Create users individually or in bulk
✓ Assign roles and departments
✓ Reset passwords (generates temporary password)
✓ View detailed permissions for each user
✓ Manage user status
✓ Export user list
```

### 2. Role Templates Page (`/users/roles`)

**Features:**

- Interactive role exploration
- Complete permission matrix per role
- Side-by-side role comparison
- RBAC best practices guide

**Matrix Shows:**

- Module name and description
- Granted actions (View, Create, Edit, Delete, Approve, Export)
- Clear visual indicators (✓/✗)
- Approval limits and data visibility

### 3. Departments Page (`/users/departments`)

**Features:**

- Organizational structure management
- Department CRUD operations
- Manager assignment
- Team member visualization
- Statistics tracking

**Usages:**

- Organize employees by function
- Set data visibility scope
- Manage hierarchical structures
- Track department statistics

### 4. User Invitation Page (`/users/invitations`)

**Onboarding Workflow:**

1. Owner/Admin sends invitation to new user's email
2. Temporary credentials generated automatically
3. Invitation link valid for 7 days
4. User clicks link and activates account
5. User sets new password
6. Access permissions applied immediately

**Invitation States:**

- **Pending**: Awaiting user acceptance
- **Accepted**: User activated account
- **Expired**: Link expired (resend required)

**Actions:**

```
✓ Send invitations to multiple users
✓ Auto-assign roles and departments
✓ Resend expired invitations
✓ Copy invitation link
✓ Track invitation status
✓ View acceptance timeline
```

### 5. Audit Trail Page (`/users/audit-trail`)

**Tracked Activities:**

- User login/logout
- Record creation, updates, deletions
- Approval actions
- Data exports
- Role/permission changes

**Advanced Filtering:**

- By user
- By action type
- By entity type
- Date range filtering

**Data Captured:**

- Exact timestamp
- User who performed action
- What changed (before/after values)
- Reason/context if available

**Export Options:**

- CSV export with filters
- Historical analysis
- Compliance reporting

---

## Enhanced Auth Context (`src/contexts/EnhancedAuthContext.tsx`)

### Key Functionality

#### Authentication

```typescript
login(email: string, password: string): Promise<boolean>
logout(): void
changePassword(oldPassword: string, newPassword: string): Promise<Result>
resetPassword(userId: string): Promise<Result>
```

#### User Management

```typescript
createUser(userData: UserData): Promise<Result>
createBulkUsers(rows: UserData[]): Promise<Statistics>
updateUser(userId: string, updates: Partial<UserData>): Promise<boolean>
deleteUser(userId: string): Promise<boolean>
```

#### Permissions

```typescript
hasModulePermission(module: string, action: PermissionAction): boolean
canApprove(amount: number): boolean
getUserPermissions(userId: string): Record<string, string[]>
```

#### Invitations

```typescript
inviteUser(email, role, userType, dept): Promise<Result>
getInvitations(): UserInvitation[]
acceptInvitation(invitationId, password): Promise<boolean>
resendInvitation(invitationId): Promise<boolean>
```

#### Departments

```typescript
createDepartment(dept: DepartmentData): void
updateDepartment(id: string, data: Partial<DepartmentData>): void
deleteDepartment(id: string): void
```

#### Audit Logging

```typescript
logAction(action, entityType, entityId, entityName, details): void
getAuditLogs(filters?): AuditLog[]
```

---

## Security Features

### 1. Password Management

- **Hashing**: Passwords are hashed before storage
- **Temporary Passwords**: Generated for new users (8 chars alphanumeric)
- **Reset Workflow**: Force password change on first login
- **Account Lockout**: 5 failed attempts = 30 min lockout

### 2. Session Management

- Session tracking with timestamps
- Last login recording
- Device/IP information capture
- Automatic session timeout

### 3. Audit Trail

- Immutable action logs
- User identification
- Complete activity history
- Compliance-ready reporting

### 4. Role-Based Access Control

- Granular permission assignment
- Approval workflows with limits
- Data visibility scoping
- Module-level restrictions

---

## User Data Model

### EnhancedAppUser Structure

```typescript
{
  id: string;                    // Unique user ID
  username: string;              // Login username
  email: string;                 // Email address
  fullName: string;              // Full name
  phone: string;                 // Contact number
  jobTitle: string;              // Job title/position
  department: string;            // Department assignment
  roleTemplate: RoleTemplateKey; // Role (e.g., "owner", "admin")
  userType: UserType;            // "Internal User", "Client User", "Vendor User"
  organization: string;          // Organization name
  status: "Active" | "Inactive" | "Suspended" | "Pending Activation";
  passwordHash: string;          // Hashed password
  requiresPasswordReset: boolean; // Force password change
  createdAt: string;             // Creation timestamp
  updatedAt: string;             // Last update timestamp
  createdBy: string;             // Admin who created user
  lastLogin?: string;            // Last login timestamp
  loginAttempts: number;         // Failed login count
  isLocked: boolean;             // Account locked flag
  lockedUntil?: string;          // Lock expiration time
  twoFactorEnabled: boolean;     // 2FA status
  approvalLimit?: number;        // Max approvable amount
  canApproveOrders?: boolean;    // Approval capability
}
```

### UserInvitation Structure

```typescript
{
  id: string;                    // Invitation ID
  email: string;                 // Invitee email
  role: RoleTemplateKey;         // Role to assign
  userType: UserType;            // User type
  department?: string;           // Department (optional)
  temporaryPassword: string;     // Auto-generated
  status: "pending" | "accepted" | "expired";
  sentAt: string;                // Sent timestamp
  expiresAt: string;             // Expiration (7 days)
  acceptedAt?: string;           // Acceptance time
  invitedBy: string;             // Inviting user ID
}
```

### AuditLog Structure

```typescript
{
  id: string;                    // Log entry ID
  timestamp: string;             // When action occurred
  userId: string;                // Who performed action
  userName: string;              // User's name
  action: ActionType;            // create|update|delete|login|logout|export|approve
  entityType: EntityType;        // What was affected
  entityId: string;              // Record ID of affected entity
  entityName: string;            // Display name
  changes?: ChangeRecord[];      // Before/after values
  status: "success" | "failed";  // Operation result
  details?: string;              // Additional context
}
```

---

## Usage Examples

### Creating a New Internal Employee

```
1. Navigate to /users/management
2. Click "Add User"
3. Fill form:
   - Full Name: John Doe
   - Email: john@nidotech.com
   - Job Title: Procurement Officer
   - Department: Procurement
   - User Type: Internal User
   - Role: Procurement Specialist
4. Click "Create User"
→ System generates temporary password
→ Sends invitation email
→ User can login with temp password
→ Required to change password on first login
```

### Assigning Permissions

Permissions are **automatically assigned based on user's role**:

- Role templates have predefined permissions
- Cannot override individual module permissions (use role templates)
- To grant user special permissions, create new role or promote to higher role

### Onboarding a Client Team

```
1. Go to /users/invitations
2. Send invitations to:
   - client-admin@corporation.com → Role: "Client Admin"
   - user1@corporation.com → Role: "Client User"
   - user2@corporation.com → Role: "Client User"
3. Specify User Type: "Client User" for all
4. System sends emails with 7-day activation links
5. Each user clicks link, sets password, gains access
→ Client Admin: Full access to client data with ₹1M approval limit
→ Client Users: Limited access to own records only
```

### Multi-Department Organization Setup

```
Departments Created:
- Procurement (Manager: Admin User)
- Finance (Manager: Finance Manager)
- Operations (Manager: Operations Head)

Users Assigned:
- Procurement: 5 staff (Procurement Specialists)
- Finance: 3 staff (AP Officers, Accountants)
- Operations: 2 staff (Employees)

Result:
- Each user sees only their department data
- Department managers can approve within limits
- Audit trail shows all cross-department activities
```

### Vendor Collaboration Setup

```
1. Create vendor account
   - Email: vendor@company.com
   - Role: Vendor Admin
   - User Type: Vendor User
2. Send invitation
3. Vendor activates account
4. Vendor can:
   ✓ View own records only
   ✓ See orders/invoices related to them
   ✗ Cannot access other vendors' data
   ✗ Cannot approve orders
   ✗ Cannot view prices/terms for others
```

---

## Migration from Old System

If you have existing UsersPage setup, the new system:

- ✓ Maintains backward compatibility
- ✓ Keeps existing data intact
- ✓ Adds new capabilities without breaking changes
- ✓ Old routes still work
- ✓ New routes available alongside

**Access Both:**

- Old: `/users` (basic user page)
- New: `/users/management` (enhanced management)

---

## Best Practices

### 1. Least Privilege Principle

- Assign minimum required permissions
- Regular permission audits
- Remove access when role changes
- Quarterly permission reviews

### 2. Separation of Duties

- Procurement ≠ Approval
- Finance ≠ Operations
- Vendor ≠ Client data visibility
- Critical actions need multi-level approval

### 3. Onboarding Process

1. Create user account
2. Send invitation email
3. User sets password
4. Verify email
5. Grant specific access
6. Provide training
7. Log initial login (audit trail)

### 4. Offboarding Process

1. Remove active sessions
2. Disable account (status → Suspended)
3. Audit their recent actions
4. Archive user data
5. Log deprovisioning (audit trail)

### 5. Account Management

- Monthly inactive user report
- Quarterly permission review
- Annual role assessment
- Change log monitoring

---

## Compliance & Auditing

### GDPR Compliance

- Audit trail retention policies
- User data export capability
- Right to be forgotten (soft delete)
- Data minimization applied

### Financial Controls

- Approval limits enforced
- Dual approval for high amounts
- Approval chain visibility
- Unauthorized action detection

### Security Auditing

- Failed login tracking
- Permission escalation detection
- High-risk action alerts
- Session anomaly detection

---

## Technical Implementation Details

### Storage

- **Type**: localStorage (can be swapped with backend API)
- **Keys**:
  - `nido_auth_user` - Current user session
  - `nido_auth_users` - All users database
  - `nido_auth_departments` - Department structure
  - `nido_auth_invitations` - Pending invitations
  - `nido_auth_audit_logs` - Activity audit trail

### Type Safety

- Full TypeScript support
- Discriminated unions for type safety
- Runtime validation for localStorage
- IDE autocomplete for all operations

### Performance

- Memoized permission checks
- Fast filter operations
- Indexed audit log searches
- Efficient state updates

---

## Future Enhancements

### Phase 2

- Two-factor authentication (2FA)
- Single sign-on (SSO) integration
- OAuth2 provider support
- Advanced audit analytics

### Phase 3

- Machine learning for anomaly detection
- Predictive permission suggestions
- Role auto-assignment based on job title
- Integration with HR systems

### Phase 4

- API-based user provisioning
- Just-in-time access (JIT)
- Cloud identity provider integration
- Federated identity management

---

## Support & Troubleshooting

### Common Issues

**Q: User can't login after creation**
A: Check if account status is "Active", not "Suspended" or "Pending"

**Q: Permission denied error**
A: Verify user's role has permission for that module/action

**Q: Bulk import failed**
A: Check CSV format matches template, no duplicate emails

**Q: Audit log not showing activity**
A: Refresh page, check filters, verify date range

---

## Contact & Support

For implementation questions or feature requests:

- Documentation: `/users/roles` (built-in guide)
- Demo Access: owner@nidotech.com / password
- Audit Trail: `/users/audit-trail` (activity history)

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Status**: Production Ready
