import type { Access, FieldAccess } from 'payload'

type UserWithRoles = {
  id: number | string
  roles?: ('admin' | 'user')[]
  [key: string]: unknown
}

// Helper to safely get user with roles
const getUserWithRoles = (user: unknown): UserWithRoles | null => {
  if (!user || typeof user !== 'object') return null
  return user as UserWithRoles
}

// Check if user is an admin
export const isAdmin: Access = ({ req: { user } }) => {
  const u = getUserWithRoles(user)
  return Boolean(u?.roles?.includes('admin'))
}

// Check if user is authenticated (any role)
export const isAuthenticated: Access = ({ req: { user } }) => {
  return Boolean(user)
}

// Check if user is a customer (authenticated but not admin)
export const isCustomer: FieldAccess = ({ req: { user } }) => {
  const u = getUserWithRoles(user)
  return Boolean(u && !u?.roles?.includes('admin'))
}

// Admin only field access
export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  const u = getUserWithRoles(user)
  return Boolean(u?.roles?.includes('admin'))
}

// Admin or published status
export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  const u = getUserWithRoles(user)
  if (u && Boolean(u?.roles?.includes('admin'))) {
    return true
  }
  return {
    _status: {
      equals: 'published',
    },
  }
}

// Check if user owns the document
export const isDocumentOwner: Access = ({ req: { user } }) => {
  const u = getUserWithRoles(user)
  if (u && Boolean(u?.roles?.includes('admin'))) {
    return true
  }

  if (u?.id) {
    return {
      customer: {
        equals: u.id,
      },
    }
  }

  return false
}
