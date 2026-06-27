function AssignmentService_listByReport_(reportId, userMap, permissions) {
  const safeUserMap = userMap || {};
  const canViewInternal = ReportService_canViewInternalNotes_(permissions);

  return SheetRepository_list_("assignments", {
    keyColumnName: "assignment_id",
    page: 1,
    pageSize: 100
  }).items.filter(function (assignment) {
    return String(assignment.report_id || "") === String(reportId || "");
  }).sort(function (left, right) {
    return String(left.assigned_at || left.created_at || "").localeCompare(String(right.assigned_at || right.created_at || ""));
  }).map(function (assignment) {
    const assignedToId = String(assignment.assigned_to || "");
    const assignedById = String(assignment.assigned_by || "");
    const assignedTo = assignedToId && safeUserMap[assignedToId] ? safeUserMap[assignedToId] : null;
    const assignedBy = assignedById && safeUserMap[assignedById] ? safeUserMap[assignedById] : null;

    return {
      assignmentId: String(assignment.assignment_id || ""),
      reportId: String(assignment.report_id || ""),
      assignedTo: assignedToId,
      assignedToName: assignedTo ? assignedTo.displayName : "",
      assignedBy: assignedById,
      assignedByName: assignedBy ? assignedBy.displayName : "",
      note: canViewInternal ? Security_sanitizeText_(assignment.note || "") : "",
      assignedAt: String(assignment.assigned_at || ""),
      targetDueAt: String(assignment.target_due_at || ""),
      completedAt: String(assignment.completed_at || ""),
      unassignedAt: String(assignment.unassigned_at || ""),
      assignmentStatus: Security_sanitizeText_(assignment.assignment_status || ""),
      createdAt: String(assignment.created_at || ""),
      version: Number(assignment.version || 0)
    };
  });
}
