import { DepartmentReportsPanel } from './DepartmentReportsPanel';

/** @deprecated Use DepartmentReportsPanel with department prop from dashboard */
export function ReportsTab({ department = 'landfill' }: { department?: string }) {
  return <DepartmentReportsPanel title="Department Reports" department={department} />;
}
