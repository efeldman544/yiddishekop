// Shared between the server page and the client component. Must NOT live in a
// 'use client' file: the server page calls this inside a sort comparator, and
// calling a client-module export from a server component throws
// "Attempted to call employerLabel() from the server".

export type EmployerOption = {
  id: string
  company_name: string | null
  full_name: string | null
}

export function employerLabel(emp: EmployerOption) {
  return emp.company_name || emp.full_name || emp.id
}
