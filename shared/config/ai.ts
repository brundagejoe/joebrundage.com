const rawAllowedRoles = process.env.AI_ALLOWED_ROLES

function parseAllowedRoles(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(",")
    .map((role) => role.trim())
    .filter((role) => role.length > 0)
}

export function getAllowedAiRoles(): string[] {
  return parseAllowedRoles(rawAllowedRoles)
}
