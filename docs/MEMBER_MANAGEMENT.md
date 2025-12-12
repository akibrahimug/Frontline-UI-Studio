# Workspace Member Management

## Overview
The workspace member management feature allows workspace owners to invite other users to collaborate on their workspaces and manage their permissions.

## Features

### For Workspace Owners

#### Invite Members
1. Navigate to your workspace
2. Click "Manage Members" button
3. Enter the user's email address
4. Select their role (Editor or Viewer)
5. Click "Add Member"

**Note:** The user must already have an account in the system. They need to sign up first before they can be invited.

#### Member Roles
- **Owner**: Full control over the workspace, can manage members (auto-assigned to workspace creator)
- **Editor**: Can view and edit components in the workspace
- **Viewer**: Can only view components, cannot make changes

#### Change Member Roles
1. Go to the Members page
2. Use the role dropdown next to any member (except the owner)
3. Select the new role
4. Changes are applied immediately

#### Remove Members
1. Go to the Members page
2. Click "Remove" button next to the member you want to remove
3. Confirm the action
4. The member will no longer have access to the workspace

**Note:** You cannot remove the workspace owner.

### For All Members

#### View Members
All workspace members can see:
- List of all members in the workspace
- Each member's role
- When they joined (ordered by join date)

### Access Control

With the membership system:
- ✅ Members can access all components in the workspace
- ✅ Members can use realtime collaboration features
- ✅ Members see the workspace in their workspace list
- ✅ Non-members cannot access the workspace or its components
- ✅ Helpful error messages guide users when access is denied

## User Flows

### Adding a Collaborator

**Scenario:** You want to invite a colleague to work on components in your workspace.

1. **Colleague creates account** (if they don't have one)
   - They visit your app and sign up
   - They note the email they used

2. **You invite them**
   - Go to your workspace
   - Click "Manage Members"
   - Enter their email address
   - Select "Editor" role
   - Click "Add Member"

3. **They can now access the workspace**
   - The workspace appears in their workspace list
   - They can view and edit all components
   - They can collaborate in realtime

### Viewing a Shared Workspace

**Scenario:** Someone invited you to their workspace.

1. Sign in to your account
2. Go to "Workspaces"
3. You'll see both:
   - Workspaces you own
   - Workspaces where you're a member
4. Click on the shared workspace to access it

### Error Handling

If you try to access a workspace/component you're not a member of:
- ❌ You'll see a clear error message
- 💡 Helpful tip explaining how to get access
- 🔗 Links to navigate back to your workspaces

## Technical Details

### Database Schema
```prisma
model WorkspaceMember {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        String   // "owner" | "editor" | "viewer"
  createdAt   DateTime @default(now())

  workspace Workspace @relation(...)
  user      User      @relation(...)

  @@unique([workspaceId, userId])
}
```

### Server Actions
Located in `src/app/actions/members.ts`:
- `getWorkspaceMembersAction()` - List all members
- `addWorkspaceMemberAction()` - Invite a new member
- `removeWorkspaceMemberAction()` - Remove a member
- `updateMemberRoleAction()` - Change a member's role

### Authorization
All actions verify:
1. User is authenticated
2. User is a workspace member (for viewing)
3. User is the workspace owner (for managing members)

### Error Codes
- `USER_NOT_FOUND` - No account exists with that email
- `ALREADY_MEMBER` - User is already in the workspace
- `WORKSPACE_ACCESS_DENIED` - User is not a workspace member
- `COMPONENT_ACCESS_DENIED` - User can't access component's workspace

## Future Enhancements

### Planned Features
- [ ] **Email Invitations**: Send invite links instead of requiring email lookup
- [ ] **Pending Invitations**: Track and manage pending invites
- [ ] **Role Permissions**: Enforce different permissions for viewer vs editor
- [ ] **Public Workspaces**: Allow sharing components publicly
- [ ] **Member Activity Log**: Track what members are doing
- [ ] **Bulk Operations**: Add/remove multiple members at once
- [ ] **Member Search**: Search through large member lists

### Role Permission Matrix (Future)

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View components | ✅ | ✅ | ✅ |
| Edit components | ✅ | ✅ | ❌ |
| Create components | ✅ | ✅ | ❌ |
| Delete components | ✅ | ✅ | ❌ |
| Set canonical version | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ |
| Manage members | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |

## Troubleshooting

### "No user found with that email address"
**Problem:** The email you entered doesn't match any registered user.
**Solution:** Ask the person to create an account first, then use their exact email address.

### "This user is already a member"
**Problem:** The user is already in the workspace.
**Solution:** Check the members list - they may already have access.

### "Only workspace owners can add members"
**Problem:** You're trying to invite someone but you're not the owner.
**Solution:** Ask the workspace owner to invite the person, or request owner permissions.

### Member can't see the workspace
**Problem:** You added them but they don't see the workspace.
**Solution:**
1. Verify the email address matches their account
2. Ask them to refresh their workspace list
3. Check they're signed in with the correct account

## API Reference

### Add Member
```typescript
await addWorkspaceMemberAction(
  workspaceId: string,
  email: string,
  role: "editor" | "viewer"
)
```

### Remove Member
```typescript
await removeWorkspaceMemberAction(
  workspaceId: string,
  memberUserId: string
)
```

### Update Role
```typescript
await updateMemberRoleAction(
  workspaceId: string,
  memberUserId: string,
  newRole: "owner" | "editor" | "viewer"
)
```

### Get Members
```typescript
const members = await getWorkspaceMembersAction(workspaceId: string)
```

## Best Practices

1. **Start with Viewer Role**: When unsure, invite as viewer first, then upgrade to editor if needed
2. **Regular Audits**: Periodically review your member list and remove inactive users
3. **Clear Communication**: Tell collaborators what role they have and what they can do
4. **Use Descriptive Names**: Encourage users to set their display names for easier identification
5. **Document Workspace Purpose**: Add component descriptions so members understand the workspace

## Security Notes

- ✅ Only workspace owners can manage members
- ✅ Users can only see workspaces they're members of
- ✅ Cannot remove the workspace owner
- ✅ Cannot change the workspace owner's role
- ✅ All actions require authentication
- ✅ Email addresses are case-insensitive and trimmed
- ✅ Member changes are immediately effective (no caching issues)
